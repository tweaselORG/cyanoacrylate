import { pause } from 'appstraction';
import dns from 'dns';
import type { ExecaChildProcess } from 'execa';
import { execa } from 'execa';
import timeout from 'p-timeout';
import { promisify } from 'util';

export const dnsLookup = promisify(dns.lookup);

export const killProcess = async (proc?: ExecaChildProcess) => {
    if (proc) {
        proc.kill();
        await timeout(proc, { milliseconds: 15000 }).catch(() => proc.kill(9));
    }
};

export const awaitProcessStart = (proc: ExecaChildProcess<string>, startMessage: string) =>
    new Promise<true>((res) => {
        proc.stdout?.addListener('data', (chunk: string) => {
            if (chunk.includes(startMessage)) {
                proc.stdout?.removeAllListeners('data');
                res(true);
            }
        });
    });

// Adapted after: https://proandroiddev.com/automated-android-emulator-setup-and-configuration-23accc11a325 and
// https://gist.github.com/mrk-han/db70c7ce2dfdc8ac3e8ae4bec823ba51
export const awaitAndroidEmulator = async () => {
    const getState = async () =>
        (await execa('adb', ['shell', 'getprop', 'init.svc.bootanim'], { reject: false })).stdout;

    let animationState = await getState();
    let tries = 0;

    while (animationState !== 'stopped') {
        if (tries > 4 * 5 * 60) throw new Error('Failed to start emulator: timeout reached.');

        await pause(250);
        animationState = await getState();
        tries++;
    }
};
