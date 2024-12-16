cyanoacrylate

# cyanoacrylate

## Table of contents

### Type Aliases

- [Analysis](README.md#analysis)
- [AnalysisOptions](README.md#analysisoptions)
- [AndroidEmulatorRunTargetOptions](README.md#androidemulatorruntargetoptions)
- [AndroidEmulatorRunTargetOptionsManaged](README.md#androidemulatorruntargetoptionsmanaged)
- [AndroidEmulatorRunTargetOptionsUnmanagedSelfStarted](README.md#androidemulatorruntargetoptionsunmanagedselfstarted)
- [AndroidEmulatorRunTargetOptionsUnmanagedStarted](README.md#androidemulatorruntargetoptionsunmanagedstarted)
- [AndroidPermission](README.md#androidpermission)
- [App](README.md#app)
- [AppAnalysis](README.md#appanalysis)
- [AppAnalysisResult](README.md#appanalysisresult)
- [DeviceAttribute](README.md#deviceattribute)
- [DeviceV1](README.md#devicev1)
- [GetDeviceAttributeOptions](README.md#getdeviceattributeoptions)
- [IosPermission](README.md#iospermission)
- [MitmproxyCertificate](README.md#mitmproxycertificate)
- [MitmproxyClient](README.md#mitmproxyclient)
- [MitmproxyConnection](README.md#mitmproxyconnection)
- [MitmproxyEvent](README.md#mitmproxyevent)
- [MitmproxyServer](README.md#mitmproxyserver)
- [MitmproxyServerSpec](README.md#mitmproxyserverspec)
- [MitmproxyTlsData](README.md#mitmproxytlsdata)
- [PlatformApi](README.md#platformapi)
- [RunTargetOptions](README.md#runtargetoptions)
- [StartEmulatorOptions](README.md#startemulatoroptions)
- [SupportedCapability](README.md#supportedcapability)
- [SupportedPlatform](README.md#supportedplatform)
- [SupportedRunTarget](README.md#supportedruntarget)
- [TrafficCollectionOptionsV1](README.md#trafficcollectionoptionsv1)
- [TweaselHar](README.md#tweaselhar)
- [TweaselHarMetaV1](README.md#tweaselharmetav1)

### Variables

- [androidPermissions](README.md#androidpermissions)
- [iosPermissions](README.md#iospermissions)

### Functions

- [pause](README.md#pause)
- [startAnalysis](README.md#startanalysis)

## Type Aliases

### Analysis

Ƭ **Analysis**<`Platform`, `RunTarget`, `Capabilities`\>: `Object`

Functions that can be used to instrument the device and analyze apps.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Platform` | extends [`SupportedPlatform`](README.md#supportedplatform) |
| `RunTarget` | extends [`SupportedRunTarget`](README.md#supportedruntarget)<`Platform`\> |
| `Capabilities` | extends [`SupportedCapability`](README.md#supportedcapability)<`Platform`\>[] |

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `ensureDevice` | (`options?`: { `forceRestart?`: `boolean` ; `killExisting?`: `boolean` ; `resetEmulator?`: `boolean`  }) => `Promise`<`void`\> | Make sure that the selected device/emulator is connected/started and ready to be used with the selected capabilities, installing analysis dependencies on the target if necessary. In the case of Android emulators, depending on the [AndroidEmulatorRunTargetOptions](README.md#androidemulatorruntargetoptions) specified, this will also create and/or start the emulator if necessary. Unless you set `options.resetEmulator` to `false`, it will reset the emulator to a clean state. **`Remarks`** If you are running an analysis on multiple apps, make sure to run `ensureDevice()` before every new app analysis, because it deals with any problems with the target which might have come up in a previous analysis. If you use a managed emulator, it will even be rebuilt from scratch if it got corrupted. |
| `ensureTrackingDomainResolution` | () => `Promise`<`void`\> | Assert that a few tracking domains can be resolved. This is useful to ensure that no DNS tracking blocker is interfering with the results. |
| `platform` | [`PlatformApi`](README.md#platformapi)<`Platform`, `RunTarget`, `Capabilities`\> | A raw platform API object as returned by [appstraction](https://github.com/tweaselORG/appstraction). |
| `resetDevice` | () => `Promise`<`void`\> | Reset the emulator to the snapshot specified in `targetOptions.snapshotName` (in the case of unmanaged emulators) or the automatically created snapshot of the clean device just after setup with only dependencies and honey data (in the case of managed emulators). |
| `startAppAnalysis` | (`appIdOrPath`: `string` \| `AppPath`<`Platform`\>, `options?`: { `resetApp?`: `boolean`  }) => `Promise`<[`AppAnalysis`](README.md#appanalysis)<`Platform`, `RunTarget`, `Capabilities`\>\> | Start an app analysis. The app analysis is controlled through the returned object. Remember to call `stop()` on the object when you are done with the app to clean up and retrieve the analysis data. |
| `startTrafficCollection` | (`options?`: `Platform` extends ``"android"`` ? `TrafficCollectionOptions` : `never`) => `Promise`<`void`\> | Start collecting the device's traffic. On Android, this will start a WireGuard proxy on the host computer on port `51820`. It will automatically configure the target to use the WireGuard proxy and trust the mitmproxy TLS certificate. You can configure which apps to include using the `options` parameter. On iOS, this will start a mitmproxy HTTP(S) proxy on the host computer on port `8080`. It will automatically configure the target to use the proxy and trust the mitmproxy TLS certificate. You can not restrict the traffic collection to specific apps. Only one traffic collection can be active at a time. |
| `stop` | () => `Promise`<`void`\> | Stop the analysis. This is important for clean up, e.g. stopping the emulator if it is started/managed by this library. |
| `stopTrafficCollection` | () => `Promise`<[`TweaselHar`](README.md#tweaselhar)\> | Stop collecting the device's traffic. This will stop the proxy on the host computer. |

#### Defined in

[src/index.ts:97](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L97)

___

### AnalysisOptions

Ƭ **AnalysisOptions**<`Platform`, `RunTarget`, `Capabilities`\>: { `capabilities`: `Capabilities` ; `platform`: `Platform` ; `runTarget`: `RunTarget`  } & [`RunTargetOptions`](README.md#runtargetoptions)[`Platform`][`RunTarget`] extends `object` ? { `targetOptions`: [`RunTargetOptions`](README.md#runtargetoptions)[`Platform`][`RunTarget`]  } : { `targetOptions?`: `Record`<`string`, `never`\>  }

The options for the `startAnalysis()` function.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Platform` | extends [`SupportedPlatform`](README.md#supportedplatform) |
| `RunTarget` | extends [`SupportedRunTarget`](README.md#supportedruntarget)<`Platform`\> |
| `Capabilities` | extends [`SupportedCapability`](README.md#supportedcapability)<`Platform`\>[] |

#### Defined in

[src/index.ts:444](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L444)

___

### AndroidEmulatorRunTargetOptions

Ƭ **AndroidEmulatorRunTargetOptions**: [`AndroidEmulatorRunTargetOptionsUnmanagedSelfStarted`](README.md#androidemulatorruntargetoptionsunmanagedselfstarted) \| [`AndroidEmulatorRunTargetOptionsUnmanagedStarted`](README.md#androidemulatorruntargetoptionsunmanagedstarted) \| [`AndroidEmulatorRunTargetOptionsManaged`](README.md#androidemulatorruntargetoptionsmanaged)

Run target options for an Android emulator. You can choose between the following variants:

- The emulator is completely created, managed, and started automatically by cyanoacrylate. You declaratively specify
  the parameters of the emulator and cyanoacrylate ensures that an emulator matching those parameters is available
  after you run `analysis.ensureDevice()`.

  It also automatically creates a snapshot of the emulator in a clean state for you that you can revert to using
  `analysis.resetDevice()`. You can optionally specify honey data that should be placed on the emulator before the
  snapshot is created.

  Use [AndroidEmulatorRunTargetOptionsManaged](README.md#androidemulatorruntargetoptionsmanaged).
- You create and manage the emulator as well as the snapshot (if desired) yourself but cyanoacrylate automatically
  starts it for you. It also takes care to restart the emulator if necessary whenever you run
  `analysis.ensureDevice()`.

  Use [AndroidEmulatorRunTargetOptionsUnmanagedStarted](README.md#androidemulatorruntargetoptionsunmanagedstarted).
- You create, manage, and start the emulator as well as the snapshot (if desired) yourself and cyanoacrylate does not
  touch it. You have to ensure yourself that the emulator is working and running. Use
  [AndroidEmulatorRunTargetOptionsUnmanagedSelfStarted](README.md#androidemulatorruntargetoptionsunmanagedselfstarted).

#### Defined in

[src/index.ts:405](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L405)

___

### AndroidEmulatorRunTargetOptionsManaged

Ƭ **AndroidEmulatorRunTargetOptionsManaged**: `Object`

Run target options for an Android emulator that is created, managed, and started automatically by cyanoacrylate.

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `managed` | ``true`` | Whether the emulator should be created and managed by cyanoacrylate. |
| `managedEmulatorOptions` | { `attemptRebuilds?`: `number` ; `createEmulatorOptions?`: `EmulatorOptions` ; `honeyData?`: { `clipboard?`: `string` ; `deviceName?`: `string`  } ; `key`: `string`  } | Options to configure how the emulator should be created by cyanoacrylate. |
| `managedEmulatorOptions.attemptRebuilds?` | `number` | How often to try rebuilding the emulator completely in case of an error. **`Default`** 1 |
| `managedEmulatorOptions.createEmulatorOptions?` | `EmulatorOptions` | Which kind of emulator to create. Defaults to Android 11 (API level 30), Android with Google APIs, x86_64, which allows you to run ARM apps on x86 hosts. **`See`** [https://github.com/tweaselORG/appstraction/issues/54](https://github.com/tweaselORG/appstraction/issues/54) |
| `managedEmulatorOptions.honeyData?` | { `clipboard?`: `string` ; `deviceName?`: `string`  } | Optional honey data to place on the device before creating the snapshot. |
| `managedEmulatorOptions.honeyData.clipboard?` | `string` | Content to put into the clipboard. |
| `managedEmulatorOptions.honeyData.deviceName?` | `string` | The device name to set, which shows up to other network or bluetooth devices. |
| `managedEmulatorOptions.key` | `string` | A key to distinguish the emulator from other ones created by cyanoacrylate. All analyses using the same key will share an emulator. The created emulator will be named `cyanoacrylate-{key}-{MD5 hash of the options}[-headless]`. |
| `startEmulatorOptions?` | [`StartEmulatorOptions`](README.md#startemulatoroptions) | Options to configure how the emulator should be started by cyanoacrylate. |

#### Defined in

[src/index.ts:343](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L343)

___

### AndroidEmulatorRunTargetOptionsUnmanagedSelfStarted

Ƭ **AndroidEmulatorRunTargetOptionsUnmanagedSelfStarted**: `Object`

Run target options for an Android emulator that the user creates, manages, and starts themselves.

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `managed?` | ``false`` | Whether the emulator should be created and managed by cyanoacrylate. |
| `snapshotName?` | `string` | The name of a snapshot to use when resetting the emulator. |
| `startEmulatorOptions?` | `undefined` | - |

#### Defined in

[src/index.ts:317](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L317)

___

### AndroidEmulatorRunTargetOptionsUnmanagedStarted

Ƭ **AndroidEmulatorRunTargetOptionsUnmanagedStarted**: `Object`

Run target options for an Android emulator that the user creates and manages themselves but that is automatically
started by cyanoacrylate.

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `managed?` | ``false`` | Whether the emulator should be created and managed by cyanoacrylate. |
| `snapshotName?` | `string` | The name of a snapshot to use when resetting the emulator. |
| `startEmulatorOptions` | { `emulatorName`: `string`  } & [`StartEmulatorOptions`](README.md#startemulatoroptions) | Options to configure how the emulator should be started by cyanoacrylate. |

#### Defined in

[src/index.ts:329](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L329)

___

### AndroidPermission

Ƭ **AndroidPermission**: typeof [`androidPermissions`](README.md#androidpermissions)[`number`]

An ID of a known permission on Android.

#### Defined in

node_modules/appstraction/dist/index.d.ts:59

___

### App

Ƭ **App**: `Object`

Metadata about an app, as returned by parseAppMeta.

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `architectures` | (``"arm64"`` \| ``"arm"`` \| ``"x86"`` \| ``"x86_64"`` \| ``"mips"`` \| ``"mips64"``)[] | A list of the architectures that the app supports. The identifiers for the architectures are normalized across Android and iOS. On Android, this will be empty for apps that don't have native code. |
| `id` | `string` | The app/bundle ID. |
| `md5?` | `string` | The MD5 hash of the app's package file. In the case of split APKs on Android, this will be the hash of the main APK. In the case of custom APK bundle formats (`.xapk`, `.apkm` and `.apks`), this will be the hash of the entire bundle. **Be careful when interpreting this value.** App stores can deliver different distributions of the exact same app. For example, apps downloaded from the App Store on iOS include the user's Apple ID, thus leading to different hashes even if different users download the very same version of the same app. |
| `name?` | `string` | The app's display name. |
| `platform` | [`SupportedPlatform`](README.md#supportedplatform) | The platform the app is for. |
| `version?` | `string` | The app's human-readable version. |
| `versionCode?` | `string` | The app's version code. |

#### Defined in

node_modules/appstraction/dist/index.d.ts:87

___

### AppAnalysis

Ƭ **AppAnalysis**<`Platform`, `RunTarget`, `Capabilities`\>: `Object`

Functions that can be used to control an app analysis.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Platform` | extends [`SupportedPlatform`](README.md#supportedplatform) |
| `RunTarget` | extends [`SupportedRunTarget`](README.md#supportedruntarget)<`Platform`\> |
| `Capabilities` | extends [`SupportedCapability`](README.md#supportedcapability)<`Platform`\>[] |

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `app` | [`App`](README.md#app) | The app's metadata. |
| `installApp` | () => `Promise`<`void`\> | Install the specified app. This is only available if the app analysis was started with an app path, but not if it was started with an app ID. **`See`** [PlatformApi](README.md#platformapi) |
| `setAppPermissions` | (`permissions?`: `Parameters`<[`PlatformApi`](README.md#platformapi)<`Platform`, `RunTarget`, `Capabilities`\>[``"setAppPermissions"``]\>[``1``]) => `Promise`<`void`\> | Set the permissions for the app with the given app ID. By default, it will grant all known permissions (including dangerous permissions on Android) and set the location permission on iOS to `always`. You can specify which permissions to grant/deny using the `permissions` argument. Requires the `ssh` and `frida` capabilities on iOS. **`See`** [PlatformApi](README.md#platformapi) |
| `startApp` | () => `Promise`<`void`\> | Start the app. **`See`** [PlatformApi](README.md#platformapi) |
| `startTrafficCollection` | (`name?`: `string`) => `Promise`<`void`\> | Start collecting the traffic of only this app on Android and of the whole device on iOS. On Android, this will start a WireGuard proxy on the host computer on port `51820`. It will automatically configure the target to use the WireGuard proxy and trust the mitmproxy TLS certificate. On iOS, this will start a mitmproxy HTTP(S) proxy on the host computer on port `8080`. It will automatically configure the target to use the proxy and trust the mitmproxy TLS certificate. Only one traffic collection can be active at a time. |
| `stop` | (`options?`: { `uninstallApp?`: `boolean`  }) => `Promise`<[`AppAnalysisResult`](README.md#appanalysisresult)\> | Stop the app analysis and return the collected data. |
| `stopApp` | () => `Promise`<`void`\> | Force-stop the app. **`See`** [PlatformApi](README.md#platformapi) |
| `stopTrafficCollection` | () => `Promise`<`void`\> | Stop collecting the app's (or, on iOS, the device's) traffic. This will stop the proxy on the host computer. The collected traffic is available from the `traffic` property of the object returned by `stop()`. |
| `uninstallApp` | () => `Promise`<`void`\> | Uninstall the app. **`See`** [PlatformApi](README.md#platformapi) |

#### Defined in

[src/index.ts:190](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L190)

___

### AppAnalysisResult

Ƭ **AppAnalysisResult**: `Object`

The result of an app analysis.

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `app` | [`App`](README.md#app) | The app's metadata. |
| `mitmproxyEvents` | [`MitmproxyEvent`](README.md#mitmproxyevent)[] | The mitmproxy events that were observed during the traffic collection. Note that this is not a stable API. |
| `traffic` | `Record`<`string`, [`TweaselHar`](README.md#tweaselhar)\> | The collected traffic, accessible by the specified name. The traffic is available as a JSON object in the HAR format (https://w3c.github.io/web-performance/specs/HAR/Overview.html). |

#### Defined in

[src/index.ts:277](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L277)

___

### DeviceAttribute

Ƭ **DeviceAttribute**<`Platform`\>: `Platform` extends ``"android"`` ? ``"apiLevel"`` \| ``"architectures"`` \| ``"manufacturer"`` \| ``"model"`` \| ``"modelCodeName"`` \| ``"name"`` \| ``"osBuild"`` \| ``"osVersion"`` : ``"architectures"`` \| ``"idfv"`` \| ``"manufacturer"`` \| ``"modelCodeName"`` \| ``"name"`` \| ``"osBuild"`` \| ``"osVersion"``

A supported attribute for the `getDeviceAttribute()` function, depending on the platform.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Platform` | extends [`SupportedPlatform`](README.md#supportedplatform) |

#### Defined in

node_modules/appstraction/dist/index.d.ts:495

___

### DeviceV1

Ƭ **DeviceV1**: `Object`

Metadata about the device the analysis was run on.

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `architectures` | `string` | Architectures/ABIs supported by the device. |
| `manufacturer?` | `string` | The device's manufacturer. |
| `model?` | `string` | The device's model. |
| `modelCodeName?` | `string` | The device's model code name. |
| `osBuild?` | `string` | The build string of the OS. |
| `osVersion` | `string` | The version of the OS. |
| `platform` | [`SupportedPlatform`](README.md#supportedplatform) | The device's operating system. |
| `runTarget` | [`SupportedRunTarget`](README.md#supportedruntarget)<[`SupportedPlatform`](README.md#supportedplatform)\> | The type of device (emulator, physical device). |

#### Defined in

[src/index.ts:34](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L34)

___

### GetDeviceAttributeOptions

Ƭ **GetDeviceAttributeOptions**: `Object`

The options for each attribute available through the `getDeviceAttribute()` function.

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `idfv` | { `appId`: `string`  } | The options for the `idfv` attribute. |
| `idfv.appId` | `string` | The app ID of the app to get the `identifierForVendor` for. |

#### Defined in

node_modules/appstraction/dist/index.d.ts:497

___

### IosPermission

Ƭ **IosPermission**: typeof [`iosPermissions`](README.md#iospermissions)[`number`]

An ID of a known permission on iOS.

#### Defined in

node_modules/appstraction/dist/index.d.ts:63

___

### MitmproxyCertificate

Ƭ **MitmproxyCertificate**: `Object`

A mitmproxy certificate object representing a TLS certificate.

**`See`**

https://docs.mitmproxy.org/stable/api/mitmproxy/certs.html#Cert

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `altnames` | `string`[] | The certificate's alternate names (`SubjectAlternativeName`). |
| `cn` | `string` \| ``null`` | The certificate's common name. |
| `issuer` | [`string`, `string`][] | The issuer information of the certificate, as an array of key-value pairs. **`Example`** ```ts [ ['C', 'US'], ['O', 'DigiCert Inc'], ['OU', 'www.digicert.com'], ['CN', 'GeoTrust TLS RSA CA G1'], ]; ``` |
| `keyinfo` | [`string`, `number`] | The key information of the certificate, consisting of the algorithm and the bit size. **`Example`** ```ts ['RSA', 2048]; ``` |
| `notafter` | `number` | The timestamp when the certificate expires. |
| `notbefore` | `number` | The timestamp when the certificate becomes valid. |
| `organization` | `string` \| ``null`` | The organization name of the certificate owner. |
| `serial` | `number` | The certificate's serial number. |
| `subject` | [`string`, `string`][] | The subject information of the certificate, as an array of key-value pairs. **`Example`** ```ts [ ['C', 'US'], ['O', 'DigiCert Inc'], ['OU', 'www.digicert.com'], ['CN', 'GeoTrust TLS RSA CA G1'], ]; ``` |

#### Defined in

[src/util.ts:13](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/util.ts#L13)

___

### MitmproxyClient

Ƭ **MitmproxyClient**: [`MitmproxyConnection`](README.md#mitmproxyconnection) & { `mitmCertificate`: [`MitmproxyCertificate`](README.md#mitmproxycertificate) \| ``null`` ; `proxyMode`: `string`  }

A mitmproxy client object, represents a connection between a client and mitmproxy.

**`See`**

https://docs.mitmproxy.org/stable/api/mitmproxy/connection.html#Client

#### Defined in

[src/util.ts:144](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/util.ts#L144)

___

### MitmproxyConnection

Ƭ **MitmproxyConnection**: `Object`

A mitmproxy connection object.

**`See`**

https://docs.mitmproxy.org/stable/api/mitmproxy/connection.html#Connection

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `certificateList` | [`MitmproxyCertificate`](README.md#mitmproxycertificate)[] | The TLS certificate list as sent by the peer. The first certificate is the end-entity certificate. |
| `cipher` | `string` | The active cipher name as returned by OpenSSL's `SSL_CIPHER_get_name`. |
| `cipherList` | `string`[] | Ciphers accepted by the proxy server on this connection. |
| `connected` | `boolean` | `true` if MitmproxyConnection.state is `OPEN`, `false` otherwise. |
| `error` | `string` \| ``null`` | A string describing a general error with connections to this address. The purpose of this property is to signal that new connections to the particular endpoint should not be attempted, for example because it uses an untrusted TLS certificate. Regular (unexpected) disconnects do not set the error property. This property is only reused per client connection. |
| `id` | `string` | The connection's unique ID. |
| `peername` | [`string`, `number`] \| ``null`` | The remote's `[ip, port]` tuple for this connection. |
| `sni` | `string` \| ``null`` | The Server Name Indication (SNI) sent in the ClientHello. |
| `sockname` | [`string`, `number`] \| ``null`` | The local's `[ip, port]` tuple for this connection. |
| `state` | ``"CLOSED"`` \| ``"CAN_READ"`` \| ``"CAN_WRITE"`` \| ``"OPEN"`` | The connection's state. |
| `timestampEnd` | `number` \| ``null`` | Timestamp of when the connection has been closed. |
| `timestampStart` | `number` \| ``null`` | Timestamp of when the TCP SYN was received (client) or sent (server). |
| `timestampTlsSetup` | `number` \| ``null`` | Timestamp of when the TLS handshake has been completed successfully. |
| `tls` | `boolean` | `true` if TLS should be established, `false` otherwise. Note that this property only describes if a connection should eventually be protected using TLS. To check if TLS has already been established, use MitmproxyConnection.tlsEstablished. |
| `tlsEstablished` | `boolean` | `true` if TLS has been established, `false` otherwise. |
| `tlsVersion` | `string` \| ``null`` | The active TLS version. |
| `transportProtocol` | ``"tcp"`` \| ``"udp"`` | The connection's protocol. |

#### Defined in

[src/util.ts:73](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/util.ts#L73)

___

### MitmproxyEvent

Ƭ **MitmproxyEvent**: { `status`: ``"running"`` \| ``"done"``  } \| { `context`: { `address`: [`string`, `number`] ; `client`: [`MitmproxyClient`](README.md#mitmproxyclient)  } ; `status`: ``"clientConnected"`` \| ``"clientDisconnected"``  } \| { `context`: [`MitmproxyTlsData`](README.md#mitmproxytlsdata) & { `error`: `string` \| ``null``  } ; `status`: ``"tlsFailed"``  } \| { `context`: [`MitmproxyTlsData`](README.md#mitmproxytlsdata) ; `status`: ``"tlsEstablished"``  } \| { `context`: { `isRunning`: `boolean` ; `servers`: [`MitmproxyServerSpec`](README.md#mitmproxyserverspec)<``"wireguard"`` \| ``"regular"`` \| `string`\>[]  } ; `status`: ``"proxyChanged"``  }

The events sent by the mitmproxy IPC events addon.

#### Defined in

[src/util.ts:184](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/util.ts#L184)

___

### MitmproxyServer

Ƭ **MitmproxyServer**: [`MitmproxyConnection`](README.md#mitmproxyconnection) & { `address`: [`string`, `number`] \| ``null`` ; `timestampTcpSetup`: `number` \| ``null`` ; `via`: [``"http"`` \| ``"https"`` \| ``"tls"`` \| ``"dtls"`` \| ``"tcp"`` \| ``"udp"`` \| ``"dns"``, `string` \| `number`] \| ``null``  }

A mitmproxy server object, representing a connection between mitmproxy and an upstream server.

**`See`**

https://docs.mitmproxy.org/stable/api/mitmproxy/connection.html#Server

#### Defined in

[src/util.ts:159](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/util.ts#L159)

___

### MitmproxyServerSpec

Ƭ **MitmproxyServerSpec**<`Type`\>: `Object`

A `mitmproxy.proxy.mode_servers.ServerInstance` object.

**`See`**

https://github.com/mitmproxy/mitmproxy/blob/8f1329377147538afdf06344179c2fd90795e93a/mitmproxy/proxy/mode_servers.py#L172.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Type` | extends ``"wireguard"`` \| ``"regular"`` \| `string` |

#### Type declaration

| Name | Type |
| :------ | :------ |
| `description` | `string` |
| `fullSpec` | `string` |
| `isRunning` | `boolean` |
| `lastException` | `string` \| ``null`` |
| `listenAddrs` | [`string`, `number`][] |
| `type` | `Type` |
| `wireguardConf` | `Type` extends ``"wireguard"`` ? `string` \| ``null`` : ``null`` |

#### Defined in

[src/util.ts:173](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/util.ts#L173)

___

### MitmproxyTlsData

Ƭ **MitmproxyTlsData**: `Object`

Mitmproxy's event data for the `tls_start_client`, `tls_start_server`, and `tls_handshake` event hooks.

**`See`**

https://docs.mitmproxy.org/stable/api/mitmproxy/tls.html#TlsData

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `client` | [`MitmproxyClient`](README.md#mitmproxyclient) | The client connection. |
| `clientAddress` | `string` | Convenience alias for the client address in human-readable format (`<address>:<port>`). |
| `isDtls` | `boolean` | If set to `true`, indicates that it is a DTLS event. |
| `server` | [`MitmproxyServer`](README.md#mitmproxyserver) | The server connection. |
| `serverAddress` | `string` | Convenience alias for the server address in human-readable format (SNI hostname or `<address>:<port>`). |

#### Defined in

[src/util.ts:125](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/util.ts#L125)

___

### PlatformApi

Ƭ **PlatformApi**<`Platform`, `RunTarget`, `Capabilities`, `Capability`\>: `Object`

Functions that are available for the platforms.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Platform` | extends [`SupportedPlatform`](README.md#supportedplatform) |
| `RunTarget` | extends [`SupportedRunTarget`](README.md#supportedruntarget)<`Platform`\> |
| `Capabilities` | extends `SupportedCapability`<``"android"`` \| ``"ios"``\>[] |
| `Capability` | `Capabilities`[`number`] |

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `addCalendarEvent` | (`eventData`: `CalendarEventData`) => `Promise`<`void`\> | Adds a simple event to the device’s calendar. Requires the `frida` capability. On Android, this currently only works if a calendar has already been set up. |
| `addContact` | (`contactData`: `ContactData`) => `Promise`<`void`\> | Add a contact to the device’s contact book. Requires the `frida` capability. On Android, this currently only works if `com.android.contacts` is installed. |
| `clearStuckModals` | `Platform` extends ``"android"`` ? () => `Promise`<`void`\> : `never` | Clear any potential stuck modals by pressing the back button followed by the home button. This is currently broken on iOS (see https://github.com/tweaselORG/appstraction/issues/12). Requires the `ssh` capability on iOS. |
| `ensureDevice` | (`options?`: { `abortSignal?`: `AbortSignal`  }) => `Promise`<`void`\> | Assert that the selected device is connected and ready to be used with the selected capabilities, performing necessary setup steps. This should always be the first function you call. Note that depending on the capabilities you set, the setup steps may make permanent changes to your device. For Android, you can set the url to the WireGuard APK which should be installed in the `WIREGUARD_APK_URL` environment variable. Note that it is only used if WireGuard isn’t installed already. |
| `getDeviceAttribute` | <Attribute\>(`attribute`: `Attribute`, ...`options`: `Attribute` extends keyof [`GetDeviceAttributeOptions`](README.md#getdeviceattributeoptions) ? [options: GetDeviceAttributeOptions[Attribute]] : [options?: undefined]) => `Promise`<`string`\> | Get the value of the given device attribute. |
| `getForegroundAppId` | () => `Promise`<`string` \| `undefined`\> | Get the app ID of the running app that is currently in the foreground. Requires the `frida` capability on iOS. |
| `getPidForAppId` | (`appId`: `string`) => `Promise`<`number` \| `undefined`\> | Get the PID of the app with the given app ID if it is currently running. Requires the `frida` capability on iOS. |
| `getPrefs` | (`appId`: `string`) => `Promise`<`Record`<`string`, `unknown`\> \| `undefined`\> | Get the preferences (`SharedPreferences` on Android, `NSUserDefaults` on iOS) of the app with the given app ID. Requires the `frida` capability on Android and iOS. |
| `installApp` | (`appPath`: `AppPath`<`Platform`\>, `obbPaths?`: `Platform` extends ``"android"`` ? `ObbInstallSpec`[] : `never`) => `Promise`<`void`\> | Install the app at the given path. |
| `installCertificateAuthority` | (`path`: `string`) => `Promise`<`void`\> | Install the certificate authority with the given path as a trusted CA on the device. This allows you to intercept and modify traffic from apps on the device. On Android, this installs the CA as a system CA. As this is normally not possible on Android 10 and above, it overlays the `/system/etc/security/cacerts` directory with a tmpfs and installs the CA there. This means that the changes are not persistent across reboots. On iOS, the CA is installed permanently as a root certificate in the Certificate Trust Store. It persists across reboots.\ **Currently, you need to manually trust any CA at least once on the device, CAs can be added but not automatically marked as trusted (see: https://github.com/tweaselORG/appstraction/issues/44#issuecomment-1466151197).** Requires the `root` capability on Android, and the `ssh` capability on iOS. |
| `isAppInstalled` | (`appId`: `string`) => `Promise`<`boolean`\> | Check whether the app with the given app ID is installed. |
| `listApps` | (`options?`: { `includeSystem?`: `boolean`  }) => `Promise`<`string`[]\> | Get a list of the app IDs of all installed apps. |
| `removeCertificateAuthority` | (`path`: `string`) => `Promise`<`void`\> | Remove the certificate authority with the given path from the trusted CAs on the device. On Android, this works for system CAs, including those pre-installed with the OS. As this is normally not possible on Android 10 and above, it overlays the `/system/etc/security/cacerts` directory with a tmpfs and removes the CA there. This means that the changes are not persistent across reboots. On iOS, this only works for CAs in the Certificate Trust Store. It does not work for pre-installed OS CAs. The changes are persistent across reboots. Requires the `root` capability on Android, and the `ssh` capability on iOS. |
| `resetDevice` | `Platform` extends ``"android"`` ? `RunTarget` extends ``"emulator"`` ? (`snapshotName`: `string`, `options?`: { `abortSignal?`: `AbortSignal`  }) => `Promise`<`void`\> : `never` : `never` | Reset the device to the specified snapshot (only available for emulators). **`Param`** The name of the snapshot to reset to. **`Param`** Pass an AbortSignal to abort the waiting in case of a crash. This might not be graceful. |
| `setAppBackgroundBatteryUsage` | `Platform` extends ``"android"`` ? (`appId`: `string`, `state`: ``"unrestricted"`` \| ``"optimized"`` \| ``"restricted"``) => `Promise`<`void`\> : `never` | Configure whether the app's background battery usage should be restricted. Currently only supported on Android. **`Param`** The app ID of the app to configure the background battery usage settings for. **`Param`** The state to set the background battery usage to. On Android, the possible values are: - `unrestricted`: "Allow battery usage in background without restrictions. May use more battery." - `optimized`: "Optimize based on your usage. Recommended for most apps." (default after installation) - `restricted`: "Restrict battery usage while in background. Apps may not work as expected. Notifications may be delayed." |
| `setAppPermissions` | (`appId`: `string`, `permissions?`: `Platform` extends ``"ios"`` ? { [p in IosPermission]?: "unset" \| "allow" \| "deny" } & { `location?`: ``"ask"`` \| ``"never"`` \| ``"always"`` \| ``"while-using"``  } : `Partial`<`Record`<`LiteralUnion`<[`AndroidPermission`](README.md#androidpermission), `string`\>, ``"allow"`` \| ``"deny"``\>\>) => `Promise`<`void`\> | Set the permissions for the app with the given app ID. By default, it will grant all known permissions (including dangerous permissions on Android) and set the location permission on iOS to `always`. You can specify which permissions to grant/deny using the `permissions` argument. Requires the `ssh` and `frida` capabilities on iOS. |
| `setClipboard` | (`text`: `string`) => `Promise`<`void`\> | Set the clipboard to the given text. Requires the `frida` capability on Android and iOS. |
| `setDeviceName` | (`deviceName`: `string`) => `Promise`<`void`\> | Sets the name of the device, which shows up to other network or bluetooth devices. |
| `setProxy` | `Platform` extends ``"android"`` ? (`proxy`: ``"wireguard"`` extends `Capability` ? `WireGuardConfig` : `Proxy` \| ``null``) => `Promise`<`void`\> : `Platform` extends ``"ios"`` ? (`proxy`: `Proxy` \| ``null``) => `Promise`<`void`\> : `never` | Set or disable the proxy on the device. If you have enabled the `wireguard` capability, this will start or stop a WireGuard tunnel. Otherwise, it will set the global proxy on the device. On iOS, the proxy is set for the current WiFi network. It won't apply for other networks or for cellular data connections. WireGuard is currently only supported on Android. Enabling a WireGuard tunnel requires the `root` capability. **`Remarks`** The WireGuard integration will create a new tunnel in the app called `appstraction` and delete it when the proxy is stopped. If you have an existing tunnel with the same name, it will be overridden. **`Param`** The proxy to set, or `null` to disable the proxy. If you have enabled the `wireguard` capability, this is a string of the full WireGuard configuration to use. |
| `snapshotDeviceState` | `Platform` extends ``"android"`` ? `RunTarget` extends ``"emulator"`` ? (`snapshotName`: `string`, `options?`: { `abortSignal?`: `AbortSignal`  }) => `Promise`<`void`\> : `never` : `never` | Save the device state to the specified snapshot (only available for emulators). **`Param`** The name of the snapshot to save to. **`Param`** Pass an AbortSignal to abort the waiting in case of a crash. This might not be graceful. |
| `startApp` | (`appId`: `string`) => `Promise`<`void`\> | Start the app with the given app ID. Doesn't wait for the app to be ready. Also enables the certificate pinning bypass if enabled. Requires the `frida` or `ssh` capability on iOS. On Android, this will start the app with or without a certificate pinning bypass depending on the `certificate-pinning-bypass` capability. |
| `stopApp` | (`appId`: `string`) => `Promise`<`void`\> | Force-stop the app with the given app ID. |
| `target` | { `platform`: `Platform` ; `runTarget`: `RunTarget`  } | An indicator for what platform and run target this instance of PlatformApi is configured for. This is useful mostly to write typeguards. |
| `target.platform` | `Platform` | The platform this instance is configured for, i.e. `ios` or `android`. |
| `target.runTarget` | `RunTarget` | The run target this instance is configured for, i.e. `device` or `emulator`. |
| `uninstallApp` | (`appId`: `string`) => `Promise`<`void`\> | Uninstall the app with the given app ID. Will not fail if the app is not installed. This also removes any data stored by the app. |
| `waitForDevice` | (`tries?`: `number`, `options?`: { `abortSignal?`: `AbortSignal`  }) => `Promise`<`void`\> | Wait until the device or emulator has been connected and has booted up completely. |

#### Defined in

node_modules/appstraction/dist/index.d.ts:118

___

### RunTargetOptions

Ƭ **RunTargetOptions**: `Object`

The options for a specific platform/run target combination.

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `android` | { `device`: `unknown` ; `emulator`: [`AndroidEmulatorRunTargetOptions`](README.md#androidemulatorruntargetoptions)  } | The options for the Android platform. |
| `android.device` | `unknown` | The options for the Android physical device run target. |
| `android.emulator` | [`AndroidEmulatorRunTargetOptions`](README.md#androidemulatorruntargetoptions) | The options for the Android emulator run target. |
| `ios` | { `device`: { `ip?`: `string` ; `password?`: `string` ; `port?`: `number` ; `proxyIp`: `string` ; `username?`: ``"mobile"`` \| ``"root"``  } ; `emulator`: `never`  } | The options for the iOS platform. |
| `ios.device` | { `ip?`: `string` ; `password?`: `string` ; `port?`: `number` ; `proxyIp`: `string` ; `username?`: ``"mobile"`` \| ``"root"``  } | The options for the iOS physical device run target. |
| `ios.device.ip?` | `string` | The device's IP address. If none is given, a connection via USB port forwarding is attempted. |
| `ios.device.password?` | `string` | The password of the user to log into the device, defaults to `alpine` if not set. |
| `ios.device.port?` | `number` | The port where the SSH server is running on the device. Defaults to 22. |
| `ios.device.proxyIp` | `string` | The IP address of the host running the proxy to set up on the device. |
| `ios.device.username?` | ``"mobile"`` \| ``"root"`` | The username to use when logging into the device. Make sure the user is set up for login via SSH. If the `mobile` user is chosen, all commands are prepended with sudo. Defaults to `mobile` |
| `ios.emulator` | `never` | The options for the iOS emulator run target. |

#### Defined in

[src/index.ts:412](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L412)

___

### StartEmulatorOptions

Ƭ **StartEmulatorOptions**: `Object`

Options to configure how the emulator should be started with the `emulator` command.

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `attemptRestarts?` | `number` | How many times to retry starting the emulator in case of a failure. **`Default`** 1 |
| `audio?` | `boolean` | Whether to start the emulator with audio (default: `false`). |
| `ephemeral?` | `boolean` | Whether to discard all changes when exiting the emulator (default: `true`). |
| `hardwareAcceleration?` | { `gpuMode?`: ``"auto"`` \| ``"host"`` \| ``"swiftshader_indirect"`` \| ``"angle_indirect"`` \| ``"guest"`` ; `mode?`: ``"auto"`` \| ``"off"`` \| ``"on"``  } | Options for hardware accelerations. These do not need to be set if everything works with the defaults. |
| `hardwareAcceleration.gpuMode?` | ``"auto"`` \| ``"host"`` \| ``"swiftshader_indirect"`` \| ``"angle_indirect"`` \| ``"guest"`` | Sets the `-gpu` option, see https://developer.android.com/studio/run/emulator-acceleration#accel-graphics. |
| `hardwareAcceleration.mode?` | ``"auto"`` \| ``"off"`` \| ``"on"`` | Sets the `-accel` option, see https://developer.android.com/studio/run/emulator-commandline#common. |
| `headless?` | `boolean` | Whether to start the emulator in headless mode (default: `false`). |

#### Defined in

[src/index.ts:294](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L294)

___

### SupportedCapability

Ƭ **SupportedCapability**<`Platform`\>: `Platform` extends ``"android"`` ? ``"frida"`` \| ``"certificate-pinning-bypass"`` : `Platform` extends ``"ios"`` ? ``"certificate-pinning-bypass"`` : `never`

A capability supported by this library.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Platform` | extends [`SupportedPlatform`](README.md#supportedplatform) |

#### Defined in

[src/index.ts:27](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L27)

___

### SupportedPlatform

Ƭ **SupportedPlatform**: ``"android"`` \| ``"ios"``

A platform that is supported by this library.

#### Defined in

node_modules/appstraction/dist/index.d.ts:66

___

### SupportedRunTarget

Ƭ **SupportedRunTarget**<`Platform`\>: `Platform` extends ``"android"`` ? ``"emulator"`` \| ``"device"`` : `Platform` extends ``"ios"`` ? ``"device"`` : `never`

A run target that is supported by this library for the given platform.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Platform` | extends [`SupportedPlatform`](README.md#supportedplatform) |

#### Defined in

node_modules/appstraction/dist/index.d.ts:68

___

### TrafficCollectionOptionsV1

Ƭ **TrafficCollectionOptionsV1**: { `mode`: ``"all-apps"``  } \| { `apps`: `string`[] ; `mode`: ``"allowlist"`` \| ``"denylist"``  }

Options for a traffic collection that specifies which apps to collect traffic from.

- `mode: 'all-apps'`: Collect traffic from all apps.
- `mode: 'allowlist'`: Collect traffic only from the apps with the app IDs in the `apps` array.
- `mode: 'denylist'`: Collect traffic from all apps except the apps with the app IDs in the `apps` array.

#### Defined in

[src/index.ts:94](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L94)

___

### TweaselHar

Ƭ **TweaselHar**: `Har` & { `log`: { `_tweasel`: [`TweaselHarMetaV1`](README.md#tweaselharmetav1)  }  }

A HAR file with additional tweasel metadata containing information about the analysis that the traffic was collected
through.

#### Defined in

[src/index.ts:56](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L56)

___

### TweaselHarMetaV1

Ƭ **TweaselHarMetaV1**: `Object`

Metadata about the traffic collection as included in a [TweaselHar](README.md#tweaselhar).

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `apps?` | [`App`](README.md#app)[] | Details about the app(s) that was/were analyzed. Currently only populated if the traffic was recorded through an app analysis. |
| `device` | [`DeviceV1`](README.md#devicev1) | Details about the device that the analysis was run on. |
| `endDate` | `string` | The time and date at which the traffic collection was stopped. |
| `metaVersion` | ``"1.0"`` | The version of the tweasel-specific metadata format. Currently, `1.0` is the only version. If the format is ever changed or extended in the future, this version will be incremented. |
| `options` | [`TrafficCollectionOptionsV1`](README.md#trafficcollectionoptionsv1) | The options that were used for the traffic collection. |
| `startDate` | `string` | The time and date at which the traffic collection was started. |
| `versions` | `Record`<`string`, `string`\> | The versions of the dependencies used in the analysis. |

#### Defined in

[src/index.ts:63](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L63)

## Variables

### androidPermissions

• `Const` **androidPermissions**: readonly [``"android.permission.ACCEPT_HANDOVER"``, ``"android.permission.ACCESS_BACKGROUND_LOCATION"``, ``"android.permission.ACCESS_COARSE_LOCATION"``, ``"android.permission.ACCESS_FINE_LOCATION"``, ``"android.permission.ACCESS_LOCATION_EXTRA_COMMANDS"``, ``"android.permission.ACCESS_MEDIA_LOCATION"``, ``"android.permission.ACCESS_NETWORK_STATE"``, ``"android.permission.ACCESS_NOTIFICATION_POLICY"``, ``"android.permission.ACCESS_WIFI_STATE"``, ``"android.permission.ACTIVITY_RECOGNITION"``, ``"android.permission.ANSWER_PHONE_CALLS"``, ``"android.permission.AUTHENTICATE_ACCOUNTS"``, ``"android.permission.BLUETOOTH_ADMIN"``, ``"android.permission.BLUETOOTH_ADVERTISE"``, ``"android.permission.BLUETOOTH_CONNECT"``, ``"android.permission.BLUETOOTH_SCAN"``, ``"android.permission.BLUETOOTH"``, ``"android.permission.BODY_SENSORS_BACKGROUND"``, ``"android.permission.BODY_SENSORS"``, ``"android.permission.BROADCAST_STICKY"``, ``"android.permission.CALL_COMPANION_APP"``, ``"android.permission.CALL_PHONE"``, ``"android.permission.CAMERA"``, ``"android.permission.CHANGE_NETWORK_STATE"``, ``"android.permission.CHANGE_WIFI_MULTICAST_STATE"``, ``"android.permission.CHANGE_WIFI_STATE"``, ``"android.permission.DELIVER_COMPANION_MESSAGES"``, ``"android.permission.DISABLE_KEYGUARD"``, ``"android.permission.EXPAND_STATUS_BAR"``, ``"android.permission.FLASHLIGHT"``, ``"android.permission.FOREGROUND_SERVICE"``, ``"android.permission.GET_ACCOUNTS"``, ``"android.permission.GET_PACKAGE_SIZE"``, ``"android.permission.GET_TASKS"``, ``"android.permission.HIDE_OVERLAY_WINDOWS"``, ``"android.permission.HIGH_SAMPLING_RATE_SENSORS"``, ``"android.permission.INTERNET"``, ``"android.permission.KILL_BACKGROUND_PROCESSES"``, ``"android.permission.MANAGE_ACCOUNTS"``, ``"android.permission.MANAGE_OWN_CALLS"``, ``"android.permission.MODIFY_AUDIO_SETTINGS"``, ``"android.permission.NEARBY_WIFI_DEVICES"``, ``"android.permission.NFC_PREFERRED_PAYMENT_INFO"``, ``"android.permission.NFC_TRANSACTION_EVENT"``, ``"android.permission.NFC"``, ``"android.permission.PERSISTENT_ACTIVITY"``, ``"android.permission.POST_NOTIFICATIONS"``, ``"android.permission.PROCESS_OUTGOING_CALLS"``, ``"android.permission.QUERY_ALL_PACKAGES"``, ``"android.permission.READ_BASIC_PHONE_STATE"``, ``"android.permission.READ_CALENDAR"``, ``"android.permission.READ_CALL_LOG"``, ``"android.permission.READ_CELL_BROADCASTS"``, ``"android.permission.READ_CONTACTS"``, ``"android.permission.READ_EXTERNAL_STORAGE"``, ``"android.permission.READ_INSTALL_SESSIONS"``, ``"android.permission.READ_MEDIA_AUDIO"``, ``"android.permission.READ_MEDIA_IMAGES"``, ``"android.permission.READ_MEDIA_VIDEO"``, ``"android.permission.READ_NEARBY_STREAMING_POLICY"``, ``"android.permission.READ_PHONE_NUMBERS"``, ``"android.permission.READ_PHONE_STATE"``, ``"android.permission.READ_PROFILE"``, ``"android.permission.READ_SMS"``, ``"android.permission.READ_SOCIAL_STREAM"``, ``"android.permission.READ_SYNC_SETTINGS"``, ``"android.permission.READ_SYNC_STATS"``, ``"android.permission.READ_USER_DICTIONARY"``, ``"android.permission.RECEIVE_BOOT_COMPLETED"``, ``"android.permission.RECEIVE_MMS"``, ``"android.permission.RECEIVE_SMS"``, ``"android.permission.RECEIVE_WAP_PUSH"``, ``"android.permission.RECORD_AUDIO"``, ``"android.permission.REORDER_TASKS"``, ``"android.permission.REQUEST_COMPANION_PROFILE_WATCH"``, ``"android.permission.REQUEST_COMPANION_RUN_IN_BACKGROUND"``, ``"android.permission.REQUEST_COMPANION_START_FOREGROUND_SERVICES_FROM_BACKGROUND"``, ``"android.permission.REQUEST_COMPANION_USE_DATA_IN_BACKGROUND"``, ``"android.permission.REQUEST_DELETE_PACKAGES"``, ``"android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS"``, ``"android.permission.REQUEST_OBSERVE_COMPANION_DEVICE_PRESENCE"``, ``"android.permission.REQUEST_PASSWORD_COMPLEXITY"``, ``"android.permission.RESTART_PACKAGES"``, ``"android.permission.SCHEDULE_EXACT_ALARM"``, ``"android.permission.SEND_SMS"``, ``"android.permission.SET_WALLPAPER_HINTS"``, ``"android.permission.SET_WALLPAPER"``, ``"android.permission.SUBSCRIBED_FEEDS_READ"``, ``"android.permission.SUBSCRIBED_FEEDS_WRITE"``, ``"android.permission.TRANSMIT_IR"``, ``"android.permission.UPDATE_PACKAGES_WITHOUT_USER_ACTION"``, ``"android.permission.USE_BIOMETRIC"``, ``"android.permission.USE_CREDENTIALS"``, ``"android.permission.USE_EXACT_ALARM"``, ``"android.permission.USE_FINGERPRINT"``, ``"android.permission.USE_FULL_SCREEN_INTENT"``, ``"android.permission.USE_SIP"``, ``"android.permission.UWB_RANGING"``, ``"android.permission.VIBRATE"``, ``"android.permission.WAKE_LOCK"``, ``"android.permission.WRITE_CALENDAR"``, ``"android.permission.WRITE_CALL_LOG"``, ``"android.permission.WRITE_CONTACTS"``, ``"android.permission.WRITE_EXTERNAL_STORAGE"``, ``"android.permission.WRITE_PROFILE"``, ``"android.permission.WRITE_SMS"``, ``"android.permission.WRITE_SOCIAL_STREAM"``, ``"android.permission.WRITE_SYNC_SETTINGS"``, ``"android.permission.WRITE_USER_DICTIONARY"``, ``"com.android.alarm.permission.SET_ALARM"``, ``"com.android.browser.permission.READ_HISTORY_BOOKMARKS"``, ``"com.android.browser.permission.WRITE_HISTORY_BOOKMARKS"``, ``"com.android.launcher.permission.INSTALL_SHORTCUT"``, ``"com.android.launcher.permission.UNINSTALL_SHORTCUT"``, ``"com.android.voicemail.permission.ADD_VOICEMAIL"``, ``"com.google.android.gms.dck.permission.DIGITAL_KEY_READ"``, ``"com.google.android.gms.dck.permission.DIGITAL_KEY_WRITE"``, ``"com.google.android.gms.permission.ACTIVITY_RECOGNITION"``, ``"com.google.android.gms.permission.AD_ID_NOTIFICATION"``, ``"com.google.android.gms.permission.AD_ID"``, ``"com.google.android.gms.permission.CAR_FUEL"``, ``"com.google.android.gms.permission.CAR_MILEAGE"``, ``"com.google.android.gms.permission.CAR_SPEED"``, ``"com.google.android.gms.permission.CAR_VENDOR_EXTENSION"``, ``"com.google.android.gms.permission.REQUEST_SCREEN_LOCK_COMPLEXITY"``, ``"com.google.android.gms.permission.TRANSFER_WIFI_CREDENTIAL"``, ``"com.google.android.ims.providers.ACCESS_DATA"``, ``"com.google.android.providers.gsf.permission.READ_GSERVICES"``]

The IDs of known permissions on Android.

#### Defined in

node_modules/appstraction/dist/index.d.ts:57

___

### iosPermissions

• `Const` **iosPermissions**: readonly [``"kTCCServiceLiverpool"``, ``"kTCCServiceUbiquity"``, ``"kTCCServiceCalendar"``, ``"kTCCServiceAddressBook"``, ``"kTCCServiceReminders"``, ``"kTCCServicePhotos"``, ``"kTCCServiceMediaLibrary"``, ``"kTCCServiceBluetoothAlways"``, ``"kTCCServiceMotion"``, ``"kTCCServiceWillow"``, ``"kTCCServiceExposureNotification"``, ``"kTCCServiceCamera"``, ``"kTCCServiceMicrophone"``, ``"kTCCServiceUserTracking"``]

The IDs of known permissions on iOS.

#### Defined in

node_modules/appstraction/dist/index.d.ts:61

## Functions

### pause

▸ **pause**(`durationInMs`, `abortSignal?`): `Promise`<`undefined`\>

Pause for a given duration.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `durationInMs` | `number` | The duration to pause for, in milliseconds. |
| `abortSignal?` | `AbortSignal` | Provide a signal to abort the pause. |

#### Returns

`Promise`<`undefined`\>

#### Defined in

node_modules/appstraction/dist/index.d.ts:19

___

### startAnalysis

▸ **startAnalysis**<`Platform`, `RunTarget`, `Capabilities`\>(`analysisOptions`): `Promise`<[`Analysis`](README.md#analysis)<`Platform`, `RunTarget`, `Capabilities`\>\>

Initialize an analysis for the given platform and run target. Remember to call `stop()` on the returned object when
you want to end the analysis.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Platform` | extends [`SupportedPlatform`](README.md#supportedplatform) |
| `RunTarget` | extends ``"emulator"`` \| ``"device"`` |
| `Capabilities` | extends [`SupportedCapability`](README.md#supportedcapability)<`Platform`\>[] |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `analysisOptions` | [`AnalysisOptions`](README.md#analysisoptions)<`Platform`, `RunTarget`, `Capabilities`\> | The options for the analysis. |

#### Returns

`Promise`<[`Analysis`](README.md#analysis)<`Platform`, `RunTarget`, `Capabilities`\>\>

An object that can be used to instrument the device and analyze apps.

#### Defined in

[src/index.ts:478](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L478)
