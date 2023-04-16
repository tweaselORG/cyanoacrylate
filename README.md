# cyanoacrylate

> Toolkit for large-scale automated traffic analysis of mobile apps on Android and iOS.

This toolkit was designed to run traffic analyses on lots of apps without much user interaction, especially to analyze the tracking behavior of mobile apps. It supports running apps on Android and iOS, currently on physical devices as well as an emulator for Android. It uses mitmproxy to capture the device traffic and [appstraction](https://github.com/tweaselORG/appstraction) to instrument the devices.  

The current features include:

- Checking if device traffic is altered by a DNS blocker
- Starting and managing an Android emulator
- Collecting HTTP(S) traffic in HAR format
- Automatic CA management and WireGuard mitmproxy setup

## Installation  

You can install cyanoacrylate using yarn or npm:

```sh
yarn add cyanoacrylate
# or `npm i cyanoacrylate`
```

Furthermore, you need to install some dependencies on the host machine and prepare your target device/emulator to allow for traffic inspection.

### Host dependencies

To use cyanoacrylate, you need a working Python installation, with a version greater than 3.8. The `postinstall` script of this package will setup a venv and install all Python dependencies you need (`mitmproxy`, `objection`, and `frida-tools`). You only need to install all the other [host dependencies for appstraction](https://github.com/tweaselORG/appstraction#host-dependencies-for-android) for your use cases. Take a look at the README and follow the instructions to install those.

## Device preparation

Take a look at the [supported (tested) targets for appstraction](https://github.com/tweaselORG/appstraction#supported-targets) and use one of those. You also need to prepare the devices according to the [instructions for appstraction](https://github.com/tweaselORG/appstraction#device-preparation).

## API reference

A full API reference can be found in the [`docs` folder](/docs/README.md).

## Example usage

The following example collects the traffic for an app in the Android emulator. It installs the app, waits for traffic and then wipes the app again:

```ts
(async () => {
    const analysis = await startAnalysis({
        platform: 'android',
        runTarget: 'emulator',
        capabilities: [],

        targetOptions: {
            snapshotName: '<snapshot name>',
            startEmulatorOptions: {
                emulatorName: '<emulator name>',
            },
        },
    });

    const app = ['<path to main APK>', '<path to split APK>'];

    // Start the emulator and ensure that everything is set up correctly.
    await analysis.ensureDevice();

    const appAnalysis = await analysis.startAppAnalysis(app);

    await appAnalysis.installApp();
    await appAnalysis.setAppPermissions();
    await appAnalysis.startTrafficCollection();
    await appAnalysis.startApp();

    // Pause to wait for the app to generate network traffic.
    await pause(6_000);

    await appAnalysis.stopTrafficCollection();
    const analysisResults = await appAnalysis.stop();
    
    await analysis.stop();
})();
```

Take a look at the [`examples/`](examples) folder for some more examples of how to use cyanoacrylate.

## License

This code is licensed under the MIT license, see the [`LICENSE`](LICENSE) file for details.

Issues and pull requests are welcome! Please be aware that by contributing, you agree for your work to be licensed under an MIT license.
