import { createEmulator, ensureSdkmanager, getAndroidDevToolPath } from 'andromatic';
import { ctrlc } from 'ctrlc-windows';
import dns from 'dns';
import type { ExecaChildProcess } from 'execa';
import { execa } from 'execa';
import { access } from 'fs/promises';
import timeout from 'p-timeout';
import { promisify } from 'util';
import type { EmulatorState, StartEmulatorOptions } from '.';

/**
 * A mitmproxy certificate object representing a TLS certificate.
 *
 * @see https://docs.mitmproxy.org/stable/api/mitmproxy/certs.html#Cert
 */
export type MitmproxyCertificate = {
    /** The certificate's common name. */
    cn: string | null;
    /** The certificate's alternate names (`SubjectAlternativeName`). */
    altnames: string[];
    /** The certificate's serial number. */
    serial: number;
    /** The timestamp when the certificate becomes valid. */
    notbefore: number;
    /** The timestamp when the certificate expires. */
    notafter: number;
    /**
     * The key information of the certificate, consisting of the algorithm and the bit size.
     *
     * @example
     *
     * ```ts
     * ['RSA', 2048];
     * ```
     */
    keyinfo: [string, number];
    /** The organization name of the certificate owner. */
    organization: string | null;
    /**
     * The issuer information of the certificate, as an array of key-value pairs.
     *
     * @example
     *
     * ```ts
     * [
     *     ['C', 'US'],
     *     ['O', 'DigiCert Inc'],
     *     ['OU', 'www.digicert.com'],
     *     ['CN', 'GeoTrust TLS RSA CA G1'],
     * ];
     * ```
     */
    issuer: [string, string][];
    /**
     * The subject information of the certificate, as an array of key-value pairs.
     *
     * @example
     *
     * ```ts
     * [
     *     ['C', 'US'],
     *     ['O', 'DigiCert Inc'],
     *     ['OU', 'www.digicert.com'],
     *     ['CN', 'GeoTrust TLS RSA CA G1'],
     * ];
     * ```
     */
    subject: [string, string][];
};

/**
 * A mitmproxy connection object.
 *
 * @see https://docs.mitmproxy.org/stable/api/mitmproxy/connection.html#Connection
 */
export type MitmproxyConnection = {
    /** The connection's unique ID. */
    id: string;
    /** The connection's state. */
    state: 'CLOSED' | 'CAN_READ' | 'CAN_WRITE' | 'OPEN';
    /** The connection's protocol. */
    transportProtocol: 'tcp' | 'udp';
    /** The remote's `[ip, port]` tuple for this connection. */
    peername: [string, number] | null;
    /** The local's `[ip, port]` tuple for this connection. */
    sockname: [string, number] | null;
    /**
     * A string describing a general error with connections to this address.
     *
     * The purpose of this property is to signal that new connections to the particular endpoint should not be
     * attempted, for example because it uses an untrusted TLS certificate. Regular (unexpected) disconnects do not set
     * the error property. This property is only reused per client connection.
     */
    error: string | null;
    /**
     * `true` if TLS should be established, `false` otherwise. Note that this property only describes if a connection
     * should eventually be protected using TLS. To check if TLS has already been established, use
     * {@link MitmproxyConnection.tlsEstablished}.
     */
    tls: boolean;
    /** The TLS certificate list as sent by the peer. The first certificate is the end-entity certificate. */
    certificateList: MitmproxyCertificate[];
    /** The active cipher name as returned by OpenSSL's `SSL_CIPHER_get_name`. */
    cipher: string;
    /** Ciphers accepted by the proxy server on this connection. */
    cipherList: string[];
    /** The active TLS version. */
    tlsVersion: string | null;
    /** The Server Name Indication (SNI) sent in the ClientHello. */
    sni: string | null;
    /** Timestamp of when the TCP SYN was received (client) or sent (server). */
    timestampStart: number | null;
    /** Timestamp of when the connection has been closed. */
    timestampEnd: number | null;
    /** Timestamp of when the TLS handshake has been completed successfully. */
    timestampTlsSetup: number | null;
    /** `true` if {@link MitmproxyConnection.state} is `OPEN`, `false` otherwise. */
    connected: boolean;
    /** `true` if TLS has been established, `false` otherwise. */
    tlsEstablished: boolean;
};

/**
 * Mitmproxy's event data for the `tls_start_client`, `tls_start_server`, and `tls_handshake` event hooks.
 *
 * @see https://docs.mitmproxy.org/stable/api/mitmproxy/tls.html#TlsData
 */
export type MitmproxyTlsData = {
    /** Convenience alias for the client address in human-readable format (`<address>:<port>`). */
    clientAddress: string;
    /** Convenience alias for the server address in human-readable format (SNI hostname or `<address>:<port>`). */
    serverAddress: string;

    /** The client connection. */
    client: MitmproxyClient;
    /** The server connection. */
    server: MitmproxyServer;
    /** If set to `true`, indicates that it is a DTLS event. */
    isDtls: boolean;
};

/**
 * A mitmproxy client object, represents a connection between a client and mitmproxy.
 *
 * @see https://docs.mitmproxy.org/stable/api/mitmproxy/connection.html#Client
 */
export type MitmproxyClient = MitmproxyConnection & {
    /** The certificate used by mitmproxy to establish TLS with the client. */
    mitmCertificate: MitmproxyCertificate | null;
    /**
     * The spec for the proxy server this client has been connecting to. This is the full proxy mode spec as entered by
     * the user.
     */
    proxyMode: string;
};

/**
 * A mitmproxy server object, representing a connection between mitmproxy and an upstream server.
 *
 * @see https://docs.mitmproxy.org/stable/api/mitmproxy/connection.html#Server
 */
