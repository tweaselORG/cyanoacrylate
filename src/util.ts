import dns from 'dns';
import type { ExecaChildProcess } from 'execa';
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
           * - `tlsFailed`: A TLS error occurred.
           * - `tlsEstablished`: TLS has been successfully established.
           * - `clientConnected`: A client connected to mitmproxy.
           * - `clientDisconnected`: A client disconnected from mitmproxy.
           * - `proxyChanged`: The proxy server configuration changed.
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
      }
    | {
          status: 'proxyChanged';
          /** An array of server specs which contains all the running servers, one for each mode. */
          servers: MitmproxyServerSpec<'wireguard' | 'regular' | string>[];
      };

/**
 * The JSON serialization of the python class mitmproxy.proxy.mode_servers.ServerInstance. See
 * https://github.com/mitmproxy/mitmproxy/blob/8f1329377147538afdf06344179c2fd90795e93a/mitmproxy/proxy/mode_servers.py#L172.
 */
type MitmproxyServerSpec<Type extends 'wireguard' | 'regular' | string> = {
    type: Type;
    description: string;
    full_spec: string;
    is_running: boolean;
    last_exception: string | null;
    listen_addrs: Array<[string, number]>;
    wireguard_conf: Type extends 'wireguard' ? string | null : never;
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
 * Wait for a mitmproxy event via IPC. Resolves a promise if the condition is true.
 *
 * @param proc A mitmproxy child process start with the IPC events plugin.
 * @param condition Condition to check the message against.
 *
 * @returns A promise resolving to the receviced message if the condition is true.
 */
export const awaitMitmproxyEvent = (proc: ExecaChildProcess<string>, condition: (msg: MitmproxyEvent) => boolean) =>
    new Promise<MitmproxyEvent>((res) => {
        const listener = (msg: MitmproxyEvent) => {
            if (condition(msg)) {
                proc.removeListener('message', listener);
                res(msg);
            }
        };

        proc.on('message', listener);
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
