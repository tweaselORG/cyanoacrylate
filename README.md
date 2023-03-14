# cyanoacrylate

> Toolkit for large-scale automated traffic analysis of mobile apps on Android and iOS.

This toolkit was designed to run traffic analyses on lots of apps without much user interaction, to anlyse the tracking behavior of mobile apps. It supports running apps on Android and iOS, currently on physical devices as well as an emulator for android. It uses mitmproxy to capture the device traffic and [appstraction](https://github.com/tweaselORG/appstraction) to instrument the devices.  

The current features include:

- Checking if device traffic is altered by a DNS blocker
- Starting and managing an android emulator
- Collecting HTTP(S) traffic in HAR format (requires a setup CA on the device)
- Installation of split APKs

**Currently, this module does only support POSIX environments. It will not run on Windows out of the box.**

## Installation  

You can install cyanoacrylate using yarn or npm:

```sh
yarn add cyanoacrylate
# or `npm i cyanoacrylate`
```

Furthermore, you need to install some dependencies on the host machine and prepare your target device/emulator to allow for traffic inspection.

### Host dependencies

Look at the [host dependencies for appstraction](https://github.com/tweaselORG/appstraction#host-dependencies-for-android) for your use cases and follow the instructions to install those.

Also, install `mitmproxy` using pip:

```zsh
pip install mitmproxy
```

And then download two addon scripts: [`har_dump.py`](https://github.com/mitmproxy/mitmproxy/blob/main/examples/contrib/har_dump.py) from the mitmproxy contrib examples and [`ipc_events_addons.py`](https://github.com/tweaselORG/mitmproxy-ipc-events-addon) to allow the processes to communicate. We recommmend to download them into the default folder, which is `./mitmproxy-addons`, but you can configure a different folder in the `mitmproxyAddons` option of `startAnalysis()`. To download the scripts, you can use the following commands:

```zsh
mkdir -p mitmproxy-addons
wget https://github.com/mitmproxy/mitmproxy/raw/main/examples/contrib/har_dump.py -O mitmproxy-addons/har_dump.py
wget https://github.com/tweaselORG/mitmproxy-ipc-events-addon/raw/main/ipc_events_addon.py -O mitmproxy-addons/ipc_events_addon.py
```

## Device preparation

Take a look at the [supported (tested) targets for appstraction](https://github.com/tweaselORG/appstraction#supported-targets) and use these. You also need to prepare the devices according to the [instructions for appstraction](https://github.com/tweaselORG/appstraction#device-preparation). Additionally, you will need to install the certificate authority of mitmproxy on the targets where you want to inspect the traffic.

### Installing the mitmproxy CA on android

After having started mitmproxy once, you can extract the root certificate of mitmproxy and isntall it on the target like below. If your target is an emulator, you will need to start it with `-writeable-sytem` in order to be able to install the certificate. We take a snapshot after this to be able to reset to this state.

```zsh
export CERT_HASH=$(openssl x509 -inform PEM -subject_hash_old -in ~/.mitmproxy/mitmproxy-ca-cert.pem | head -1)
cp ~/.mitmproxy/mitmproxy-ca-cert.pem "$CERT_HASH.0"

adb root
adb shell avbctl disable-verification
adb disable-verity
adb reboot
adb root
adb remount

adb push "$CERT_HASH.0" /sdcard/
adb shell "mv /sdcard/$CERT_HASH.0 /system/etc/security/cacerts/"
adb shell "chmod 644 /system/etc/security/cacerts/$CERT_HASH.0"
adb reboot
```

### Installing the mitmproxy CA on a physical iOS device

Follow [these instruction](https://www.andyibanez.com/posts/intercepting-network-mitmproxy/#physical-ios-devices) while running mitmproxy.

## API reference

A full API reference can be found in the [`docs` folder](/docs/README.md).

## Example usage

The following example collects the traffic for an app in the android emulator. It installs the app, waits for traffic and then wipes the app again:

```ts
(async () => {
    const analysis = startAnalysis({
        platform: 'android',
        runTarget: 'emulator',
        capabilities: [],

        targetOptions: {
            snapshotName,
            startEmulatorOptions: {
                emulatorName: 'your-emulator',
            },
        },
    });

    const apps = [
        {
            main: 'com.example.example.apk',
            additional: ['config.com.example.example.apk']
        },
    ];

    // Start the emulator
    await analysis.ensureDevice();

    const appAnalysis = await analysis.startAppAnalysis(app);


    await appAnalysis.installApp();
    await appAnalysis.setAppPermissions();
    await appAnalysis.startTrafficCollection('initial');
    await appAnalysis.startApp();

    // Pause to wait for the app to generate network traffic.
    await pause(6_000);

    await appAnalysis.stopTrafficCollection();
    const res = await appAnalysis.stop();
    await analysis.stop();
})();
```

Take a look at the [`examples/`](examples) folder for some examples of how to use cyanoacrylate.

## License

This code is licensed under the MIT license, see the [`LICENSE`](LICENSE) file for details.

Issues and pull requests are welcome! Please be aware that by contributing, you agree for your work to be licensed under an MIT license.
