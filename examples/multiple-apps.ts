/* eslint-disable no-console */
import { readdir } from 'fs/promises';
import path from 'path';
import { pause, startAnalysis } from '../src/index';

// You can pass the following command line arguments:
// `npx tsx examples/multiple-apps.ts <emulator name> <snapshot name> <path to a folder of single APKs>`

(async () => {
    const emulatorName = process.argv[2] || 'emulator-name';
    const snapshotName = process.argv[3] || 'snapshot-with-setup-emu';
    const apkFolder = process.argv[4] || 'path/to/app-files';

    const analysis = startAnalysis({
        platform: 'android',
        runTarget: 'emulator',
        capabilities: ['frida', 'certificate-pinning-bypass'],
        targetOptions: {
            snapshotName,
            startEmulatorOptions: {
                emulatorName,
            },
        },
    });

    await analysis.ensureDevice();

    // The library was designed to do this for many apps in one go,
    // so you can easily loop through an array of apps.
    const apks = await readdir(apkFolder);
    for (const apkFile of apks) {
        const appAnalysis = await analysis.startAppAnalysis(path.join(apkFolder, apkFile));

        await analysis.resetDevice();
        await analysis.ensureTrackingDomainResolution();

        await appAnalysis.installApp();
        await appAnalysis.setAppPermissions();
        await appAnalysis.startTrafficCollection();
        await appAnalysis.startApp();

        // Pause to wait for the app to generate network traffic.
        await pause(6_000);

        await appAnalysis.stopTrafficCollection();

        const result = await appAnalysis.stop();

        console.dir(result, { depth: null });
        // {
        //    app: { id: '<app id>',  name: '<app name>', version: '<app version>', ... },
        //    traffic: { '2023-03-27T10:29:44.197Z': { log: ... } }  <- The traffic collections are named by a timestamp and contain the collected requests in the HAR format.
        // }
    }

    await analysis.stop();
})();
/* eslint-enable no-console */
