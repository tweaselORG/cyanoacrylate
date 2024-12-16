import {
    createEmulator,
    ensureSdkmanager,
    getAndroidDevToolPath,
    runAndroidDevTool,
    type EmulatorOptions,
} from 'andromatic';
import { execa, type ExecaChildProcess, type ExecaError } from 'execa';
import { existsSync } from 'fs';
import { readdir } from 'fs/promises';
import hashObject from 'hash-object';
import { homedir } from 'os';
import { join } from 'path';
import type { AndroidEmulatorRunTargetOptions, SupportedCapability } from '.';
import { killProcess } from './util';

/** Uses `avdmanager -c` to list currently existing and working emulators. */
export const listEmulators = async () => {
    // -c makes avdmanager return just a list of names separated by newlines.
    // Apparently, this only includes emulators which avdmanager does not consider broken (https://github.com/tweaselORG/cyanoacrylate/pull/55/files/2119d02fc5f21c49aed2c82f02ed6b8df19862ba#r1856000182).
    const { stdout } = await runAndroidDevTool('avdmanager', ['list', 'avd', '-c']);
    return stdout.split('\n');
};

/**
 * Deletes the emulator using `avdmanager`.
 *
 * @param emulatorName The emulator to delete.
 *
 * @returns A promise which will resolve if the emulator was deleted and reject if it failed.
 */
export const deleteEmulator = async (emulatorName: string) => {
    const { env } = await ensureSdkmanager();
    const toolPath = await getAndroidDevToolPath('avdmanager');

    return execa(toolPath, ['delete', 'avd', '--name', emulatorName], { env, reject: true });
};

/**
 * Lists the available snapshots for each emulator. This only works with emulator versions 35 and higher.
 *
 * @returns An object with the device name as a keys and an array of snapshot names as a value.
 */
export const listSnapshots = async (): Promise<{ [name: string]: string[] }> => {
    // This returns a list of snapshots of all devices
    try {
        const { stdout } = await runAndroidDevTool('emulator', ['-snapshot-list']);
        return stdout.split('\n').reduce((acc, line) => {
            const [emulatorName, snapshots] = line.replaceAll(/ |\t/g, '').split(':');
            if (emulatorName && snapshots)
                acc = { [emulatorName]: snapshots?.split(',').filter((s) => s !== ''), ...acc };
            return acc;
        }, {});
    } catch {
        const avdDirectory = join(homedir(), '.android/avd');
        return Object.fromEntries(
            (
                await Promise.all(
                    (
                        await readdir(avdDirectory, { withFileTypes: true })
                    )
                        .filter((entry) => entry.isDirectory() && entry.name.endsWith('.avd'))
                        .map(async (folder) => {
                            const emulatorName = folder.name.replace('.avd', '');
                            const snaphotDir = join(avdDirectory, folder.name, 'snapshots');
                            let snapshots: string[] = [];
                            if (existsSync(snaphotDir)) snapshots = await readdir(snaphotDir);
                            return [emulatorName, snapshots];
                        })
                )
            ).filter((e) => e[1] && e[1].length > 0)
        );
    }
};

/** Delete a snapshot of the currently running emulator. */
export const deleteSnapshot = (snapshotName: string) =>
    runAndroidDevTool('adb', ['emu', 'avd', 'snapshot', 'delete', snapshotName]);

export class AndroidEmulator {
    private _abortController: AbortController;
    private _proc: ExecaChildProcess<string> | undefined;
    /** The name of the emulator used by the android tools such as `avdmanager` */
    name: string | undefined;
    /** List of arguments the `emulator` command should be started with. */
    startArgs: string[] = ['-no-boot-anim'];
    /**
     * The name of the snapshot this emulator should be reset to, if needed. If the emulator was created by the library,
     * this will be `cyanoacrylate-ensured`.
     */
    resetSnapshotName: string | undefined;
    /**
     * Number of runs in which the emulator encountered an error and crashed due to it. This is reset if you rebuild the
     * emulator.
     */
    failedStarts = 0;
    /** How often to try restarting. */
    restartLimit = 0;
    /** The error which produced the most recent crash. */
    lastError: Error | undefined;
    /** Whether the emulator is managed by cyanoacrylate completely. */
    managed = false;
    /** The options for `createEmulator()` used to create this emulator. Will be `undefined` if `managed` is `false`. */
    createOptions: EmulatorOptions | undefined;
    /** How many times this emulator was deleted and newly created in the current session. */
    rebuilds = 0;
    /** How often to try rebuilding. */
    rebuildsLimit = 1;
    /** This is true, if the emulator process stopped. The reverse is not necessarily the case. */
    hasExited = false;

