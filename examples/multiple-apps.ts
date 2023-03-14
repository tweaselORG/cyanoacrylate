/* eslint-disable no-console */
import { readdirSync } from 'fs';
import path from 'path';
import { pause, startAnalysis } from '../src/index';

// You can pass the following command line arguments:
// `npx tsx examples/multiple-apps.ts <emulator name> <snapshot name> <paths to a folder of single apks>`

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
    const apks = readdirSync(apkFolder);
    for (const apkFile of apks) {
        const appAnalysis = await analysis.startAppAnalysis({
            main: path.join(apkFolder, apkFile),
        });

        // await analysis.resetDevice();
        await analysis.ensureTrackingDomainResolution();

        await appAnalysis.installApp();
        await appAnalysis.setAppPermissions();
        await appAnalysis.startTrafficCollection();
        await appAnalysis.startApp();

        // Pause to wait for the app to generate network traffic.
        await pause(6_000);

        await appAnalysis.stopTrafficCollection();

        const res = await appAnalysis.stop();
        console.log(res);
    }

    await analysis.stop();
})();
/* eslint-enable no-console */
