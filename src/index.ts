import type { PlatformApi, SupportedPlatform, SupportedRunTarget } from 'appstraction';
import { parseAppMeta, platformApi } from 'appstraction';
import type { ExecaChildProcess } from 'execa';
import { execa } from 'execa';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import timeout, { TimeoutError } from 'p-timeout';
import { join } from 'path';
import process from 'process';
import { temporaryFile } from 'tempy';
import type { AppPath } from './path';
import { getAppPathAll, getAppPathMain } from './path';
import { awaitAndroidEmulator, awaitMitmproxyStatus, awaitProcessClose, dnsLookup, killProcess } from './util';

/** A capability supported by this library. */
export type SupportedCapability<Platform extends SupportedPlatform> = Platform extends 'android'
    ? 'frida' | 'certificate-pinning-bypass'
    : Platform extends 'ios'
    ? 'ssh' | 'frida'
    : never;

/** Metadata about an app. */
export type App = {
    /** The app's ID. */
    id: string;
    /** The app's version. */
    version?: string;
};

/** Functions that can be used to instrument the device and analyze apps. */
export type Analysis<Platform extends SupportedPlatform, RunTarget extends SupportedRunTarget<Platform>> = {
    /** A raw platform API object as returned by [appstraction](https://github.com/tweaselORG/appstraction). */
    platform: PlatformApi<Platform, RunTarget>;
    /**
     * Assert that the selected device is connected and ready to be used with the selected capabilities. Will start an
     * emulator and wait for it to boot if necessary and a name was provided in
     * `targetOptions.startEmulatorOptions.emulatorName`.
     *
     * @param options An object with the following optional options:
     *
     *   - `killExisting`: Whether to kill (and then restart) the emulator if it is already running (default: `false`).
     */
    ensureDevice: (options?: { killExisting?: boolean }) => Promise<void>;
    /**
     * Assert that a few tracking domains can be resolved. This is useful to ensure that no DNS tracking blocker is
     * interfering with the results.
     */
    ensureTrackingDomainResolution: () => Promise<void>;
    /** Reset the specified device to the snapshot specified in `targetOptions.snapshotName`. */
    resetDevice: () => Promise<void>;
    /**
     * Start an app analysis. The app analysis is controlled through the returned object. Remember to call `stop()` on
     * the object when you are done with the app to clean up and retrieve the analysis data.
     *
     * @param appPath The path to the app to analyze.
     * @param options An object with the following optional options:
     *
     *   - `resetApp`: Whether to reset (i.e. uninstall and then install) the app before starting the analysis (default:
     *       `false`). Otherwise, you have to install the app yourself using the `installApp()` function.
     *   - `noSigint`: By default, this library registers a SIGINT handler to gracefully stop the analysis when the user
     *       hits Ctrl+C. Set this option to `true` to disable this behavior.
     *
     * @returns An object to control the analysis of the specified app.
     */
    startAppAnalysis: (
        appPath: AppPath,
        options?: { resetApp?: boolean; noSigint?: boolean }
    ) => Promise<AppAnalysis<Platform, RunTarget>>;
    /** Stop the analysis. This is important for clean up, e.g. stopping the emulator if it is managed by this library. */
    stop: () => Promise<void>;
};