    private constructor() {
        this._abortController = new AbortController();
    }

    /** Construct an instance of Emulator from the `runTarget` passed to `startAnalysis()`. */
    static async fromRunTarget(
        emulatorRunTargetOptions: AndroidEmulatorRunTargetOptions,
        capabilities: SupportedCapability<'android'>[]
    ): Promise<AndroidEmulator> {
        const emulator = new AndroidEmulator();

        if (emulatorRunTargetOptions.managed) {
            const key = emulatorRunTargetOptions.managedEmulatorOptions.key;
            // This is the maximum config which will work with arm and x86 apps on x86 CPUs (see: https://github.com/tweaselORG/appstraction/issues/54)
            const emulatorOptions = emulatorRunTargetOptions.managedEmulatorOptions.createEmulatorOptions || {
                apiLevel: 30,
                variant: 'google_apis',
                architecture: 'x86_64',
            };
            emulator.createOptions = emulatorOptions;
            emulator.rebuildsLimit = emulatorRunTargetOptions.managedEmulatorOptions.attemptRebuilds ?? 1;
            emulator.restartLimit = emulatorRunTargetOptions.startEmulatorOptions?.attemptRestarts ?? 1;

            const optionsHash = hashObject(
                {
                    emulatorOptions,
                    honeyData: emulatorRunTargetOptions.managedEmulatorOptions.honeyData,
                    capabilities,
                },
                { algorithm: 'md5' }
            );

            emulator.name = `cyanoacrylate-${key}-${optionsHash}${
                emulatorRunTargetOptions.startEmulatorOptions?.headless ? '-headless' : ''
            }`;

            const emuNameRegex = new RegExp(`cyanoacrylate-${key}-([a-fA-F0-9]{32})(-headless)?`);

            const emulatorList = await listEmulators();
            const existingEmulators = (
                await Promise.all(
                    emulatorList.map(async (name) => {
                        const matches = name.match(emuNameRegex);
                        if (!matches) return;

                        const matchedHash = matches[1];
                        const headless = matches[2] === '-headless';

                        if (
                            matchedHash === optionsHash &&
                            headless === !!emulatorRunTargetOptions.startEmulatorOptions?.headless
                        )
                            return name;
                        // Make sure we only delete emulators we created ourselves.
                        if (name.startsWith('cyanoacrylate-')) await deleteEmulator(name);
                        return undefined;
                    })
                )
            ).filter((emuName) => !!emuName);

            if (existingEmulators.length > 1) throw Error('Emulator name is not unique. This should never happen.');
            else if (existingEmulators.length === 1 && existingEmulators[0]) {
                // The current emulator exists already in the correct config, lets check for a snapshot.
                const snapshotList = (await listSnapshots())[existingEmulators[0]];
                emulator.resetSnapshotName = snapshotList?.find((s) => s.startsWith('cyanoacrylate-ensured'));
            } else await createEmulator(emulator.name, emulatorOptions);

            emulator.managed = true;
        } else if (emulatorRunTargetOptions.startEmulatorOptions) {
            emulator.name = emulatorRunTargetOptions.startEmulatorOptions.emulatorName;
            emulator.resetSnapshotName = emulatorRunTargetOptions.snapshotName;
            emulator.restartLimit = emulatorRunTargetOptions.startEmulatorOptions.attemptRestarts ?? 1;
        } else throw new Error('Could not start emulator: No emulator config or name.');

        const startEmulatorOptions = emulatorRunTargetOptions.startEmulatorOptions;
        if (startEmulatorOptions?.headless === true) emulator.startArgs.push('-no-window');
        if (startEmulatorOptions?.audio !== true) emulator.startArgs.push('-no-audio');
        if (startEmulatorOptions?.ephemeral !== false) emulator.startArgs.push('-no-snapshot-save');
        if (startEmulatorOptions?.hardwareAcceleration?.mode)
            emulator.startArgs.push('-accel', startEmulatorOptions?.hardwareAcceleration?.mode);
        if (startEmulatorOptions?.hardwareAcceleration?.gpuMode)
            emulator.startArgs.push('-gpu', startEmulatorOptions?.hardwareAcceleration?.gpuMode);

        return emulator;
    }

