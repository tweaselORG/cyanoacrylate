import type { AppPath, PlatformApi, PlatformApiOptions, SupportedPlatform, SupportedRunTarget } from 'appstraction';
import { parseAppMeta, platformApi } from 'appstraction';
import type { ExecaChildProcess } from 'execa';
import { execa } from 'execa';
import { readFile } from 'fs/promises';
import type { Har } from 'har-format';
import { parse as parseIni, stringify as stringifyIni } from 'js-ini';
import { homedir } from 'os';
import timeout, { TimeoutError } from 'p-timeout';
import { join } from 'path';
import process from 'process';
import { temporaryFile } from 'tempy';
import { ensurePythonDependencies } from '../scripts/common/python';
import { awaitMitmproxyEvent, awaitProcessClose, dnsLookup, fileExists, killProcess } from './util';

/** A capability supported by this library. */
export type SupportedCapability<Platform extends SupportedPlatform> = Platform extends 'android'
    ? 'frida' | 'certificate-pinning-bypass'
    : Platform extends 'ios'
    ? never
    : never;

/** Metadata about an app. */
export type App = {
    /** The app's ID. */
    id: string;
    /** The app's version. */
    version?: string;
};

/**
 * Options for a traffic collection that specifies which apps to collect traffic from.
 *
 * - `mode: 'all-apps'`: Collect traffic from all apps.
 * - `mode: 'allowlist'`: Collect traffic only from the apps with the app IDs in the `apps` array.
 * - `mode: 'denylist'`: Collect traffic from all apps except the apps with the app IDs in the `apps` array.
 */
export type TrafficCollectionOptions = { mode: 'all-apps' } | { mode: 'allowlist' | 'denylist'; apps: string[] };
/** Functions that can be used to instrument the device and analyze apps. */
export type Analysis<
    Platform extends SupportedPlatform,
    RunTarget extends SupportedRunTarget<Platform>,
    Capabilities extends SupportedCapability<'android' | 'ios'>[]
> = {
    /** A raw platform API object as returned by [appstraction](https://github.com/tweaselORG/appstraction). */
    platform: PlatformApi<Platform, RunTarget, Capabilities>;
    /**
     * Assert that the selected device is connected and ready to be used with the selected capabilities. Will start an
     * emulator and wait for it to boot if necessary and a name was provided in
     * `targetOptions.startEmulatorOptions.emulatorName`.
     *
     * On Android, installs and configures WireGuard on the target and the frida-server, if the `frida` capability is
     * chosen.
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
     * @param appIdOrPath The ID of or path to the app to analyze.
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
        appIdOrPath: string | AppPath<Platform>,
        options?: { resetApp?: boolean; noSigint?: boolean }
    ) => Promise<AppAnalysis<Platform, RunTarget, Capabilities>>;
    /**
     * Start collecting the device's traffic.
     *
     * On Android, this will start a WireGuard proxy on the host computer on port `51820`. It will automatically
     * configure the target to use the WireGuard proxy and trust the mitmproxy TLS certificate. You can configure which
     * apps to include using the `options` parameter.
     *
     * On iOS, this will start a mitmproxy HTTP(S) proxy on the host computer on port `8080`. It will automatically
     * configure the target to use the proxy and trust the mitmproxy TLS certificate. You can not restrict the traffic
     * collection to specific apps.
     *
     * Only one traffic collection can be active at a time.
     *
     * @param options Set which apps to include in the traffic collection. If not specified, all apps will be included.
     *   Only available on Android.
     */
    startTrafficCollection: (options?: Platform extends 'android' ? TrafficCollectionOptions : never) => Promise<void>;
    /**
     * Stop collecting the device's traffic. This will stop the proxy on the host computer.
     *
     * @returns The collected traffic in HAR format.
     */
    stopTrafficCollection: () => Promise<Har>;
    /** Stop the analysis. This is important for clean up, e.g. stopping the emulator if it is managed by this library. */
    stop: () => Promise<void>;
};

/** Functions that can be used to control an app analysis. */
export type AppAnalysis<
    Platform extends SupportedPlatform,
    RunTarget extends SupportedRunTarget<Platform>,
    Capabilities extends SupportedCapability<'android' | 'ios'>[]
