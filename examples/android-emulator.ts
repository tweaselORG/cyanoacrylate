/* eslint-disable no-console */
import { pause, startAnalysis } from '../src/index';

// You can pass the following command line arguments:
// `npx tsx examples/android-emulator.ts <emulator name> <snapshot name> <single apk path>`

(async () => {
    const emulatorName = process.argv[2] || 'emulator-name';
    const snapshotName = process.argv[3] || 'snapshot-with-setup-emu';
    const apkPath = process.argv[4] || 'path/to/app-files';

    const analysis = startAnalysis({
        platform: 'android',
        runTarget: 'emulator',
        capabilities: [],

        targetOptions: {
            snapshotName,
            startEmulatorOptions: {
                emulatorName,
                proxy: '127.0.0.1:8080',
            },
        },
    });

    const apps = [
        {
            main: apkPath,
        },
    ];

    // Start the emulator
    await analysis.ensureDevice();

    // The library was designed to do this for many apps in one go,
    // so you can easily loop through an array of apps.
    for (const app of apps) {
        const appAnalysis = await analysis.startAppAnalysis(app);

        await analysis.resetDevice();
        await analysis.ensureTrackingDomainResolution();

        await appAnalysis.installApp();
        await appAnalysis.setAppPermissions();
        await appAnalysis.startTrafficCollection('initial');
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
