// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { Buffer } from 'buffer';
import fetch from 'cross-fetch';
import { execa } from 'execa';
import { existsSync } from 'fs';
import { copyFile, mkdir, writeFile } from 'fs/promises';
import globalCacheDir from 'global-cache-dir';
import { homedir } from 'os';
import { join } from 'path';

// Set up our Python dependencies (a venv with the modules from `requirements.txt` and the mitmproxy addons).
// This is meant to be run in the `postinstall` script. It will always install the full set of dependencies, regardless
// of whether they are already installed.
export const setupPythonDependencies = async () => {
    const cacheDir = await globalCacheDir('cyanoacrylate');

    const venvDir = join(cacheDir, 'venv');
    const mitmproxyAddonsDir = join(cacheDir, 'mitmproxy-addons');
    await mkdir(mitmproxyAddonsDir, { recursive: true });

    // eslint-disable-next-line no-undef
    const pipBinary = process.platform === 'win32' ? join(venvDir, 'Scripts/pip.exe') : join(venvDir, 'bin/pip');
    const mitmdumpBinary =
        // eslint-disable-next-line no-undef
        process.platform === 'win32' ? join(venvDir, 'Scripts/mitmdump.exe') : join(venvDir, 'bin/mitmdump');

    // Create a venv and install all python requirements
    await execa('python', ['-m', 'venv', venvDir], { stdio: 'inherit' });
    await execa(pipBinary, ['install', '-r', 'requirements.txt'], { stdio: 'inherit' });

    // Download the har_dump.py addon corresponding to the current mitmproxy version
    const mitmproxyVersion = await execa(mitmdumpBinary, ['--version']).then(
        ({ stdout }) => stdout.match(/Mitmproxy: ([0-9.]+)/)?.[1]
    );
    const mitmproxyCommitSha = await fetch(
        `https://api.github.com/repos/mitmproxy/mitmproxy/git/ref/tags/${mitmproxyVersion}`
    )
        .then((res) => res.json())
        .then((ref) => ref.object.sha);
    await fetch(
        `https://raw.githubusercontent.com/mitmproxy/mitmproxy/${mitmproxyCommitSha}/examples/contrib/har_dump.py`
    )
        .then((res) => res.arrayBuffer())
        .then((hardumpScript) => writeFile(join(mitmproxyAddonsDir, 'har_dump.py'), Buffer.from(hardumpScript)));

    // Copy the ipcEventsAddon.py addon to the mitmproxy addons directory
    await copyFile(
        // eslint-disable-next-line no-undef
        new URL('../../src/ipcEventsAddon.py', import.meta.url),
        join(mitmproxyAddonsDir, 'ipcEventsAddon.py')
    );

    // Start mitmproxy once to create certificate files if they don't exist, yet.
    if (!existsSync(join(homedir(), '.mitmproxy'))) {
        const mitmproxyProcess = execa(mitmdumpBinary, [
            '-q',
            '-s',
            join(mitmproxyAddonsDir, 'ipcEventsAddon.py'),
            '--set',
            'ipcPipeFd=1',
        ]);
        mitmproxyProcess.stdout?.addListener('data', (data) => {
            const lines = data?.toString().split('\n') || [];
            for (const line of lines) {
                if (!line.startsWith('cyanoacrylate:')) continue;

                const msg = JSON.parse(line.replace(/^cyanoacrylate:/, ''));
                if (msg.status === 'running') mitmproxyProcess.kill();
            }
        });
    }
};

// This is a lighter version of `setupPythonDependencies`. It only installs if certain key files are missing.
// This isn't an exhaustive check but many orders of magnitude faster in the regular case (i.e. the dependencies are
// already installed). It is meant to always be run before an analysis is started.
export const ensurePythonDependencies = async () => {
    const pathsThatNeedToExist = [
        // The one file that exists both in Windows and *nix venvs.
        'venv/pyvenv.cfg',
        'mitmproxy-addons/har_dump.py',
        'mitmproxy-addons/ipcEventsAddon.py',
    ];

    const cacheDir = await globalCacheDir('cyanoacrylate');

    if (pathsThatNeedToExist.some((path) => !existsSync(join(cacheDir, path)))) await setupPythonDependencies();
};
