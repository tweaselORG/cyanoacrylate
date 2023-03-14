# cyanoacrylate

> Toolkit for large-scale automated traffic analysis of mobile apps on Android and iOS.

This toolkit was designed to run traffic analyses on lots of apps without much user interaction, especially to analize the tracking behavior of mobile apps. It supports running apps on Android and iOS, currently on physical devices as well as an emulator for Android. It uses mitmproxy to capture the device traffic and [appstraction](https://github.com/tweaselORG/appstraction) to instrument the devices.  

The current features include:

- Checking if device traffic is altered by a DNS blocker
- Starting and managing an Android emulator
- Collecting HTTP(S) traffic in HAR format
- Automatic CA management and WireGuard mitmproxy setup

**Currently, this module only supports POSIX environments. It will not run on Windows out of the box.**

## Installation  

You can install cyanoacrylate using yarn or npm:

```sh
yarn add cyanoacrylate
# or `npm i cyanoacrylate`
```

Furthermore, you need to install some dependencies on the host machine and prepare your target device/emulator to allow for traffic inspection.

### Host dependencies

Look at the [host dependencies for appstraction](https://github.com/tweaselORG/appstraction#host-dependencies-for-android) for your use cases and follow the instructions to install those.

Also, install `mitmproxy`. We recommend installing it in some kind of separated python environment, e.g. with [pipx](https://pypa.github.io/pipx/):

```zsh
pipx install mitmproxy
```

And then download two addon scripts: [`har_dump.py`](https://github.com/mitmproxy/mitmproxy/blob/main/examples/contrib/har_dump.py) from the mitmproxy contrib examples and [`ipc_events_addons.py`](https://github.com/tweaselORG/mitmproxy-ipc-events-addon) to allow the processes to communicate. We recommend to download them into the default folder, which is `./mitmproxy-addons`, but you can configure a different folder in the `mitmproxyAddons` option of `startAnalysis()`. To download the scripts, you can use the following commands:

```zsh
mkdir -p mitmproxy-addons
wget https://github.com/mitmproxy/mitmproxy/raw/main/examples/contrib/har_dump.py -O mitmproxy-addons/har_dump.py
wget https://github.com/tweaselORG/mitmproxy-ipc-events-addon/raw/main/ipc_events_addon.py -O mitmproxy-addons/ipc_events_addon.py
```

## Device preparation

Take a look at the [supported (tested) targets for appstraction](https://github.com/tweaselORG/appstraction#supported-targets) and use one of those. You also need to prepare the devices according to the [instructions for appstraction](https://github.com/tweaselORG/appstraction#device-preparation).

## API reference

A full API reference can be found in the [`docs` folder](/docs/README.md).

## Example usage

The following example collects the traffic for an app in the Android emulator. It installs the app, waits for traffic and then wipes the app again:

```ts
(async () => {
    const analysis = startAnalysis({
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

    const app = {
        main: '<path to main APK>',
        additional: ['<path to split APK>']
    };

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