export type MitmproxyServer = MitmproxyConnection & {
    /** The server's `[host, port]` address tuple. The host can either be a domain or a plain IP address. */
    address: [string, number] | null;
    /** Timestamp of when the TCP ACK was received. */
    timestampTcpSetup: number | null;
    /** An proxy server specification via which the connection should be established. */
    via: ['http' | 'https' | 'tls' | 'dtls' | 'tcp' | 'udp' | 'dns', string | number] | null;
};

/**
 * A `mitmproxy.proxy.mode_servers.ServerInstance` object.
 *
 * @see https://github.com/mitmproxy/mitmproxy/blob/8f1329377147538afdf06344179c2fd90795e93a/mitmproxy/proxy/mode_servers.py#L172.
 */
export type MitmproxyServerSpec<Type extends 'wireguard' | 'regular' | string> = {
    type: Type;
    description: string;
    fullSpec: string;
    isRunning: boolean;
    lastException: string | null;
    listenAddrs: Array<[string, number]>;
    wireguardConf: Type extends 'wireguard' ? string | null : null;
};

/** The events sent by the mitmproxy IPC events addon. */
export type MitmproxyEvent =
    | {
          /**
           * Status of the mitmproxy instance:
           *
           * - `running`: mitmproxy just started.
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
              /** Convenience alias for the client address in human-readable format (`<address>:<port>`). */
              address: [string, number];
              /** Contains additional information on the client connection. */
              client: MitmproxyClient;
          };
      }
    | {
          status: 'tlsFailed';
          context: MitmproxyTlsData & {
              /** Convenience alias for the TLS error message. */
              error: string | null;
          };
      }
    | {
          status: 'tlsEstablished';
          context: MitmproxyTlsData;
      }
    | {
          status: 'proxyChanged';
          context: {
              isRunning: boolean;
              /** An array of server specs which contains all the running servers, one for each mode. */
              servers: MitmproxyServerSpec<'wireguard' | 'regular' | string>[];
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
        if (process.platform === 'win32' && proc.pid) ctrlc(proc.pid);
        else proc.kill();
        await timeout(proc, { milliseconds: 15000 }).catch(() => proc.kill(9));
    }
};

export const onMitmproxyEvent = (proc: ExecaChildProcess<string>, callback: (msg: MitmproxyEvent) => void | 'end') => {
    const listener = (chunk: string | Buffer | undefined) => {
        const lines = chunk?.toString().split('\n') || [];
        for (const line of lines) {
            if (!line.startsWith('cyanoacrylate:')) continue;

            const msg = JSON.parse(line.replace(/^cyanoacrylate:/, '')) as MitmproxyEvent;
            if (callback(msg) === 'end') proc.stdout?.removeListener('data', listener);
        }
    };
    proc.stdout?.addListener('data', listener);
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
        onMitmproxyEvent(proc, (msg) => {
            if (condition(msg)) {
                res(msg);
                return 'end';
            }
            // To make TS happy.
            // eslint-disable-next-line no-useless-return
            return;
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

export const fileExists = async (path: string) => {
    try {
        await access(path);
        return true;
    } catch {
        return false;
    }
};

// We can't use `runAndroidDevTool` for this because that can only give you the process if you `await` it, which we
// don't want.
export const startNewEmulator = async (startEmulatorOptions: StartEmulatorOptions): Promise<EmulatorState> => {
    const emulatorName = startEmulatorOptions.createEmulator
        ? `ca-analysis-${Date.now()}`
        : startEmulatorOptions?.emulatorName;
    let createdByLib = false;

    if (!emulatorName) throw new Error('Could not start emulator: No emulator config or name.');

    if (startEmulatorOptions.createEmulator) {
        // Create an emulator
        await createEmulator(emulatorName, startEmulatorOptions.createEmulator);
        createdByLib = true;
    }

    const startArgs = ['-no-boot-anim'];
    if (startEmulatorOptions?.headless === true) startArgs.push('-no-window');
    if (startEmulatorOptions?.audio !== true) startArgs.push('-no-audio');
    if (startEmulatorOptions?.ephemeral !== false) startArgs.push('-no-snapshot-save');
    if (startEmulatorOptions?.hardwareAcceleration?.mode)
        startArgs.push('-accel', startEmulatorOptions?.hardwareAcceleration?.mode);
    if (startEmulatorOptions?.hardwareAcceleration?.gpuMode)
        startArgs.push('-gpu', startEmulatorOptions?.hardwareAcceleration?.gpuMode);

    const { env } = await ensureSdkmanager();
    const toolPath = await getAndroidDevToolPath('emulator');

    const proc = execa(toolPath, ['-avd', emulatorName, ...startArgs], { env, reject: true });

    return {
        proc,
        emulatorName,
        startArgs,
        resetSnapshotName: undefined,
        failedStarts: 0,
        createdByLib,
    };
};

export const restartEmulator = async (emulator: EmulatorState): Promise<EmulatorState> => {
    const { env } = await ensureSdkmanager();
    const toolPath = await getAndroidDevToolPath('emulator');

    const proc = execa(toolPath, ['-avd', emulator.emulatorName, ...emulator.startArgs], { env, reject: true });
    return { ...emulator, proc };
};

export const deleteEmulator = async (emulator: EmulatorState) => {
    const { env } = await ensureSdkmanager();
    const toolPath = await getAndroidDevToolPath('avdmanager');

    return execa(toolPath, ['delete', 'avd', '--name', emulator.emulatorName], { env, reject: true });
};
/*
License for the docstrings imported from mitmproxy:
Copyright (c) 2013, Aldo Cortesi. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
