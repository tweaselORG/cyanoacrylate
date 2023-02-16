import type { SupportedPlatform, SupportedRunTarget } from 'appstraction';
import { platformApi } from 'appstraction';
import type { ExecaChildProcess } from 'execa';
import { execa } from 'execa';
import { readFile } from 'fs/promises';
import timeout from 'p-timeout';
import { temporaryFile } from 'tempy';
import { awaitProcessStart, dnsLookup, killProcess } from './util';

export type HotGlueOptions<Platform extends SupportedPlatform> = {
    platform: Platform;
    runTarget: SupportedRunTarget<Platform>;
    capabilities: []; // TODO!

    // TODO: Only if runTarget === 'emulator'
    // emulatorName?: string;
    snapshotName: string;
};
export type AppPath = string | { main: string; additional?: string[] };

const getAppPathMain = (appPath: AppPath) => (typeof appPath === 'string' ? appPath : appPath.main);
const getAppPathAll = (appPath: AppPath) =>
    typeof appPath === 'string' ? [appPath] : [appPath.main, ...(appPath.additional ?? [])];

export const hotGlue = <Platform extends SupportedPlatform>(options: HotGlueOptions<Platform>) => {
    const platform = platformApi({
        platform: options.platform,
        runTarget: options.runTarget,
        capabilities: [], // TODO!
        targetOptions: {}, // TODO!
    });

    return {
        platform,

        ensureDevice: () => platform.ensureDevice(), // TODO: Start emulator if necessary.
        ensureTrackingDomainResolution: async () => {
            const trackerDomains = ['doubleclick.net', 'graph.facebook.com', 'branch.io', 'app-measurement.com'];
            for (const domain of trackerDomains) {
                const res = await dnsLookup(domain);
                if (['0.0.0.0', '127.0.0.1'].includes(res.address))
                    throw new Error(
                        "Could not resolve tracker domain. Ensure that you don't have DNS blocking enabled."
                    );
            }
        },

        resetDevice: () =>
            timeout(platform.resetDevice(options.snapshotName), { milliseconds: 5 * 60 * 1000 }).catch(async () => {
                // Sometimes, the Android emulator gets stuck and doesn't accept any commands anymore. In this case, we
                // restart it.
                // TODO: `ensureDevice` doesn't (re-)start the emulator yet.
                await timeout(platform.ensureDevice(), { milliseconds: 60 * 1000 });
                await timeout(platform.resetDevice(options.snapshotName), { milliseconds: 5 * 60 * 1000 });
            }),
        startAppAnalysis: async (appPath: AppPath, options?: { resetApp?: boolean; noSigint?: boolean }) => {
            const appPathMain = getAppPathMain(appPath);
            const id = await platform.getAppId(appPathMain);
            const version = await platform.getAppVersion(appPathMain);
            if (!id) throw new Error(`Could not start analysis with invalid app: "${appPathMain}"`);

            const res: { app: { id: string; version?: string }; traffic: Record<string, string> } = {
                app: { id, version },
                traffic: {},
            };

            const installApp = () => platform.installApp(getAppPathAll(appPath).join(' '));
            const setAppPermissions = (permissions?: Parameters<typeof platform.setAppPermissions>[1]) =>
                platform.setAppPermissions(id, permissions);
            const uninstallApp = () => platform.uninstallApp(id);
            const startApp = () => platform.startApp(id);

            let inProgressTrafficCollectionName: string | undefined;
            let mitmproxyState: { proc: ExecaChildProcess; flowsOutputPath: string } | undefined;
            const startTrafficCollection = async (name: string) => {
                if (inProgressTrafficCollectionName)
                    throw new Error(
                        `Cannot start new traffic collection. Previous one "${inProgressTrafficCollectionName}" is still running.`
                    );

                inProgressTrafficCollectionName = name ?? new Date().toISOString();

                const flowsOutputPath = temporaryFile();
                mitmproxyState = {
                    proc: execa('mitmdump', ['-w', flowsOutputPath]),
                    flowsOutputPath,
                };
                await timeout(awaitProcessStart(mitmproxyState.proc, 'Proxy server listening'), {
                    milliseconds: 30000,
                });
            };
            const stopTrafficCollection = async () => {
                if (mitmproxyState?.flowsOutputPath && inProgressTrafficCollectionName) {
                    const trafficDump = await readFile(mitmproxyState?.flowsOutputPath, 'utf-8');
                    res.traffic[inProgressTrafficCollectionName] = trafficDump;
                }

                inProgressTrafficCollectionName = undefined;
                killProcess(mitmproxyState?.proc);
            };

            const cleanUp = async () => {
                killProcess(mitmproxyState?.proc);

                // TODO: Stop emulator?
            };
            const stop = async (stopOptions?: { uninstallApp?: boolean }) => {
                if (stopOptions?.uninstallApp) await uninstallApp();

                await cleanUp();
                if (options?.noSigint !== true) process.removeAllListeners('SIGINT');

                return res;
            };

            if (options?.resetApp) {
                await uninstallApp();
                await installApp();
            }

            if (options?.noSigint !== true) {
                process.removeAllListeners('SIGINT');
                process.on('SIGINT', async () => {
                    await cleanUp();
                    process.exit();
                });
            }

            return {
                app: { id, version },

                installApp,
                setAppPermissions,
                uninstallApp,
                startApp,

                startTrafficCollection,
                stopTrafficCollection,

                stop,
            };
        },
    };
};

export { pause } from 'appstraction';
