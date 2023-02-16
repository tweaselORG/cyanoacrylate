import type { SupportedPlatform, SupportedRunTarget } from 'appstraction';
import { platformApi } from 'appstraction';
import timeout from 'p-timeout';
import { dnsLookup } from './util';

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

            const installApp = () => platform.installApp(getAppPathAll(appPath).join(' '));
            const setAppPermissions = (permissions?: Parameters<typeof platform.setAppPermissions>[1]) =>
                platform.setAppPermissions(id, permissions);
            const uninstallApp = () => platform.uninstallApp(id);
            const startApp = () => platform.startApp(id);

            let inProgressTrafficCollection: string | undefined;
            const startTrafficCollection = async (_name: string) => {
                if (inProgressTrafficCollection)
                    throw new Error(
                        `Cannot start new traffic collection. Previous one "${inProgressTrafficCollection}" is still running.`
                    );

                inProgressTrafficCollection = _name ?? new Date().toISOString();
                // TODO
            };
            const stopTrafficCollection = async () => {
                inProgressTrafficCollection = undefined;
                // TODO
            };

            const cleanUp = async () => {
                // TODO: Stop mitmdump, emulator?
            };
            const stop = async (stopOptions?: { uninstallApp?: boolean }) => {
                if (stopOptions?.uninstallApp) await uninstallApp();

                await cleanUp();
                if (options?.noSigint !== true) process.removeAllListeners('SIGINT');

                // TODO
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