> = {
    /** The app's metadata. */
    app: App;

    /**
     * Install the specified app. This is only available if the app analysis was started with an app path, but not if it
     * was started with an app ID.
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
        permissions?: Parameters<PlatformApi<Platform, RunTarget, Capabilities>['setAppPermissions']>[1]
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
     * Force-stop the app.
     *
     * @see {@link PlatformApi}
     */
    stopApp: () => Promise<void>;

    /**
     * Start collecting the traffic of only this app on Android and of the whole device on iOS.
     *
     * On Android, this will start a WireGuard proxy on the host computer on port `51820`. It will automatically
     * configure the target to use the WireGuard proxy and trust the mitmproxy TLS certificate.
     *
     * On iOS, this will start a mitmproxy HTTP(S) proxy on the host computer on port `8080`. It will automatically
     * configure the target to use the proxy and trust the mitmproxy TLS certificate.
     *
     * Only one traffic collection can be active at a time.
     *
     * @param name An optional name to later identify this traffic collection, defaults to the current date otherwise.
     */
    startTrafficCollection: (name?: string) => Promise<void>;
    /**
     * Stop collecting the app's (or, on iOS, the device's) traffic. This will stop the proxy on the host computer.
     *
     * The collected traffic is available from the `traffic` property of the object returned by `stop()`.
     */
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
    /**
     * The collected traffic, accessible by the specified name. The traffic is available as a JSON object in the HAR
     * format (https://w3c.github.io/web-performance/specs/HAR/Overview.html).
     */
    traffic: Record<string, Har>;
};

