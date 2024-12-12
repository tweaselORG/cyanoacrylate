/* eslint-disable no-console */
import { pause, startAnalysis } from '../src/index';

// You can pass the following command line arguments:
// `npx tsx examples/managed-android-emulator.ts <path to an APK to analyze>`

(async () => {
    const apkFile = process.argv[2];

    if (!apkFile) throw Error('Please provide an APK file as the first argument.');

    const analysis = await startAnalysis({
        platform: 'android',
        runTarget: 'emulator',
        capabilities: ['frida', 'certificate-pinning-bypass'],

        targetOptions: {
            managed: true,
            managedEmulatorOptions: {
                key: 'examples-managed-android-emulator',

                honeyData: {
                    deviceName: 'Joyce’s Android Emulator',
                    clipboard: 'CC: 5274 5520 2359 5935, CVC: 314, Exp: 01/28',
                },
            },

            startEmulatorOptions: {
                headless: true,
            },
        },
    });

    try {
        await analysis.ensureDevice();

        const appAnalysis = await analysis.startAppAnalysis(apkFile as `${string}.apk`);

        await analysis.ensureTrackingDomainResolution();

        console.log('Installing app…');
        await appAnalysis.installApp();
        console.log('Starting app…');
        await appAnalysis.startApp();

        await pause(6_000);

        await appAnalysis.stop();
    } catch (error: any) {
        // Handle the error here, e.g. queue the app for analysis again etc.
        console.error(error.message);
    }

    await analysis.stop();
    console.log('Done.');
})();
/* eslint-enable no-console */
