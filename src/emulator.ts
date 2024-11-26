import {
    createEmulator,
    ensureSdkmanager,
    getAndroidDevToolPath,
    runAndroidDevTool,
    type EmulatorOptions,
} from 'andromatic';
import { createHash } from 'crypto';
import { execa, type ExecaChildProcess, type ExecaError } from 'execa';
import type { AndroidEmulatorRunTargetOptions, SupportedCapability, SupportedPlatform } from '.';
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
    const { stdout } = await runAndroidDevTool('emulator', ['-snapshot-list']);
    return stdout.split('\n').reduce((acc, line) => {
        const [emulatorName, snapshots] = line.replaceAll(/ |\t/g, '').split(':');
        if (emulatorName && snapshots) acc = { [emulatorName]: snapshots?.split(',').filter((s) => s !== ''), ...acc };
        return acc;
    }, {});
};

export const snapshotHasCapabilties = <Platform extends SupportedPlatform>(
    snapshotName: string,
    capabilities: SupportedCapability<Platform>[]
) => {
    const snapshotRegex = /^cyanoacrylate-ensured-(.*)$/;
    const capabilityString = snapshotName.match(snapshotRegex)?.[1];
    return capabilityString && capabilityString === capabilities.sort().join('_');
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
    /** The error which produced the most recent crash. */
    lastError: ExecaError | undefined;
    /** Whether the emulator is managed by cyanoacrylate completely. */
    managed = false;
    /**
     * The options for `createEmulator()` used to create this emulator. Will be `undefined` if `createdByLib` is
     * `false`.
     */
    createOptions: EmulatorOptions | undefined;
    /** How many times this emulator was deleted and newly created in the current session. */
    rebuilds = 0;
    /** This is true, if the emulator process stopped. The reverse is not necessarily the case. */
    hasExited = false;

    private constructor() {
        this._abortController = new AbortController();
    }

    /** Construct an instance of Emulator from the `runTarget` passed to `startAnalysis()`. */
    static async fromRunTarget(emulatorRunTargetOptions: AndroidEmulatorRunTargetOptions): Promise<AndroidEmulator> {
        const emulator = new AndroidEmulator();

        if (emulatorRunTargetOptions.managed) {
            const infix = emulatorRunTargetOptions.infix;
            const emulatorOptions = emulatorRunTargetOptions.createEmulatorOptions;
            emulator.createOptions = emulatorOptions;

            const optionsHash = createHash('md5').update(JSON.stringify(emulatorOptions)).digest('hex');

            emulator.name = `cyanoacrylate-${infix}-${optionsHash}`;

            const emuNameRegex = new RegExp(`cyanoacrylate-${infix}-(.*)`);

            const emulatorList = await listEmulators();
            const existingEmulators = (
                await Promise.all(
                    emulatorList
                        .map((name) => ({ name, hash: name.match(emuNameRegex)?.[1] }))
                        .filter((emu) => !!emu.hash)
                        .map(async (emu) => {
                            if (emu.hash === optionsHash) return emu.name;
                            // Make sure we only delete emulators we created ourselves.
                            if (emu.name.startsWith('cyanoacrylate-')) await deleteEmulator(emu.name);
                            return undefined;
                        })
                )
            ).filter((emuName) => !!emuName);

            if (existingEmulators.length > 1) throw Error('Emulator name is not unique. This should never happen.');
            else if (existingEmulators.length === 1 && existingEmulators[0]) {
                // TODO: We skip this for now, until we implement proper management of snapshot states, so that the snapshot has the correct capabilities.
                // The current emulator exists already in the correct config, lets check for a snapshot.
                // const snapshotList = (await listSnapshots())[existingEmulators[0]];
                // emulator.resetSnapshotName = snapshotList?.find((s) => s.startsWith('cyanoacrylate-ensured'));
            } else await createEmulator(emulator.name, emulatorOptions);

            emulator.managed = true;
        } else if (emulatorRunTargetOptions.emulatorName) {
            emulator.name = emulatorRunTargetOptions.emulatorName;
            emulator.resetSnapshotName = emulatorRunTargetOptions.snapshotName;
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
        this._proc.on('exit', () => (this.hasExited = true));
        this.lastError = undefined;
        this.hasExited = false;

        return this._abortController.signal;
    }

    /** Kills the emulator process if it is running. */
    async kill() {
        await killProcess(this._proc);
        // This prevents a memory leak when we overwrite `this._proc`.
        this._proc?.removeAllListeners();
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
