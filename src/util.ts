import { pause } from 'appstraction';
import dns from 'dns';
import type { ExecaChildProcess } from 'execa';
import { execa } from 'execa';
import timeout from 'p-timeout';
import { promisify } from 'util';

/** The events sent by the mitmproxy IPC events addon. */
type MitmproxyEvent =
    | {
          /**
           * Status of the mitmproxy instance:
           *
           * - `runnning`: mitmproxy just started.
           * - `done`: mitmproxy shut down.
           * - `tls_failed`: A TLS error occurred.
           * - `tls_established`: TLS has been successfully established.
           * - `client_connected`: A client connected to mitmproxy.
           * - `client_disconnected`: A client disconnected from mitmproxy.
           */
          status: 'running' | 'done';
      }
    | {
          status: 'clientConnected' | 'clientDisconnected';
          /** Contains additional information on the status such as the connected client address. */
          context: {
              /** IP address and port of the client as an array (from mitmproxy’s `connection.Client.peername`). */
              address: [string, number];
          };
      }
    | {
          status: 'tlsFailed';
          context: {
              /** IP address and port of the client as an array (from mitmproxy’s `connection.Client.peername`). */
              clientAddress: [string, number];
              /**
               * IP address or hostname and port of the server as a string (from mitmproxy’s
               * `connection.Server.address`).
               */
              serverAddress: string;
              /** If an error occured, contains an error message (from mitmproxy’s `connection.Connection.error`). */
              error?: string;
          };
      }
    | {
          status: 'tlsEstablished';
          context: {
              /** IP address and port of the client as an array (from mitmproxy’s `connection.Client.peername`). */
              clientAddress: [string, number];
              /**
               * IP address or hostname and port of the server as a string (from mitmproxy’s
               * `connection.Server.address`).
               */
              serverAddress: string;
          };
      };

/** A promise wrapper around `dns.lookup`. */
export const dnsLookup = promisify(dns.lookup);

/**
 * The function tries to kill a child process gracefully by sending a SIGINT and if the process didn’t exit, it sends a
 * SIGKILL to force kill it.
 */
export const killProcess = async (proc?: ExecaChildProcess) => {
    if (proc) {
        proc.kill();
        await timeout(proc, { milliseconds: 15000 }).catch(() => proc.kill(9));
    }
};

/**
 * Wait for a mitmproxy event status via IPC. Resolves a promise if the status is received.
 *
 * @param proc A mitmproxy child process start with the IPC events plugin.
 * @param status The status to wait for.
 */
export const awaitMitmproxyStatus = (proc: ExecaChildProcess<string>, status: MitmproxyEvent['status']) =>
    new Promise<true>((res) => {
        proc.on('message', (msg: MitmproxyEvent) => {
            if (msg.status === status) res(true);
        });
    });

/**
 * Wait for a message to appear in stdout and resolve the promise if the message is detected.
 *
 * @param proc A child process.
 * @param startMessage The message to look for in stdout.
 */
export const awaitProcessStart = (proc: ExecaChildProcess<string>, startMessage: string) =>
    new Promise<true>((res) => {
        proc.stdout?.addListener('data', (chunk: string) => {
            if (chunk.includes(startMessage)) {
                proc.stdout?.removeAllListeners('data');
                res(true);
            }
        });
    });

/**
 * Wait for a process to close, meaning it stopped completely and closed the stdout, and resolve the promise if it did.
 *
 * @param proc A child processs.
 */
export const awaitProcessClose = (proc: ExecaChildProcess<string>) =>
    new Promise<true>((res) => {
        proc.on('close', () => res(true));
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