/** Functions that can be used to control an app analysis. */
export type AppAnalysis<Platform extends SupportedPlatform, RunTarget extends SupportedRunTarget<Platform>> = {
    /** The app's metadata. */
    app: App;

    /**
     * Install the specified app.
     *
     * @see {@link PlatformApi}
     */
    installApp: () => Promise<void>;
    /**
     * Set the permissions for the app with the given app ID. By default, it will grant all known permissions (including
     * dangerous permissions on Android) and set the location permission on iOS to `always`. You can specify which
     * permissions to grant/deny using the `permissions` argument.
     *
     * Requires the `ssh` and `frida` capabilities on iOS.
     *
     * @param permissions The permissions to set as an object mapping from permission ID to whether to grant it (`allow`
     *   to grant the permission, `deny` to deny it, `unset` to remove the permission from the permissions table). If
     *   not specified, all permissions will be set to `allow`.
     *
     *   On iOS, in addition to the actual permission IDs, you can also use `location` to set the location permission.
     *   Here, the possible values are `ask` (ask every time), `never`, `always`, and `while-using` (while using the
     *   app).
     * @see {@link PlatformApi}
     */
    setAppPermissions: (
        permissions?: Parameters<PlatformApi<Platform, RunTarget>['setAppPermissions']>[1]
    ) => Promise<void>;
    /**
     * Uninstall the app.
     *
     * @see {@link PlatformApi}
     */
    uninstallApp: () => Promise<void>;
    /**
     * Start the app.
     *
     * @see {@link PlatformApi}
     */
    startApp: () => Promise<void>;

    /**
     * Start collecting the device's traffic. This will start a proxy on the host computer on port `8080`. You need to
     * configure your device to use this proxy (unless you are using an Android emulator).
     *
     * Only one traffic collection can be active at a time.
     *
     * @param name An optional name to later identify this traffic collection, defaults to the current date otherwise.
     *
     * @todo Automatically configure the device to use the proxy (https://github.com/tweaselORG/hot-glue/issues/2).
     */
    startTrafficCollection: (name?: string) => Promise<void>;
    /** Stop collecting the device's traffic. This will stop the proxy on the host computer. */
    stopTrafficCollection: () => Promise<void>;

    /**
     * Stop the app analysis and return the collected data.
     *
     * @param options An object with the following optional options:
     *
     *   - `uninstallApp`: Whether to uninstall the app after stopping the analysis (default: `false`).
     *
     * @returns The collected data.
     */
    stop: (options?: { uninstallApp?: boolean }) => Promise<AppAnalysisResult>;
};

/** The result of an app analysis. */
export type AppAnalysisResult = {
    /** The app's metadata. */
    app: App;
    /** The collected traffic, accessible by the specified name. */
    traffic: Record<string, string>;
};

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
            /** Options for the emulator if you want it to be automatically started and stopped by this library. */
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

/** The options for the `startAnalysis()` function. */
export type AnalysisOptions<
    Platform extends SupportedPlatform,
    RunTarget extends SupportedRunTarget<Platform>,
    Capabilities extends SupportedCapability<Platform>[]
> = {
    /** The platform you want to run on. */
    platform: Platform;
    /** The target (emulator, physical device) you want to run on. */
    runTarget: RunTarget;
    /**
     * The capabilities you want. Depending on what you're trying to do, you may not need or want to root the device,
     * install Frida, etc. In this case, you can exclude those capabilities. This will influence which functions you can
     * run.
     */
    capabilities: Capabilities;
    /**
     * An object with the name of the addon and a path to the script to use with `mitmproxy -s`. It expects `ipcEvents`
     * and `harDump` to be present and defaults to `./mitmproxy-addons/ipc_events_addon.py` and
     * `./mitmproxy-addons/har_dump.py` if not set.
     */
    mitmproxyAddons?: { ipcEvents: string; harDump: string; [key: string | symbol]: string };
} & (RunTargetOptions<Capabilities>[Platform][RunTarget] extends object
    ? {
          /** The options for the selected platform/run target combination. */
          targetOptions: RunTargetOptions<Capabilities>[Platform][RunTarget];
      }
    : {
          /** The options for the selected platform/run target combination. */
          targetOptions?: Record<string, never>;
      });

/**
 * Initialize an analysis for the given platform and run target. Remember to call `stop()` on the returned object when
 * you want to end the analysis.
 *
 * @param options The options for the analysis.
 *
 * @returns An object that can be used to instrument the device and analyze apps.
 */
export function startAnalysis<
    Platform extends SupportedPlatform,
    RunTarget extends SupportedRunTarget<Platform>,
    Capabilities extends SupportedCapability<Platform>[]
