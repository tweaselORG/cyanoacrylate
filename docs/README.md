cyanoacrylate

# cyanoacrylate

## Table of contents

### Type Aliases

- [Analysis](README.md#analysis)
- [AnalysisOptions](README.md#analysisoptions)
- [AndroidPermission](README.md#androidpermission)
- [App](README.md#app)
- [AppAnalysis](README.md#appanalysis)
- [AppAnalysisResult](README.md#appanalysisresult)
- [DeviceAttribute](README.md#deviceattribute)
- [GetDeviceAttributeOptions](README.md#getdeviceattributeoptions)
- [IosPermission](README.md#iospermission)
- [PlatformApi](README.md#platformapi)
- [RunTargetOptions](README.md#runtargetoptions)
- [SupportedCapability](README.md#supportedcapability)
- [SupportedPlatform](README.md#supportedplatform)
- [SupportedRunTarget](README.md#supportedruntarget)
- [TrafficCollectionOptions](README.md#trafficcollectionoptions)

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
| `Capabilities` | extends [`SupportedCapability`](README.md#supportedcapability)<``"android"`` \| ``"ios"``\>[] |

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `ensureDevice` | (`options?`: { `killExisting?`: `boolean`  }) => `Promise`<`void`\> | Assert that the selected device is connected and ready to be used with the selected capabilities. Will start an emulator and wait for it to boot if necessary and a name was provided in `targetOptions.startEmulatorOptions.emulatorName`. On Android, installs and configures WireGuard on the target and the frida-server, if the `frida` capability is chosen. |
| `ensureTrackingDomainResolution` | () => `Promise`<`void`\> | Assert that a few tracking domains can be resolved. This is useful to ensure that no DNS tracking blocker is interfering with the results. |
| `platform` | [`PlatformApi`](README.md#platformapi)<`Platform`, `RunTarget`, `Capabilities`\> | A raw platform API object as returned by [appstraction](https://github.com/tweaselORG/appstraction). |
| `resetDevice` | () => `Promise`<`void`\> | Reset the specified device to the snapshot specified in `targetOptions.snapshotName`. |
| `startAppAnalysis` | (`appPath`: `Platform` extends ``"android"`` ? `string` \| `string`[] : `string`, `options?`: { `noSigint?`: `boolean` ; `resetApp?`: `boolean`  }) => `Promise`<[`AppAnalysis`](README.md#appanalysis)<`Platform`, `RunTarget`, `Capabilities`\>\> | Start an app analysis. The app analysis is controlled through the returned object. Remember to call `stop()` on the object when you are done with the app to clean up and retrieve the analysis data. |
| `startTrafficCollection` | (`options?`: [`TrafficCollectionOptions`](README.md#trafficcollectionoptions)) => `Promise`<`void`\> | Start collecting the device's traffic. This will start a WireGuard proxy on the host computer on port `51820`. It will automatically configure the target to use the WireGuard proxy and trust the mitmproxy TLS certificate. You can configure which apps to include using the `options` parameter. Only available on Android. Only one traffic collection can be active at a time. |
| `stop` | () => `Promise`<`void`\> | Stop the analysis. This is important for clean up, e.g. stopping the emulator if it is managed by this library. |
| `stopTrafficCollection` | () => `Promise`<`Har`\> | Stop collecting the device's traffic. This will stop the proxy on the host computer. |

#### Defined in

[cyanoacrylate/src/index.ts:42](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L42)

___

### AnalysisOptions

Ƭ **AnalysisOptions**<`Platform`, `RunTarget`, `Capabilities`\>: { `capabilities`: `Capabilities` ; `platform`: `Platform` ; `runTarget`: `RunTarget`  } & [`RunTargetOptions`](README.md#runtargetoptions)<`Capabilities`\>[`Platform`][`RunTarget`] extends `object` ? { `targetOptions`: [`RunTargetOptions`](README.md#runtargetoptions)<`Capabilities`\>[`Platform`][`RunTarget`]  } : { `targetOptions?`: `Record`<`string`, `never`\>  }

The options for the `startAnalysis()` function.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Platform` | extends [`SupportedPlatform`](README.md#supportedplatform) |
| `RunTarget` | extends [`SupportedRunTarget`](README.md#supportedruntarget)<`Platform`\> |
| `Capabilities` | extends [`SupportedCapability`](README.md#supportedcapability)<`Platform`\>[] |

#### Defined in

[cyanoacrylate/src/index.ts:243](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L243)

___

### AndroidPermission

Ƭ **AndroidPermission**: typeof [`androidPermissions`](README.md#androidpermissions)[`number`]

An ID of a known permission on Android.

#### Defined in

appstraction/dist/index.d.ts:35

___

### App

Ƭ **App**: `Object`

Metadata about an app.

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `id` | `string` | The app's ID. |
| `version?` | `string` | The app's version. |

#### Defined in

[cyanoacrylate/src/index.ts:26](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L26)

___

### AppAnalysis

Ƭ **AppAnalysis**<`Platform`, `RunTarget`, `Capabilities`\>: `Object`

Functions that can be used to control an app analysis.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Platform` | extends [`SupportedPlatform`](README.md#supportedplatform) |
| `RunTarget` | extends [`SupportedRunTarget`](README.md#supportedruntarget)<`Platform`\> |
| `Capabilities` | extends [`SupportedCapability`](README.md#supportedcapability)<``"android"`` \| ``"ios"``\>[] |

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `app` | [`App`](README.md#app) | The app's metadata. |
| `installApp` | () => `Promise`<`void`\> | Install the specified app. **`See`** [PlatformApi](README.md#platformapi) |
| `setAppPermissions` | (`permissions?`: `Parameters`<[`PlatformApi`](README.md#platformapi)<`Platform`, `RunTarget`, `Capabilities`\>[``"setAppPermissions"``]\>[``1``]) => `Promise`<`void`\> | Set the permissions for the app with the given app ID. By default, it will grant all known permissions (including dangerous permissions on Android) and set the location permission on iOS to `always`. You can specify which permissions to grant/deny using the `permissions` argument. Requires the `ssh` and `frida` capabilities on iOS. **`See`** [PlatformApi](README.md#platformapi) |
| `startApp` | () => `Promise`<`void`\> | Start the app. **`See`** [PlatformApi](README.md#platformapi) |
| `startTrafficCollection` | (`name?`: `string`) => `Promise`<`void`\> | Start collecting the traffic of only this app. This will start a WireGuard proxy on the host computer on port `51820`. It will automatically configure the target to use the WireGuard proxy and trust the mitmproxy TLS certificate. Only available on Android. Only one traffic collection can be active at a time. |
| `stop` | (`options?`: { `uninstallApp?`: `boolean`  }) => `Promise`<[`AppAnalysisResult`](README.md#appanalysisresult)\> | Stop the app analysis and return the collected data. |
| `stopTrafficCollection` | () => `Promise`<`void`\> | Stop collecting the app's traffic. This will stop the proxy on the host computer. The collected traffic is available from the `traffic` property of the object returned by `stop()`. |
| `uninstallApp` | () => `Promise`<`void`\> | Uninstall the app. **`See`** [PlatformApi](README.md#platformapi) |

#### Defined in

[cyanoacrylate/src/index.ts:110](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L110)

___

### AppAnalysisResult

Ƭ **AppAnalysisResult**: `Object`

The result of an app analysis.

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `app` | [`App`](README.md#app) | The app's metadata. |
| `traffic` | `Record`<`string`, `Har`\> | The collected traffic, accessible by the specified name. The traffic is available as a JSON object in the HAR format (https://w3c.github.io/web-performance/specs/HAR/Overview.html). |

#### Defined in

[cyanoacrylate/src/index.ts:189](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L189)

___

### DeviceAttribute

Ƭ **DeviceAttribute**<`Platform`\>: `Platform` extends ``"android"`` ? `never` : `Platform` extends ``"ios"`` ? ``"idfv"`` : `never`

A supported attribute for the `getDeviceAttribute()` function, depending on the platform.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Platform` | extends [`SupportedPlatform`](README.md#supportedplatform) |

#### Defined in

appstraction/dist/index.d.ts:302

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

appstraction/dist/index.d.ts:304

___

### IosPermission

Ƭ **IosPermission**: typeof [`iosPermissions`](README.md#iospermissions)[`number`]

An ID of a known permission on iOS.

#### Defined in

appstraction/dist/index.d.ts:39

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
| `clearStuckModals` | `Platform` extends ``"android"`` ? () => `Promise`<`void`\> : `never` | Clear any potential stuck modals by pressing the back button followed by the home button. This is currently broken on iOS (see https://github.com/tweaselORG/appstraction/issues/12). Requires the `ssh` capability on iOS. |
| `ensureDevice` | () => `Promise`<`void`\> | Assert that the selected device is connected and ready to be used with the selected capabilities, performing necessary setup steps. This should always be the first function you call. Note that depending on the capabilities you set, the setup steps may make permanent changes to your device. |
| `getDeviceAttribute` | <Attribute\>(`attribute`: `Attribute`, ...`options`: `Attribute` extends keyof [`GetDeviceAttributeOptions`](README.md#getdeviceattributeoptions) ? [options: GetDeviceAttributeOptions[Attribute]] : [options?: undefined]) => `Promise`<`string`\> | Get the value of the given attribute of the device. Requires the `frida` capability on iOS. |
| `getForegroundAppId` | () => `Promise`<`string` \| `undefined`\> | Get the app ID of the running app that is currently in the foreground. Requires the `frida` capability on iOS. |
| `getPidForAppId` | (`appId`: `string`) => `Promise`<`number` \| `undefined`\> | Get the PID of the app with the given app ID if it is currently running. Requires the `frida` capability on iOS. |
| `getPrefs` | (`appId`: `string`) => `Promise`<`Record`<`string`, `unknown`\> \| `undefined`\> | Get the preferences (`SharedPreferences` on Android, `NSUserDefaults` on iOS) of the app with the given app ID. Requires the `frida` capability on Android and iOS. |
| `installApp` | (`appPath`: `Platform` extends ``"android"`` ? `string` \| `string`[] : `string`) => `Promise`<`void`\> | Install the app at the given path. |
| `installCertificateAuthority` | (`path`: `string`) => `Promise`<`void`\> | Install the certificate authority with the given path as a trusted CA on the device. This allows you to intercept and modify traffic from apps on the device. On Android, this installs the CA as a system CA. As this is normally not possible on Android 10 and above, it overlays the `/system/etc/security/cacerts` directory with a tmpfs and installs the CA there. This means that the changes are not persistent across reboots. On iOS, the CA is installed permanently as a root certificate in the Certificate Trust Store. It persists across reboots.\ **Currently, you need to manually trust any CA at least once on the device, CAs can be added but not automatically marked as trusted (see: https://github.com/tweaselORG/appstraction/issues/44#issuecomment-1466151197).** Requires the `root` capability on Android, and the `ssh` capability on iOS. |
| `isAppInstalled` | (`appId`: `string`) => `Promise`<`boolean`\> | Check whether the app with the given app ID is installed. |
| `removeCertificateAuthority` | (`path`: `string`) => `Promise`<`void`\> | Remove the certificate authority with the given path from the trusted CAs on the device. On Android, this works for system CAs, including those pre-installed with the OS. As this is normally not possible on Android 10 and above, it overlays the `/system/etc/security/cacerts` directory with a tmpfs and removes the CA there. This means that the changes are not persistent across reboots. On iOS, this only works for CAs in the Certificate Trust Store. It does not work for pre-installed OS CAs. The changes are persistent across reboots. Requires the `root` capability on Android, and the `ssh` capability on iOS. |
| `resetDevice` | `Platform` extends ``"android"`` ? `RunTarget` extends ``"emulator"`` ? (`snapshotName`: `string`) => `Promise`<`void`\> : `never` : `never` | Reset the device to the specified snapshot (only available for emulators). **`Param`** The name of the snapshot to reset to. |
| `setAppBackgroundBatteryUsage` | `Platform` extends ``"android"`` ? (`appId`: `string`, `state`: ``"unrestricted"`` \| ``"optimized"`` \| ``"restricted"``) => `Promise`<`void`\> : `never` | Configure whether the app's background battery usage should be restricted. Currently only supported on Android. **`Param`** The app ID of the app to configure the background battery usage settings for. **`Param`** The state to set the background battery usage to. On Android, the possible values are: - `unrestricted`: "Allow battery usage in background without restrictions. May use more battery." - `optimized`: "Optimize based on your usage. Recommended for most apps." (default after installation) - `restricted`: "Restrict battery usage while in background. Apps may not work as expected. Notifications may be delayed." |
| `setAppPermissions` | (`appId`: `string`, `permissions?`: `Platform` extends ``"ios"`` ? { [p in IosPermission]?: "unset" \| "allow" \| "deny" } & { `location?`: ``"ask"`` \| ``"never"`` \| ``"always"`` \| ``"while-using"``  } : `Partial`<`Record`<`LiteralUnion`<[`AndroidPermission`](README.md#androidpermission), `string`\>, ``"allow"`` \| ``"deny"``\>\>) => `Promise`<`void`\> | Set the permissions for the app with the given app ID. By default, it will grant all known permissions (including dangerous permissions on Android) and set the location permission on iOS to `always`. You can specify which permissions to grant/deny using the `permissions` argument. Requires the `ssh` and `frida` capabilities on iOS. |
| `setClipboard` | (`text`: `string`) => `Promise`<`void`\> | Set the clipboard to the given text. Requires the `frida` capability on Android and iOS. |
| `setProxy` | `Platform` extends ``"android"`` ? (`proxy`: ``"wireguard"`` extends `Capability` ? `WireGuardConfig` : `Proxy` \| ``null``) => `Promise`<`void`\> : `Platform` extends ``"ios"`` ? (`proxy`: `Proxy` \| ``null``) => `Promise`<`void`\> : `never` | Set or disable the proxy on the device. If you have enabled the `wireguard` capability, this will start or stop a WireGuard tunnel. Otherwise, it will set the global proxy on the device. On iOS, the proxy is set for the current WiFi network. It won't apply for other networks or for cellular data connections. WireGuard is currently only supported on Android. Enabling a WireGuard tunnel requires the `root` capability. **`Remarks`** The WireGuard integration will create a new tunnel in the app called `appstraction` and delete it when the proxy is stopped. If you have an existing tunnel with the same name, it will be overridden. **`Param`** The proxy to set, or `null` to disable the proxy. If you have enabled the `wireguard` capability, this is a string of the full WireGuard configuration to use. |
| `startApp` | (`appId`: `string`) => `Promise`<`void`\> | Start the app with the given app ID. Doesn't wait for the app to be ready. Also enables the certificate pinning bypass if enabled. Requires the `frida` or `ssh` capability on iOS. On Android, this will start the app with or without a certificate pinning bypass depending on the `certificate-pinning-bypass` capability. |
| `stopApp` | (`appId`: `string`) => `Promise`<`void`\> | Force-stop the app with the given app ID. |
| `uninstallApp` | (`appId`: `string`) => `Promise`<`void`\> | Uninstall the app with the given app ID. Will not fail if the app is not installed. This also removes any data stored by the app. |

#### Defined in

appstraction/dist/index.d.ts:45

___

### RunTargetOptions

Ƭ **RunTargetOptions**<`Capabilities`, `Capability`\>: `Object`

The options for a specific platform/run target combination.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Capabilities` | extends [`SupportedCapability`](README.md#supportedcapability)<``"android"`` \| ``"ios"``\>[] |
| `Capability` | `Capabilities`[`number`] |

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `android` | { `device`: `unknown` ; `emulator`: { `snapshotName`: `string` ; `startEmulatorOptions?`: { `audio?`: `boolean` ; `emulatorName`: `string` ; `ephemeral?`: `boolean` ; `headless?`: `boolean`  }  }  } | The options for the Android platform. |
| `android.device` | `unknown` | The options for the Android physical device run target. |
| `android.emulator` | { `snapshotName`: `string` ; `startEmulatorOptions?`: { `audio?`: `boolean` ; `emulatorName`: `string` ; `ephemeral?`: `boolean` ; `headless?`: `boolean`  }  } | The options for the Android emulator run target. |
| `android.emulator.snapshotName` | `string` | The name of a snapshot to use when resetting the emulator. |
| `android.emulator.startEmulatorOptions?` | { `audio?`: `boolean` ; `emulatorName`: `string` ; `ephemeral?`: `boolean` ; `headless?`: `boolean`  } | Options for the emulator if you want it to be automatically started and stopped by this library. |
| `android.emulator.startEmulatorOptions.audio?` | `boolean` | Whether to start the emulator with audio (default: `false`). |
| `android.emulator.startEmulatorOptions.emulatorName` | `string` | The name of the emulator to start. |
| `android.emulator.startEmulatorOptions.ephemeral?` | `boolean` | Whether to discard all changes when exiting the emulator (default: `true`). |
| `android.emulator.startEmulatorOptions.headless?` | `boolean` | Whether to start the emulator in headless mode (default: `false`). |
| `ios` | { `device`: ``"ssh"`` extends `Capability` ? { `ip`: `string` ; `rootPw?`: `string`  } : `unknown` ; `emulator`: `never`  } | The options for the iOS platform. |
| `ios.device` | ``"ssh"`` extends `Capability` ? { `ip`: `string` ; `rootPw?`: `string`  } : `unknown` | The options for the iOS physical device run target. |
| `ios.emulator` | `never` | The options for the iOS emulator run target. |

#### Defined in

[cyanoacrylate/src/index.ts:201](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L201)

___

### SupportedCapability

Ƭ **SupportedCapability**<`Platform`\>: `Platform` extends ``"android"`` ? ``"frida"`` \| ``"certificate-pinning-bypass"`` : `Platform` extends ``"ios"`` ? ``"ssh"`` \| ``"frida"`` : `never`

A capability supported by this library.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Platform` | extends [`SupportedPlatform`](README.md#supportedplatform) |

#### Defined in

[cyanoacrylate/src/index.ts:19](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L19)

___

### SupportedPlatform

Ƭ **SupportedPlatform**: ``"android"`` \| ``"ios"``

A platform that is supported by this library.

#### Defined in

appstraction/dist/index.d.ts:41

___

### SupportedRunTarget

Ƭ **SupportedRunTarget**<`Platform`\>: `Platform` extends ``"android"`` ? ``"emulator"`` \| ``"device"`` : `Platform` extends ``"ios"`` ? ``"device"`` : `never`

A run target that is supported by this library for the given platform.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Platform` | extends [`SupportedPlatform`](README.md#supportedplatform) |

#### Defined in

appstraction/dist/index.d.ts:43

___

### TrafficCollectionOptions

Ƭ **TrafficCollectionOptions**: { `mode`: ``"all-apps"``  } \| { `apps`: `string`[] ; `mode`: ``"allowlist"`` \| ``"denylist"``  }

Options for a traffic collection that specifies which apps to collect traffic from.

- `mode: 'all-apps'`: Collect traffic from all apps.
- `mode: 'allowlist'`: Collect traffic only from the apps with the app IDs in the `apps` array.
- `mode: 'denylist'`: Collect traffic from all apps except the apps with the app IDs in the `apps` array.

#### Defined in

[cyanoacrylate/src/index.ts:40](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L40)

## Variables

### androidPermissions

• `Const` **androidPermissions**: readonly [``"android.permission.ACCEPT_HANDOVER"``, ``"android.permission.ACCESS_BACKGROUND_LOCATION"``, ``"android.permission.ACCESS_COARSE_LOCATION"``, ``"android.permission.ACCESS_FINE_LOCATION"``, ``"android.permission.ACCESS_LOCATION_EXTRA_COMMANDS"``, ``"android.permission.ACCESS_MEDIA_LOCATION"``, ``"android.permission.ACCESS_NETWORK_STATE"``, ``"android.permission.ACCESS_NOTIFICATION_POLICY"``, ``"android.permission.ACCESS_WIFI_STATE"``, ``"android.permission.ACTIVITY_RECOGNITION"``, ``"android.permission.ANSWER_PHONE_CALLS"``, ``"android.permission.AUTHENTICATE_ACCOUNTS"``, ``"android.permission.BLUETOOTH_ADMIN"``, ``"android.permission.BLUETOOTH_ADVERTISE"``, ``"android.permission.BLUETOOTH_CONNECT"``, ``"android.permission.BLUETOOTH_SCAN"``, ``"android.permission.BLUETOOTH"``, ``"android.permission.BODY_SENSORS_BACKGROUND"``, ``"android.permission.BODY_SENSORS"``, ``"android.permission.BROADCAST_STICKY"``, ``"android.permission.CALL_COMPANION_APP"``, ``"android.permission.CALL_PHONE"``, ``"android.permission.CAMERA"``, ``"android.permission.CHANGE_NETWORK_STATE"``, ``"android.permission.CHANGE_WIFI_MULTICAST_STATE"``, ``"android.permission.CHANGE_WIFI_STATE"``, ``"android.permission.DELIVER_COMPANION_MESSAGES"``, ``"android.permission.DISABLE_KEYGUARD"``, ``"android.permission.EXPAND_STATUS_BAR"``, ``"android.permission.FLASHLIGHT"``, ``"android.permission.FOREGROUND_SERVICE"``, ``"android.permission.GET_ACCOUNTS"``, ``"android.permission.GET_PACKAGE_SIZE"``, ``"android.permission.GET_TASKS"``, ``"android.permission.HIDE_OVERLAY_WINDOWS"``, ``"android.permission.HIGH_SAMPLING_RATE_SENSORS"``, ``"android.permission.INTERNET"``, ``"android.permission.KILL_BACKGROUND_PROCESSES"``, ``"android.permission.MANAGE_ACCOUNTS"``, ``"android.permission.MANAGE_OWN_CALLS"``, ``"android.permission.MODIFY_AUDIO_SETTINGS"``, ``"android.permission.NEARBY_WIFI_DEVICES"``, ``"android.permission.NFC_PREFERRED_PAYMENT_INFO"``, ``"android.permission.NFC_TRANSACTION_EVENT"``, ``"android.permission.NFC"``, ``"android.permission.PERSISTENT_ACTIVITY"``, ``"android.permission.POST_NOTIFICATIONS"``, ``"android.permission.PROCESS_OUTGOING_CALLS"``, ``"android.permission.QUERY_ALL_PACKAGES"``, ``"android.permission.READ_BASIC_PHONE_STATE"``, ``"android.permission.READ_CALENDAR"``, ``"android.permission.READ_CALL_LOG"``, ``"android.permission.READ_CELL_BROADCASTS"``, ``"android.permission.READ_CONTACTS"``, ``"android.permission.READ_EXTERNAL_STORAGE"``, ``"android.permission.READ_INSTALL_SESSIONS"``, ``"android.permission.READ_MEDIA_AUDIO"``, ``"android.permission.READ_MEDIA_IMAGES"``, ``"android.permission.READ_MEDIA_VIDEO"``, ``"android.permission.READ_NEARBY_STREAMING_POLICY"``, ``"android.permission.READ_PHONE_NUMBERS"``, ``"android.permission.READ_PHONE_STATE"``, ``"android.permission.READ_PROFILE"``, ``"android.permission.READ_SMS"``, ``"android.permission.READ_SOCIAL_STREAM"``, ``"android.permission.READ_SYNC_SETTINGS"``, ``"android.permission.READ_SYNC_STATS"``, ``"android.permission.READ_USER_DICTIONARY"``, ``"android.permission.RECEIVE_BOOT_COMPLETED"``, ``"android.permission.RECEIVE_MMS"``, ``"android.permission.RECEIVE_SMS"``, ``"android.permission.RECEIVE_WAP_PUSH"``, ``"android.permission.RECORD_AUDIO"``, ``"android.permission.REORDER_TASKS"``, ``"android.permission.REQUEST_COMPANION_PROFILE_WATCH"``, ``"android.permission.REQUEST_COMPANION_RUN_IN_BACKGROUND"``, ``"android.permission.REQUEST_COMPANION_START_FOREGROUND_SERVICES_FROM_BACKGROUND"``, ``"android.permission.REQUEST_COMPANION_USE_DATA_IN_BACKGROUND"``, ``"android.permission.REQUEST_DELETE_PACKAGES"``, ``"android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS"``, ``"android.permission.REQUEST_OBSERVE_COMPANION_DEVICE_PRESENCE"``, ``"android.permission.REQUEST_PASSWORD_COMPLEXITY"``, ``"android.permission.RESTART_PACKAGES"``, ``"android.permission.SCHEDULE_EXACT_ALARM"``, ``"android.permission.SEND_SMS"``, ``"android.permission.SET_WALLPAPER_HINTS"``, ``"android.permission.SET_WALLPAPER"``, ``"android.permission.SUBSCRIBED_FEEDS_READ"``, ``"android.permission.SUBSCRIBED_FEEDS_WRITE"``, ``"android.permission.TRANSMIT_IR"``, ``"android.permission.UPDATE_PACKAGES_WITHOUT_USER_ACTION"``, ``"android.permission.USE_BIOMETRIC"``, ``"android.permission.USE_CREDENTIALS"``, ``"android.permission.USE_EXACT_ALARM"``, ``"android.permission.USE_FINGERPRINT"``, ``"android.permission.USE_FULL_SCREEN_INTENT"``, ``"android.permission.USE_SIP"``, ``"android.permission.UWB_RANGING"``, ``"android.permission.VIBRATE"``, ``"android.permission.WAKE_LOCK"``, ``"android.permission.WRITE_CALENDAR"``, ``"android.permission.WRITE_CALL_LOG"``, ``"android.permission.WRITE_CONTACTS"``, ``"android.permission.WRITE_EXTERNAL_STORAGE"``, ``"android.permission.WRITE_PROFILE"``, ``"android.permission.WRITE_SMS"``, ``"android.permission.WRITE_SOCIAL_STREAM"``, ``"android.permission.WRITE_SYNC_SETTINGS"``, ``"android.permission.WRITE_USER_DICTIONARY"``, ``"com.android.alarm.permission.SET_ALARM"``, ``"com.android.browser.permission.READ_HISTORY_BOOKMARKS"``, ``"com.android.browser.permission.WRITE_HISTORY_BOOKMARKS"``, ``"com.android.launcher.permission.INSTALL_SHORTCUT"``, ``"com.android.launcher.permission.UNINSTALL_SHORTCUT"``, ``"com.android.voicemail.permission.ADD_VOICEMAIL"``, ``"com.google.android.gms.dck.permission.DIGITAL_KEY_READ"``, ``"com.google.android.gms.dck.permission.DIGITAL_KEY_WRITE"``, ``"com.google.android.gms.permission.ACTIVITY_RECOGNITION"``, ``"com.google.android.gms.permission.AD_ID_NOTIFICATION"``, ``"com.google.android.gms.permission.AD_ID"``, ``"com.google.android.gms.permission.CAR_FUEL"``, ``"com.google.android.gms.permission.CAR_MILEAGE"``, ``"com.google.android.gms.permission.CAR_SPEED"``, ``"com.google.android.gms.permission.CAR_VENDOR_EXTENSION"``, ``"com.google.android.gms.permission.REQUEST_SCREEN_LOCK_COMPLEXITY"``, ``"com.google.android.gms.permission.TRANSFER_WIFI_CREDENTIAL"``, ``"com.google.android.ims.providers.ACCESS_DATA"``, ``"com.google.android.providers.gsf.permission.READ_GSERVICES"``]

The IDs of known permissions on Android.

#### Defined in

appstraction/dist/index.d.ts:33

___

### iosPermissions

• `Const` **iosPermissions**: readonly [``"kTCCServiceLiverpool"``, ``"kTCCServiceUbiquity"``, ``"kTCCServiceCalendar"``, ``"kTCCServiceAddressBook"``, ``"kTCCServiceReminders"``, ``"kTCCServicePhotos"``, ``"kTCCServiceMediaLibrary"``, ``"kTCCServiceBluetoothAlways"``, ``"kTCCServiceMotion"``, ``"kTCCServiceWillow"``, ``"kTCCServiceExposureNotification"``, ``"kTCCServiceCamera"``, ``"kTCCServiceMicrophone"``, ``"kTCCServiceUserTracking"``]

The IDs of known permissions on iOS.

#### Defined in

appstraction/dist/index.d.ts:37

## Functions

### pause

▸ **pause**(`durationInMs`): `Promise`<`unknown`\>

Pause for a given duration.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `durationInMs` | `number` | The duration to pause for, in milliseconds. |

#### Returns

`Promise`<`unknown`\>

#### Defined in

appstraction/dist/index.d.ts:8

___

### startAnalysis

▸ **startAnalysis**<`Platform`, `RunTarget`, `Capabilities`\>(`analysisOptions`): [`Analysis`](README.md#analysis)<`Platform`, `RunTarget`, `Capabilities`\>

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

[`Analysis`](README.md#analysis)<`Platform`, `RunTarget`, `Capabilities`\>

An object that can be used to instrument the device and analyze apps.

#### Defined in

[cyanoacrylate/src/index.ts:276](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L276)
