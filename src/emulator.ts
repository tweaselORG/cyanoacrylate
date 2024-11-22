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
    _proc: ExecaChildProcess<string> | undefined;
    name: string | undefined;
    startArgs: string[] = ['-no-boot-anim'];
    resetSnapshotName: string | undefined;
    failedStarts = 0;
    lastError: ExecaError | undefined;
    createdByLib = false;
    createOptions: EmulatorOptions | undefined;
    rebuilds = 0;
    hasExited = false;

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
        if (options?.forceRestart && !this.hasExited && this._proc) {
            // We can do this, since `this.start()` throws away the previous process and its listeners.
            this._proc.on('exit', () => this.start());
            return this.kill();
        }
        if (this._proc && !this.hasExited) return;

        const { env } = await ensureSdkmanager();
        const toolPath = await getAndroidDevToolPath('emulator');

        if (!this.name) throw new Error('A name is missing. The emulator was not initialized.');

        this._proc = execa(toolPath, ['-avd', this.name, ...this.startArgs], { env, reject: true });
        this._proc.catch(async (error: ExecaError) => {
            if (error.signal === 'SIGTERM') return; // The process was killed intentionally.
            if (error.stdout?.includes('Failed to load snapshot')) {
                // We are trying to load a snapshot
                if (error.stdout.includes('The snapshot requires the feature'))
                    throw new EmulatorError(
                        `Loading the emulator state failed. Maybe you are trying to load a snapshot from a different emulator configuration (e.g. headless mode)?`
                    );
            }

            this.failedStarts++;
            this.lastError = error;
            if (!error.killed && !error.isCanceled) await killProcess(this._proc);
            // We need to rethrow the error in this context to halt execution.
            throw new EmulatorError(error.message);
        });
        this._proc.on('exit', () => (this.hasExited = true));
        this.lastError = undefined;
        this.hasExited = false;
    }

    async kill() {
        await killProcess(this._proc);
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
}

export class EmulatorError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EmulatorError';
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
