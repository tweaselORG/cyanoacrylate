import {
    createEmulator,
    ensureSdkmanager,
    getAndroidDevToolPath,
    runAndroidDevTool,
    type EmulatorOptions,
} from 'andromatic';
import { createHash } from 'crypto';
import { execa, type ExecaChildProcess, type ExecaError } from 'execa';
import type { AndroidEmulatorRunTargetOptions } from '.';
import { killProcess } from './util';

/** Uses `avdmanager` to list currently existing emulators. */
export const listEmulators = async () => {
    // -c makes avdmanager return just a list of names separated by newlines.
    const { stdout } = await runAndroidDevTool('avdmanager', ['list', 'avd', '-c']);
    return stdout.split('\n');
};

export const listSnapshots = async (): Promise<{ [name: string]: string[] }> => {
    // This returns a list of snapshots of all devices
    const { stdout } = await runAndroidDevTool('emulator', ['-snapshot-list']);
    return stdout.split('\n').reduce((acc, line) => {
        const [emulatorName, snapshots] = line.replaceAll(/ |\t/g, '').split(':');
        if (emulatorName && snapshots) acc = { [emulatorName]: snapshots?.split(',').filter((s) => s !== ''), ...acc };
        return acc;
    }, {});
};

export class Emulator {
    private _abortController: AbortController;
    private _proc: ExecaChildProcess<string> | undefined;
    name: string | undefined;
    startArgs: string[] = ['-no-boot-anim'];
    resetSnapshotName: string | undefined;
    failedStarts = 0;
    lastError: ExecaError | undefined;
    createdByLib = false;
    createOptions: EmulatorOptions | undefined;
    rebuilds = 0;
    hasExited = false;

    constructor() {
        this._abortController = new AbortController();
    }

    static async fromRunTarget(emulatorRunTargetOptions: AndroidEmulatorRunTargetOptions): Promise<Emulator> {
        const emulator = new Emulator();

        if (emulatorRunTargetOptions.createEmulator) {
            const { infix, ...emulatorOptions } = emulatorRunTargetOptions.createEmulator;
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
                            await deleteEmulator(emu.name);
                            return undefined;
                        })
                )
            ).filter((emuName) => !!emuName);

            if (existingEmulators.length > 1) throw Error('Emulator name is not unique. This should never happen.');
            else if (existingEmulators.length === 1 && existingEmulators[0]) {
                // The current emulator exists already in the correct config, lets check for a snapshot.
                const snapshotList = (await listSnapshots())[existingEmulators[0]];
                if (snapshotList?.includes('cyanoacrylate-ensured'))
                    emulator.resetSnapshotName = 'cyanoacrylate-ensured';
            } else await createEmulator(emulator.name, emulatorOptions);

            emulator.createdByLib = true;
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
            if (error.stdout?.includes('Failed to load snapshot')) {
                // We are trying to load a snapshot
                if (error.stdout.includes('The snapshot requires the feature'))
                    this._abortController.abort(
                        new EmulatorError(
                            `Loading the emulator state failed. Maybe you are trying to load a snapshot from a different emulator configuration (e.g. headless mode)?`
                        )
                    );
            }

            this.failedStarts++;
            this.lastError = error;
            if (!error.killed && !error.isCanceled) await killProcess(this._proc);
            // We need to rethrow the error in this context to halt execution.
            this._abortController.abort(EmulatorError.fromExecaError(error));
        });
        this._proc.on('exit', () => (this.hasExited = true));
        this.lastError = undefined;
        this.hasExited = false;

        return this._abortController.signal;
    }

    async kill() {
        await killProcess(this._proc);
        // This prevents a memory leak when we overwrite `this._proc`.
        this._proc?.removeAllListeners();
    }

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

    getAbortSignal() {
        return this._abortController.signal;
    }
}

export class EmulatorError extends Error {
    consoleOutput: string | undefined;
    emulatorCommand: string | undefined;
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

export const deleteEmulator = async (emulatorName: string) => {
    const { env } = await ensureSdkmanager();
    const toolPath = await getAndroidDevToolPath('avdmanager');

    return execa(toolPath, ['delete', 'avd', '--name', emulatorName], {
        env,
        reject: true,
    });
};