    /**
     * Start the emulator. If it is already running, this will do nothing, expect if `options.forceRestart` is set.
     * Then, it kills the running process and starts the emulator again.
     *
     * This also creates a new `AbortController` if the current one had been activated.
     *
     * @param options
     *
     * @returns An `AbortSignal` which is triggered if the emulator crashes.
     */
    async start(options?: { forceRestart: boolean }) {
        if (!this.name) throw new Error('A name is missing. The emulator was not initialized.');

        // Check if we already failed too often and rebuild instead.
        if (this.failedStarts > this.restartLimit) {
            if (this.rebuilds <= this.rebuildsLimit) await this.rebuild();
            else
                throw new EmulatorError(`The emulator cannot be restarted after a failed run, because the restart and rebuild limits have been reached. Your emulator configuration is likely broken.
Failed starts of the current build: ${this.failedStarts}
Attempted rebuilds: ${this.rebuilds}
Message of the last error: ${this.lastError?.message}`);
        }

        if (options?.forceRestart && !this.hasExited && this._proc) {
            // We can do this, since `this.start()` throws away the previous process and its listeners.
            this._proc.on('exit', () => this.start());
            return this.kill();
        }
        if (this._proc && !this.hasExited) return;

        const { env } = await ensureSdkmanager();
        const toolPath = await getAndroidDevToolPath('emulator');

        // AbortControllers are single use, so we need to recreate one, if the old one was used already.
        if (this._abortController.signal.aborted) this._abortController = new AbortController();

        this._proc = execa(toolPath, ['-avd', this.name, ...this.startArgs], { env, reject: true });
        this._proc.catch(async (error: ExecaError) => {
            if (error.signal === 'SIGTERM') return; // The process was killed intentionally.

            this.failedStarts++;
            this.lastError = error;
            if (!error.killed && !error.isCanceled) await killProcess(this._proc);

            if (error.stdout?.includes('Failed to load snapshot')) {
                // We are trying to load a snapshot
                if (error.stdout.includes('The snapshot requires the feature')) {
                    this._abortController.abort(
                        new EmulatorError(
                            `Loading the emulator state failed. Maybe you are trying to load a snapshot from a different emulator configuration (e.g. headless mode)?`
                        )
                    );
                    return;
                }
            }
            // We need to rethrow the error in this context to halt execution.
            this._abortController.abort(EmulatorError.fromExecaError(error));
        });
        this._proc.on('exit', () => {
            this.hasExited = true;
            // This prevents a memory leak when we overwrite `this._proc`.
            this._proc?.removeAllListeners();
        });
        this.lastError = undefined;
        this.hasExited = false;

        return this._abortController.signal;
    }

    async fail(error: Error) {
        this.failedStarts++;
        this.lastError = error;
        this._abortController.abort(error);
        await this.kill();
    }

    /** Kills the emulator process if it is running. */
    async kill() {
        await killProcess(this._proc, { killTimeoutMs: 20000 });
    }

    /** Deletes and recreates the emulator with the same configuration as the current one. */
    async rebuild() {
        if (!this.name) return;
        if (!this.createOptions)
            throw new Error('Emulators can only by rebuilt if they have been created by this library previously.');
        await this.kill();
        await deleteEmulator(this.name);
        await createEmulator(this.name, this.createOptions);

        this.failedStarts = 0;
        this.rebuilds++;
        this.hasExited = false;
        this._proc = undefined;
        this.resetSnapshotName = undefined;
    }

    /** @returns An `AbortSignal` which is triggered if the emulator crashes. */
    getAbortSignal() {
        return this._abortController.signal;
    }
}

export class EmulatorError extends Error {
    /** The emulator process’ output in stout and stderr concatenated up until the crash. */
    consoleOutput: string | undefined;
    /** The command used to start the emulator. */
    emulatorCommand: string | undefined;
    /** The signal received by the emulator process. */
    signal: string | undefined;

    constructor(message: string, context?: { consoleOutput?: string; emulatorCommand?: string; signal?: string }) {
        super(message);
        this.name = 'EmulatorError';
        this.consoleOutput = context?.consoleOutput;
        this.emulatorCommand = context?.emulatorCommand;
        this.signal = context?.signal;
    }

    static fromExecaError(error: ExecaError) {
        return new EmulatorError(error.shortMessage, {
            consoleOutput: error.stdout + error.stderr,
            emulatorCommand: error.command,
            signal: error.signal,
        });
    }
}