>(options: AnalysisOptions<Platform, RunTarget, Capabilities>): Analysis<Platform, RunTarget> {
    const platform = platformApi({
        platform: options.platform,
        runTarget: options.runTarget,
        capabilities: options.capabilities,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        targetOptions: options.targetOptions as any,
    });

    const mitmproxyAddons = {
        ipcEvents: join(process.cwd(), 'mitmproxy-addons/ipc_events_addon.py'),
        harDump: join(process.cwd(), 'mitmproxy-addons/har_dump.py'),
        ...options.mitmproxyAddons,
    };

    let emulatorProcess: ExecaChildProcess | undefined;
    return {
        platform,

        ensureDevice: async (ensureOptions) => {
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
        },
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

        async resetDevice() {
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
                await timeout(this.ensureDevice({ killExisting: true }), { milliseconds: 60 * 1000 });
                await timeout(platform.resetDevice(snapshotName), { milliseconds: 5 * 60 * 1000 });
            });
        },
        startAppAnalysis: async (appPath, options) => {
            const appPathMain = getAppPathMain(appPath);
            const appMeta = await parseAppMeta(appPathMain);
            if (!appMeta) throw new Error(`Could not start analysis with invalid app: "${appPathMain}"`);

            const res: AppAnalysisResult = {
                app: appMeta,
                traffic: {},
            };

            const installApp = () => platform.installApp(getAppPathAll(appPath).join(' '));
            const uninstallApp = () => platform.uninstallApp(appMeta.id);

            let inProgressTrafficCollectionName: string | undefined;
            let mitmproxyState: { proc: ExecaChildProcess; harOutputPath: string } | undefined;

            const cleanUpAppAnalysis = async () => {
                killProcess(mitmproxyState?.proc);
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
                app: appMeta,

                installApp,
                setAppPermissions: (permissions) => platform.setAppPermissions(appMeta.id, permissions),
                uninstallApp,
                startApp: () => platform.startApp(appMeta.id),

                startTrafficCollection: async (name) => {
                    if (inProgressTrafficCollectionName)
                        throw new Error(
                            `Cannot start new traffic collection. Previous one "${inProgressTrafficCollectionName}" is still running.`
                        );

                    inProgressTrafficCollectionName = name ?? new Date().toISOString();

                    const harOutputPath = temporaryFile({ extension: 'har' });

                    mitmproxyState = {
                        proc: execa(
                            'mitmdump',
                            [
                                ...Object.entries(mitmproxyAddons).map(([addonName, addonPath]) => {
                                    if (!existsSync(addonPath))
                                        throw new Error(
                                            `No "${addonName}" addon for mitmproxy found at "${addonPath}".${
                                                addonName === 'ipcEvents' || addonName === 'harDump'
                                                    ? ' The mitmproxy capability requires that this addon is present.'
                                                    : ''
                                            }`
                                        );
                                    return `-s ${addonPath}`;
                                }),
                                `--set hardump=${harOutputPath}`,
                            ],
                            {
                                stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
                                env: { ...process.env, IPC_PIPE_FD: '3' },
                                shell: true, // We have to set this, because mitmdump doesn’t accept options starting with '--' as options in non-shell mode.
                            }
                        ),
                        harOutputPath,
                    };

                    await timeout(awaitMitmproxyStatus(mitmproxyState.proc, 'running'), {
                        milliseconds: 30000,
                    }).catch((e) => {
                        if (e.name === 'TimeoutError')
                            throw new TimeoutError('Starting mitmproxy failed after a timeout.');
                        throw e;
                    });
                },
                stopTrafficCollection: async () => {
                    if (!mitmproxyState?.proc) throw new Error('No traffic collection is running.');
                    await Promise.all([
                        awaitProcessClose(mitmproxyState.proc).then(async () => {
                            if (mitmproxyState?.harOutputPath && inProgressTrafficCollectionName) {
                                try {
                                    const trafficDump = await readFile(mitmproxyState?.harOutputPath, 'utf-8');
                                    res.traffic[inProgressTrafficCollectionName] = JSON.parse(trafficDump);
                                } catch {
                                    throw new Error(
                                        `Reading the flows from the temporary file @ "${mitmproxyState.harOutputPath}" failed.`
                                    );
                                }
                            }

                            inProgressTrafficCollectionName = undefined;
                            // eslint-disable-next-line require-atomic-updates
                            mitmproxyState = undefined;
                        }),
                        killProcess(mitmproxyState.proc),
                    ]);
                },

                stop: async (stopOptions) => {
                    if (stopOptions?.uninstallApp) await uninstallApp();

                    await cleanUpAppAnalysis();
                    if (options?.noSigint !== true) process.removeAllListeners('SIGINT');

                    return res;
                },
            };
        },

        stop: async () => {
            if (options.platform === 'android' && options.runTarget === 'emulator') await killProcess(emulatorProcess);
        },
    };
}

export { androidPermissions, iosPermissions, pause } from 'appstraction';
export type {
    AndroidPermission,
    DeviceAttribute,
    GetDeviceAttributeOptions,
    IosPermission,
    PlatformApi,
    SupportedPlatform,
    SupportedRunTarget,
} from 'appstraction';
export { AppPath, getAppPathAll, getAppPathMain };
