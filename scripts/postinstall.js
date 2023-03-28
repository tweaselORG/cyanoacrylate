import { Buffer } from 'buffer';
import fetch from 'cross-fetch';
import { execa } from 'execa';
import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

(async () => {
    // Lifecycle scripts are always run from the project root, so this is always the same path (https://docs.npmjs.com/cli/v9/using-npm/scripts#best-practices).
    const venvRoot = '.venv';

    // Create a venv and install all python requirements
    await execa('python', ['-m', 'venv', venvRoot], { stdio: 'inherit' });
    await execa(`${venvRoot}/bin/pip`, ['install', '-r', 'requirements.txt'], {
        stdio: 'inherit',
    });

    // Download the har_dump.py addon corresponding to the current mitmproxy version
    const mitmproxyVersion = await execa(`${venvRoot}/bin/mitmdump`, ['--version']).then(
        ({ stdout }) => stdout.match(/Mitmproxy: ([0-9.]+)/)[1]
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
        .then((hardumpScript) => writeFile('mitmproxy-addons/har_dump.py', Buffer.from(hardumpScript)));

    // Start mitmproxy once to create certificate files if they don't exist, yet.
    if (!existsSync(join(homedir(), '.mitmproxy'))) {
        const mitmproxyProcess = execa(
            `${venvRoot}/bin/mitmdump`,
            ['-s', 'mitmproxy-addons/ipcEventsAddon.py', '--set', 'ipcPipeFd=3'],
            {
                stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
            }
        );
        mitmproxyProcess.on('message', (msg) => {
            if (msg.status === 'running') mitmproxyProcess.kill();
        });
    }
})();
