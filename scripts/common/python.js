import { getVenv } from 'autopy';
import { Buffer } from 'buffer';
import fetch from 'cross-fetch';
import { existsSync } from 'fs';
import { copyFile, mkdir, writeFile } from 'fs/promises';
import globalCacheDir from 'global-cache-dir';
import { homedir } from 'os';
import { join } from 'path';

/**
 * @param {Object} options
 * @param {boolean} options.updateMitmproxyAddons (Re-)download mitmproxy addons regardless of whether they already
 *   exist.
 */
export const ensurePythonDependencies = async (options) => {
    const cacheDir = await globalCacheDir('cyanoacrylate');
    const mitmproxyAddonsDir = join(cacheDir, 'mitmproxy-addons');
    await mkdir(mitmproxyAddonsDir, { recursive: true });

    const python = await getVenv({
        name: 'cyanoacrylate',
        pythonVersion: '~3.11',
        requirements: [{ name: 'mitmproxy', version: '~=9.0' }],
    });

    if (
        options.updateMitmproxyAddons ||
        ['har_dump.py', 'ipcEventsAddon.py'].some((path) => !existsSync(join(mitmproxyAddonsDir, path)))
    ) {
        // Download the har_dump.py addon corresponding to the current mitmproxy version.
        const mitmproxyVersion = await python('mitmdump', ['--version']).then(
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

        // Copy the ipcEventsAddon.py addon to the mitmproxy addons directory.
        await copyFile(
            // eslint-disable-next-line no-undef
            new URL('../../src/ipcEventsAddon.py', import.meta.url),
            join(mitmproxyAddonsDir, 'ipcEventsAddon.py')
        );
    }

    // Start mitmproxy once to create certificate files if they don't exist yet.
    if (!existsSync(join(homedir(), '.mitmproxy'))) {
        const mitmproxyProcess = python('mitmdump', [
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

    return { python, mitmproxyAddonsDir };
};
