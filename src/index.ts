import type { SupportedPlatform, SupportedRunTarget } from 'appstraction';
import { platformApi } from 'appstraction';
import type { ExecaChildProcess } from 'execa';
import { execa } from 'execa';
import { readFile } from 'fs/promises';
import timeout, { TimeoutError } from 'p-timeout';
import { temporaryFile } from 'tempy';
import { awaitAndroidEmulator, awaitProcessStart, dnsLookup, killProcess } from './util';

/** A capability supported by hot-glue. */
export type SupportedCapability<Platform extends SupportedPlatform> = Platform extends 'android'
    ? 'frida' | 'certificate-pinning-bypass'
    : Platform extends 'ios'
    ? 'ssh' | 'frida'
    : never;

/** The options for a specific platform/run target combination. */
// Use `unknown` here to mean "no options", and `never` to mean "not supported".
export type RunTargetOptions<
    Capabilities extends SupportedCapability<'android' | 'ios'>[],
    Capability = Capabilities[number]
> = {
    /** The options for the Android platform. */
    android: {
        /** The options for the Android emulator run target. */
        emulator: {
            /** Options for the emulator if you want it to be automatically started and stopped by hot-glue. */
            startEmulatorOptions?: {
                /** The name of the emulator to start. */
                emulatorName: string;
                /** Whether to start the emulator in headless mode (default: `false`). */
                headless?: boolean;
                /** Whether to start the emulator with audio (default: `false`). */
                audio?: boolean;
                /** Whether to discard all changes when exiting the emulator (default: `true`). */
                ephemeral?: boolean;
                /**
                 * The proxy to use for the emulator, in the format `host:port` or `user:password@host:port`. Currently
                 * defaults to `127.0.0.1:8080` (use an empty string to set no proxy), though the default will likely
                 * change to "no proxy" in the future.
                 */
                proxy?: string;
            };
            /** The name of a snapshot to use when resetting the emulator. */
            snapshotName: string;
        };
        /** The options for the Android physical device run target. */
        device: unknown;
    };
    /** The options for the iOS platform. */
    ios: {
        /** The options for the iOS emulator run target. */
        emulator: never;
        /** The options for the iOS physical device run target. */
        device: 'ssh' extends Capability
            ? {
                  /** The password of the root user on the device, defaults to `alpine` if not set. */
                  rootPw?: string;
                  /** The device's IP address. */
                  ip: string;
              }
            : unknown;
    };
};

export type HotGlueOptions<
    Platform extends SupportedPlatform,
    RunTarget extends SupportedRunTarget<Platform>,
    Capabilities extends SupportedCapability<Platform>[]
> = {
    platform: Platform;
    runTarget: RunTarget;
    capabilities: Capabilities;
} & (RunTargetOptions<Capabilities>[Platform][RunTarget] extends object
    ? {
          /** The options for the selected platform/run target combination. */
          targetOptions: RunTargetOptions<Capabilities>[Platform][RunTarget];
      }
    : {
          /** The options for the selected platform/run target combination. */
          targetOptions?: Record<string, never>;
      });
export type AppPath = string | { main: string; additional?: string[] };

const getAppPathMain = (appPath: AppPath) => (typeof appPath === 'string' ? appPath : appPath.main);
const getAppPathAll = (appPath: AppPath) =>
    typeof appPath === 'string' ? [appPath] : [appPath.main, ...(appPath.additional ?? [])];

export const hotGlue = <
    Platform extends SupportedPlatform,
    RunTarget extends SupportedRunTarget<Platform>,
    Capabilities extends SupportedCapability<Platform>[]
>(
    options: HotGlueOptions<Platform, RunTarget, Capabilities>
) => {
    const platform = platformApi({
        platform: options.platform,
        runTarget: options.runTarget,
        capabilities: options.capabilities,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        targetOptions: options.targetOptions as any,
    });

    const ensureDevice = async (ensureOptions?: { killExisting?: boolean }) => {
        if (ensureOptions?.killExisting) await killProcess(emulatorProcess);

        // Start the emulator if necessary and a name was provided.
        if (!emulatorProcess && options.platform === 'android' && options.runTarget === 'emulator') {
            const targetOptions = options.targetOptions as
                | RunTargetOptions<Capabilities>['android']['emulator']
                | undefined;
            const emulatorName = targetOptions?.startEmulatorOptions?.emulatorName;
            if (emulatorName) {
                const cmdArgs = ['-avd', emulatorName, '-no-boot-anim', '-writable-system'];
                if (targetOptions?.startEmulatorOptions?.headless === true) cmdArgs.push('-no-window');
                if (targetOptions?.startEmulatorOptions?.audio !== true) cmdArgs.push('-no-audio');
                if (targetOptions?.startEmulatorOptions?.ephemeral !== false) cmdArgs.push('-no-snapshot-save');
                if (targetOptions?.startEmulatorOptions?.proxy)
                    cmdArgs.push('-http-proxy', targetOptions.startEmulatorOptions.proxy);
                else if (targetOptions?.startEmulatorOptions?.proxy !== '')
                    cmdArgs.push('-http-proxy', '127.0.0.1:8080');

                // eslint-disable-next-line require-atomic-updates
                emulatorProcess = execa('emulator', cmdArgs);

                await awaitAndroidEmulator();
            }
        }

        return platform.ensureDevice();
    };

    let emulatorProcess: ExecaChildProcess | undefined;
    return {
        platform,

        ensureDevice,
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

        resetDevice: () => {
            if (options.platform !== 'android' || options.runTarget !== 'emulator')
                throw new Error('Resetting devices is only supported for Android emulators.');

            const snapshotName = (options.targetOptions as RunTargetOptions<Capabilities>['android']['emulator'])
                ?.snapshotName;
            if (!snapshotName) throw new Error('Cannot reset device: No snapshot name specified.');

            return timeout(platform.resetDevice(snapshotName), {
                milliseconds: 5 * 60 * 1000,
            }).catch(async (err) => {
                if (!(err instanceof TimeoutError)) throw err;

                // Sometimes, the Android emulator gets stuck and doesn't accept any commands anymore. In this case, we
                // restart it.
                await timeout(ensureDevice({ killExisting: true }), { milliseconds: 60 * 1000 });
                await timeout(platform.resetDevice(snapshotName), { milliseconds: 5 * 60 * 1000 });
            });
        },
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

            const cleanUpAppAnalysis = async () => {
                killProcess(mitmproxyState?.proc);
            };
            const stop = async (stopOptions?: { uninstallApp?: boolean }) => {
                if (stopOptions?.uninstallApp) await uninstallApp();

                await cleanUpAppAnalysis();
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
                    await cleanUpAppAnalysis();
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

        stop: async () => {
            if (options.platform === 'android' && options.runTarget === 'emulator') await killProcess(emulatorProcess);
        },
    };
};

export { pause } from 'appstraction';
