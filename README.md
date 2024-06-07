# cyanoacrylate

> Toolkit for large-scale automated traffic analysis of mobile apps on Android and iOS.

This toolkit was designed to run traffic analyses on lots of apps without much user interaction, especially to analyze the tracking behavior of mobile apps. It supports running apps on Android and iOS, currently on physical devices as well as an emulator for Android. It uses mitmproxy to capture the device traffic and [appstraction](https://github.com/tweaselORG/appstraction) to instrument the devices.  

The current features include:

- Checking if device traffic is altered by a DNS blocker
- Starting and managing an Android emulator
- Collecting HTTP(S) traffic in HAR format
- Automatic CA management and WireGuard mitmproxy setup

## Installation  

You can install cyanoacrylate using yarn or npm (*since we install many dependencies, this process might take up to 5 minutes*):

```sh
yarn add cyanoacrylate
# or `npm i cyanoacrylate`
```

Furthermore, you might need to install some dependencies on the host machine and prepare your target device/emulator to allow for traffic inspection.

### Host dependencies

Since we install most of the needed host dependencies during when you add the package to your project, im many cases, you won’t need any additional dependencies. If you want to work with physical Android or iOS devices, some steps might be necessary, depending on your OS. You can find out what to do [in the host dependencies for appstraction](https://github.com/tweaselORG/appstraction#host-dependencies-for-android). Take a look at the README and follow the instructions to set those up.

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

## Additional metadata in exported HAR files

The HAR files that cyanoacrylate produces contain additional metadata about the analysis. We use this metadata, for example, to generate technical reports and complaints using [ReportHAR](https://github.com/tweaselORG/ReportHAR).

Here's an example of what such a HAR might look like (the actual requests in the `entries` field are omitted for brevity):

```json5
{
    "log": {
        "version": "1.2",
        "creator": {
            "name": "cyanoacrylate",
            "version": "1.0.0"
        },
        "pages": [],
        "entries": [
            // [requests and responses omitted]
        ],
        "_tweasel": {
            "startDate": "2024-04-19T08:52:48.077Z",
            "endDate": "2024-04-19T08:52:59.214Z",
            "options": {
                "mode": "allowlist",
                "apps": ["de.hafas.android.db"]
            },
            "device": {
                "platform": "android",
                "runTarget": "device",
                "osVersion": "13",
                "osBuild": "lineage_ocean-userdebug 13 TQ2A.230505.002 8c3345902f",
                "manufacturer": "motorola",
                "model": "moto g(7) power",
                "modelCodeName": "ocean",
                "architectures": "arm64-v8a,armeabi-v7a,armeabi"
            },
            "versions": {
                "appstraction": "1.0.0",
                "cyanoacrylate": "1.0.0",
                "node": "v18.13.0",
                "python": "3.11.3",
                "mitmproxy": "9.0.1"
            },
            "apps": [
                {
                    "platform": "android",
                    "id": "de.hafas.android.db",
                    "name": "DB Navigator",
                    "version": "21.12.p03.04",
                    "versionCode": "211200007",
                    "architectures": [],
                    "md5": "4f4cf346a050ea23da0da60328a4dd10"
                }
            ],
            "metaVersion": "1.0"
        }
    }
}
```

See the [type definition](docs/README.md#tweaselharmetav1) for more details on which information is included.

## License

This code is licensed under the MIT license, see the [`LICENSE`](LICENSE) file for details.

Issues and pull requests are welcome! Please be aware that by contributing, you agree for your work to be licensed under an MIT license.