/** The options for a specific platform/run target combination. */
// Use `unknown` here to mean "no options", and `never` to mean "not supported".
export type RunTargetOptions = {
    /** The options for the Android platform. */
    android: {
        /** The options for the Android emulator run target. */
        emulator: {
            /** Options for the emulator if you want it to be automatically started and stopped by this library. */
            startEmulatorOptions?: {
                /** The name of the emulator to start. */
                emulatorName?: string;
                /** Whether to start the emulator in headless mode (default: `false`). */
                headless?: boolean;
                /** Whether to start the emulator with audio (default: `false`). */
                audio?: boolean;
                /** Whether to discard all changes when exiting the emulator (default: `true`). */
                ephemeral?: boolean;
            };
            /** The name of a snapshot to use when resetting the emulator. */
            snapshotName?: string;
        };
        /** The options for the Android physical device run target. */
        device: unknown;
    };
    /** The options for the iOS platform. */
    ios: {
        /** The options for the iOS emulator run target. */
        emulator: never;
        /** The options for the iOS physical device run target. */
        device: {
            /** The password of the root user on the device, defaults to `alpine` if not set. */
            rootPw?: string;
            /** The device's IP address. */
            ip: string;
            /** The IP address of the host running the proxy to set up on the device. */
            proxyIp: string;
        };
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
     * run. For Android, the `wireguard` and `root` capabilities are preset in appstraction. For iOS, both the `ssh` and
     * `frida` capibilities are preset, since they are required for the analysis to work.
     */
    capabilities: Capabilities;
} & (RunTargetOptions[Platform][RunTarget] extends object
    ? {
          /** The options for the selected platform/run target combination. */
          targetOptions: RunTargetOptions[Platform][RunTarget];
      }
    : {
          /** The options for the selected platform/run target combination. */
          targetOptions?: Record<string, never>;
      });

/**
 * Initialize an analysis for the given platform and run target. Remember to call `stop()` on the returned object when
 * you want to end the analysis.
 *
 * @param analysisOptions The options for the analysis.
 *
 * @returns An object that can be used to instrument the device and analyze apps.
 */
export async function startAnalysis<
    Platform extends SupportedPlatform,
    RunTarget extends SupportedRunTarget<Platform>,
    Capabilities extends SupportedCapability<Platform>[]
>(
    analysisOptions: AnalysisOptions<Platform, RunTarget, Capabilities>
): Promise<Analysis<Platform, RunTarget, Capabilities>> {
    const { python, mitmproxyAddonsDir } = await ensurePythonDependencies({ updateMitmproxyAddons: false });

    const platformOptions = {
        platform: analysisOptions.platform,
        runTarget: analysisOptions.runTarget,
        capabilities:
            analysisOptions.platform === 'android'
                ? [...analysisOptions.capabilities, 'wireguard', 'root']
                : analysisOptions.platform === 'ios'
                ? ['ssh', 'frida']
                : analysisOptions.capabilities,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        targetOptions: analysisOptions.targetOptions as any,
    } as unknown as PlatformApiOptions<Platform, RunTarget, Capabilities>;

    const platform = platformApi(platformOptions);

    let emulatorProcess: ExecaChildProcess | undefined;
    let trafficCollectionInProgress = false;
    let mitmproxyState: { proc: ExecaChildProcess; harOutputPath: string; wireguardConf?: string } | undefined;

    const startTrafficCollection = async (options: TrafficCollectionOptions | undefined) => {
        if (trafficCollectionInProgress)
            throw new Error('Cannot start new traffic collection. A previous one is still running.');

        trafficCollectionInProgress = true;

        platform.installCertificateAuthority(join(homedir(), '.mitmproxy/mitmproxy-ca-cert.pem'));

        const harOutputPath = temporaryFile({ extension: 'har' });

        const mitmproxyOptions = [
            '--quiet', // We cannot reliably read the mitmproxy stdout anyway, so we suppress it. (See: https://github.com/tweaselORG/cyanoacrylate/issues/5)
            '-s',
            join(mitmproxyAddonsDir, 'ipcEventsAddon.py'),
            '-s',
            join(mitmproxyAddonsDir, 'har_dump.py'),
            '--set',
            `hardump=${harOutputPath}`,
            '--set',
            'ipcPipeFd=1', // Write the ipc events to stdout (which is always fd 1)
        ];
        if (analysisOptions.platform === 'android') mitmproxyOptions.push('--mode', 'wireguard');

        mitmproxyState = {
            proc: python('mitmdump', mitmproxyOptions),
            harOutputPath,
        };

        const mitmproxyPromises: Promise<unknown>[] = [
            awaitMitmproxyEvent(mitmproxyState.proc, (msg) => msg.status === 'running'),
        ];

        if (analysisOptions.platform === 'android')
            mitmproxyPromises.push(
                awaitMitmproxyEvent(
                    mitmproxyState.proc,
                    (msg) =>
                        msg.status === 'proxyChanged' &&
                        msg.servers.some((server) => server.type === 'wireguard' && server.is_running)
                )
                    .then((msg) => {
                        if (msg.status !== 'proxyChanged') throw new Error('Unreachable.'); // This will never be reached but we use it as a typeguard
                        for (const server of msg.servers) {
                            if ((server.type !== 'wireguard' && !server.wireguard_conf) || mitmproxyState === undefined)
                                continue;
                            mitmproxyState.wireguardConf = server.wireguard_conf;
                            return server.wireguard_conf;
                        }
                        throw new Error('Failed to start mitmproxy: No WireGuard proxy is running.');
                    })
                    .then((mitmproxyWireguardConf) => {
                        if (mitmproxyWireguardConf) {
                            const parsedWireguardConf = parseIni(mitmproxyWireguardConf, { autoTyping: false });

                            if (options?.mode === 'allowlist')
                                (parsedWireguardConf['Interface'] as { IncludedApplications: string })[
                                    'IncludedApplications'
                                ] = options.apps.join(', ');
                            else if (options?.mode === 'denylist')
                                (parsedWireguardConf['Interface'] as { ExcludedApplications: string })[
                                    'ExcludedApplications'
                                ] = options.apps.join(', ');

                            (
                                platform as unknown as PlatformApi<
                                    'android',
                                    RunTarget,
                                    Array<'wireguard'>,
                                    'wireguard'
                                >
                            ).setProxy(stringifyIni(parsedWireguardConf));
                        }
                    })
            );
        else if (analysisOptions.platform === 'ios')
            mitmproxyPromises.push(
                awaitMitmproxyEvent(
                    mitmproxyState.proc,
                    (msg) =>
                        msg.status === 'proxyChanged' &&
                        msg.servers.some((server) => server.type === 'regular' && server.is_running)
                ).then((msg) =>
                    (platform as unknown as PlatformApi<'ios', 'device', Array<'ssh'>, 'ssh'>).setProxy({
                        host: (analysisOptions as unknown as AnalysisOptions<'ios', 'device', never>).targetOptions
                            .proxyIp,
                        port: msg.status === 'proxyChanged' ? msg.servers[0]?.listen_addrs?.[0]?.[1] || 8080 : 8080,
                    })
                )
            );

        await timeout(Promise.all(mitmproxyPromises), {
            milliseconds: 30000,
        }).catch((e) => {
            if (e.name === 'TimeoutError') throw new TimeoutError('Starting mitmproxy failed after a timeout.');
            throw e;
        });
    };
    const stopTrafficCollection = async () => {
        if (!mitmproxyState?.proc) throw new Error('No traffic collection is running.');

        const [har] = await Promise.all([
            awaitProcessClose(mitmproxyState.proc).then(async () => {
                let _har: Har | undefined;

                if (!mitmproxyState) throw new Error('This should never happen.');

                try {
                    const trafficDump = await readFile(mitmproxyState.harOutputPath, 'utf-8');
                    _har = JSON.parse(trafficDump) as Har;
                } catch {
                    throw new Error(
                        `Reading the flows from the temporary file "${mitmproxyState.harOutputPath}" failed.`
                    );
                }

                await (
                    platform as unknown as PlatformApi<'android', RunTarget, Array<'wireguard'>, 'wireguard'>
                ).setProxy(null);
                await platform.removeCertificateAuthority(join(homedir(), '.mitmproxy/mitmproxy-ca-cert.pem'));

                /* eslint-disable require-atomic-updates */
                trafficCollectionInProgress = false;
                mitmproxyState = undefined;
                /* eslint-enable require-atomic-updates */

                return _har;
            }),
            killProcess(mitmproxyState.proc),
        ]);

        return har;
    };

    return {
        platform,

        ensureDevice: async (ensureOptions) => {
            if (ensureOptions?.killExisting) await killProcess(emulatorProcess);

            // Start the emulator if necessary and a name was provided.
            if (
                !emulatorProcess &&
                analysisOptions.platform === 'android' &&
                analysisOptions.runTarget === 'emulator'
            ) {
                const targetOptions = analysisOptions.targetOptions as
                    | RunTargetOptions['android']['emulator']
                    | undefined;
                const emulatorName = targetOptions?.startEmulatorOptions?.emulatorName;
                if (emulatorName) {
                    const cmdArgs = ['-avd', emulatorName, '-no-boot-anim'];
                    if (targetOptions?.startEmulatorOptions?.headless === true) cmdArgs.push('-no-window');
                    if (targetOptions?.startEmulatorOptions?.audio !== true) cmdArgs.push('-no-audio');
                    if (targetOptions?.startEmulatorOptions?.ephemeral !== false) cmdArgs.push('-no-snapshot-save');

                    // eslint-disable-next-line require-atomic-updates
                    emulatorProcess = execa('emulator', cmdArgs);
                    await platform.waitForDevice(150);
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
            if (analysisOptions.platform !== 'android' || analysisOptions.runTarget !== 'emulator')
                throw new Error('Resetting devices is only supported for Android emulators.');

            const snapshotName = (analysisOptions.targetOptions as RunTargetOptions['android']['emulator'])
                ?.snapshotName;
            if (!snapshotName) throw new Error('Cannot reset device: No snapshot name specified.');

            return timeout(platform.resetDevice(snapshotName), {
                milliseconds: 5 * 60 * 1000,
            }).catch(async (err) => {
                if (!(err instanceof TimeoutError)) throw err;

                // Sometimes, the Android emulator gets stuck and doesn't accept any commands anymore. In this case, we
                // restart it.
                await timeout((await this).ensureDevice({ killExisting: true }), { milliseconds: 60 * 1000 });
                await timeout(platform.resetDevice(snapshotName), { milliseconds: 5 * 60 * 1000 });
            });
        },
        startAppAnalysis: async (appIdOrPath, options) => {
            const appIdProvided = typeof appIdOrPath === 'string' && !(await fileExists(appIdOrPath));

            if (typeof appIdOrPath !== 'string' && analysisOptions.platform !== 'android')
                throw new Error('Could not install app: Split app files are only supported on Android.');

            const appMeta = await (async () => {
                if (appIdProvided) {
                    if (!(await platform.isAppInstalled(appIdOrPath)))
                        throw new Error(
                            `Could not start analysis: "${appIdOrPath}" is not installed but you only provided an app ID.`
                        );
                    return { id: appIdOrPath };
                }

                const appMeta = await parseAppMeta(appIdOrPath as AppPath<Platform>);
                if (!appMeta) throw new Error(`Could not start analysis with invalid app: "${appIdOrPath}"`);
                return appMeta;
            })();

            const res: AppAnalysisResult = {
                app: appMeta,
                traffic: {},
            };

            const installApp = () => {
                if (appIdProvided) throw new Error('Installing apps by ID is not supported.');
                return platform.installApp(appIdOrPath as AppPath<Platform>);
            };
            const uninstallApp = () => platform.uninstallApp(appMeta.id);

            let inProgressTrafficCollectionName: string | undefined;

            const cleanUpAppAnalysis = async () => {
                const internal = platform._internal as Exclude<(typeof platform)['_internal'], never>;
                if (internal && 'objectionProcesses' in internal)
                    internal.objectionProcesses?.forEach((proc) => killProcess(proc));
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
                stopApp: () => platform.stopApp(appMeta.id),

                startTrafficCollection: async (name) => {
                    inProgressTrafficCollectionName = name ?? new Date().toISOString();
                    return startTrafficCollection({ mode: 'allowlist', apps: [appMeta.id] });
                },
                stopTrafficCollection: async () => {
                    if (!inProgressTrafficCollectionName) throw new Error('No traffic collection is running.');

                    const har = await stopTrafficCollection();
                    res.traffic[inProgressTrafficCollectionName] = har;
                    inProgressTrafficCollectionName = undefined;
                },

                stop: async (stopOptions) => {
                    if (stopOptions?.uninstallApp) await uninstallApp();

                    await cleanUpAppAnalysis();
                    if (options?.noSigint !== true) process.removeAllListeners('SIGINT');

                    return res;
                },
            };
        },
        startTrafficCollection,
        stopTrafficCollection,

        stop: async () => {
            await killProcess(mitmproxyState?.proc);

            if (analysisOptions.platform === 'android' && analysisOptions.runTarget === 'emulator')
                await killProcess(emulatorProcess);
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
