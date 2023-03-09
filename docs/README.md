hot-glue

# hot-glue

## Table of contents

### Type Aliases

- [Analysis](README.md#analysis)
- [AnalysisOptions](README.md#analysisoptions)
- [AndroidPermission](README.md#androidpermission)
- [App](README.md#app)
- [AppAnalysis](README.md#appanalysis)
- [AppAnalysisResult](README.md#appanalysisresult)
- [AppPath](README.md#apppath)
- [DeviceAttribute](README.md#deviceattribute)
- [GetDeviceAttributeOptions](README.md#getdeviceattributeoptions)
- [IosPermission](README.md#iospermission)
- [PlatformApi](README.md#platformapi)
- [RunTargetOptions](README.md#runtargetoptions)
- [SupportedCapability](README.md#supportedcapability)
- [SupportedPlatform](README.md#supportedplatform)
- [SupportedRunTarget](README.md#supportedruntarget)

### Variables

- [androidPermissions](README.md#androidpermissions)
- [iosPermissions](README.md#iospermissions)

### Functions

- [getAppPathAll](README.md#getapppathall)
- [getAppPathMain](README.md#getapppathmain)
- [pause](README.md#pause)
- [startAnalysis](README.md#startanalysis)

## Type Aliases

### Analysis

Ƭ **Analysis**<`Platform`, `RunTarget`\>: `Object`

Functions that can be used to instrument the device and analyze apps.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Platform` | extends [`SupportedPlatform`](README.md#supportedplatform) |
| `RunTarget` | extends [`SupportedRunTarget`](README.md#supportedruntarget)<`Platform`\> |

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `ensureDevice` | (`options?`: { `killExisting?`: `boolean`  }) => `Promise`<`void`\> | Assert that the selected device is connected and ready to be used with the selected capabilities. Will start an emulator and wait for it to boot if necessary and a name was provided in `targetOptions.startEmulatorOptions.emulatorName`. |
| `ensureTrackingDomainResolution` | () => `Promise`<`void`\> | Assert that a few tracking domains can be resolved. This is useful to ensure that no DNS tracking blocker is interfering with the results. |
| `platform` | [`PlatformApi`](README.md#platformapi)<`Platform`, `RunTarget`\> | A raw platform API object as returned by [appstraction](https://github.com/tweaselORG/appstraction). |
| `resetDevice` | () => `Promise`<`void`\> | Reset the specified device to the snapshot specified in `targetOptions.snapshotName`. |
| `startAppAnalysis` | (`appPath`: [`AppPath`](README.md#apppath), `options?`: { `noSigint?`: `boolean` ; `resetApp?`: `boolean`  }) => `Promise`<[`AppAnalysis`](README.md#appanalysis)<`Platform`, `RunTarget`\>\> | Start an app analysis. The app analysis is controlled through the returned object. Remember to call `stop()` on the object when you are done with the app to clean up and retrieve the analysis data. |
| `stop` | () => `Promise`<`void`\> | Stop the analysis. This is important for clean up, e.g. stopping the emulator if it is managed by this library. |

#### Defined in

[cyanoacrylate/src/index.ts:29](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L29)

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

[cyanoacrylate/src/index.ts:198](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L198)

___

### AndroidPermission

Ƭ **AndroidPermission**: typeof [`androidPermissions`](README.md#androidpermissions)[`number`]

An ID of a known permission on Android.

#### Defined in

appstraction/dist/index.d.ts:25

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

[cyanoacrylate/src/index.ts:21](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L21)

___

### AppAnalysis

Ƭ **AppAnalysis**<`Platform`, `RunTarget`\>: `Object`

Functions that can be used to control an app analysis.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Platform` | extends [`SupportedPlatform`](README.md#supportedplatform) |
| `RunTarget` | extends [`SupportedRunTarget`](README.md#supportedruntarget)<`Platform`\> |

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `app` | [`App`](README.md#app) | The app's metadata. |
| `installApp` | () => `Promise`<`void`\> | Install the specified app. **`See`** [PlatformApi](README.md#platformapi) |
| `setAppPermissions` | (`permissions?`: `Parameters`<[`PlatformApi`](README.md#platformapi)<`Platform`, `RunTarget`\>[``"setAppPermissions"``]\>[``1``]) => `Promise`<`void`\> | Set the permissions for the app with the given app ID. By default, it will grant all known permissions (including dangerous permissions on Android) and set the location permission on iOS to `always`. You can specify which permissions to grant/deny using the `permissions` argument. Requires the `ssh` and `frida` capabilities on iOS. **`See`** [PlatformApi](README.md#platformapi) |
| `startApp` | () => `Promise`<`void`\> | Start the app. **`See`** [PlatformApi](README.md#platformapi) |
| `startTrafficCollection` | (`name?`: `string`) => `Promise`<`void`\> | Start collecting the device's traffic. This will start a proxy on the host computer on port `8080`. You need to configure your device to use this proxy (unless you are using an Android emulator). Only one traffic collection can be active at a time. **`Todo`** Automatically configure the device to use the proxy (https://github.com/tweaselORG/hot-glue/issues/2). |
| `stop` | (`options?`: { `uninstallApp?`: `boolean`  }) => `Promise`<[`AppAnalysisResult`](README.md#appanalysisresult)\> | Stop the app analysis and return the collected data. |
| `stopTrafficCollection` | () => `Promise`<`void`\> | Stop collecting the device's traffic. This will stop the proxy on the host computer. |
| `uninstallApp` | () => `Promise`<`void`\> | Uninstall the app. **`See`** [PlatformApi](README.md#platformapi) |

#### Defined in

[cyanoacrylate/src/index.ts:72](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L72)

___

### AppAnalysisResult

Ƭ **AppAnalysisResult**: `Object`

The result of an app analysis.

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `app` | [`App`](README.md#app) | The app's metadata. |
| `traffic` | `Record`<`string`, `string`\> | The collected traffic, accessible by the specified name. |

#### Defined in

[cyanoacrylate/src/index.ts:141](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L141)

___

### AppPath

Ƭ **AppPath**: `string` \| { `additional?`: `string`[] ; `main`: `string`  }

The path to the installation files for an app.

Can either be a string if the app is a single file, or an object specifying a main file and additional files (for
split APKs on Android).

#### Defined in

[cyanoacrylate/src/path.ts:7](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/path.ts#L7)

___

### DeviceAttribute

Ƭ **DeviceAttribute**<`Platform`\>: `Platform` extends ``"android"`` ? `never` : `Platform` extends ``"ios"`` ? ``"idfv"`` : `never`

A supported attribute for the `getDeviceAttribute()` function, depending on the platform.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Platform` | extends [`SupportedPlatform`](README.md#supportedplatform) |

#### Defined in

appstraction/dist/index.d.ts:203

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

appstraction/dist/index.d.ts:205

___

### IosPermission

Ƭ **IosPermission**: typeof [`iosPermissions`](README.md#iospermissions)[`number`]

An ID of a known permission on iOS.

#### Defined in

appstraction/dist/index.d.ts:29

___

### PlatformApi

Ƭ **PlatformApi**<`Platform`, `RunTarget`\>: `Object`

Functions that are available for the platforms.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Platform` | extends [`SupportedPlatform`](README.md#supportedplatform) |
| `RunTarget` | extends [`SupportedRunTarget`](README.md#supportedruntarget)<`Platform`\> |

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `clearStuckModals` | `Platform` extends ``"android"`` ? () => `Promise`<`void`\> : `never` | Clear any potential stuck modals by pressing the back button followed by the home button. This is currently broken on iOS (see https://github.com/tweaselORG/appstraction/issues/12). Requires the `ssh` capability on iOS. |
| `ensureDevice` | () => `Promise`<`void`\> | Assert that the selected device is connected and ready to be used with the selected capabilities. |
| `getDeviceAttribute` | <Attribute\>(`attribute`: `Attribute`, ...`options`: `Attribute` extends keyof [`GetDeviceAttributeOptions`](README.md#getdeviceattributeoptions) ? [options: GetDeviceAttributeOptions[Attribute]] : [options?: undefined]) => `Promise`<`string`\> | Get the value of the given attribute of the device. Requires the `frida` capability on iOS. |
| `getForegroundAppId` | () => `Promise`<`string` \| `undefined`\> | Get the app ID of the running app that is currently in the foreground. Requires the `frida` capability on iOS. |
| `getPidForAppId` | (`appId`: `string`) => `Promise`<`number` \| `undefined`\> | Get the PID of the app with the given app ID if it is currently running. Requires the `frida` capability on iOS. |
| `getPrefs` | (`appId`: `string`) => `Promise`<`Record`<`string`, `unknown`\> \| `undefined`\> | Get the preferences (`SharedPreferences` on Android, `NSUserDefaults` on iOS) of the app with the given app ID. Requires the `frida` capability on Android and iOS. |
| `installApp` | (`appPath`: `string`) => `Promise`<`void`\> | Install the app at the given path. **`Todo`** How to handle split APKs on Android (#4)? |
| `resetDevice` | `Platform` extends ``"android"`` ? `RunTarget` extends ``"emulator"`` ? (`snapshotName`: `string`) => `Promise`<`void`\> : `never` : `never` | Reset the device to the specified snapshot (only available for emulators). **`Param`** The name of the snapshot to reset to. |
| `setAppPermissions` | (`appId`: `string`, `permissions?`: `Platform` extends ``"ios"`` ? { [p in IosPermission]?: "unset" \| "allow" \| "deny" } & { `location?`: ``"ask"`` \| ``"never"`` \| ``"always"`` \| ``"while-using"``  } : `Partial`<`Record`<`LiteralUnion`<[`AndroidPermission`](README.md#androidpermission), `string`\>, ``"allow"`` \| ``"deny"``\>\>) => `Promise`<`void`\> | Set the permissions for the app with the given app ID. By default, it will grant all known permissions (including dangerous permissions on Android) and set the location permission on iOS to `always`. You can specify which permissions to grant/deny using the `permissions` argument. Requires the `ssh` and `frida` capabilities on iOS. |
| `setClipboard` | (`text`: `string`) => `Promise`<`void`\> | Set the clipboard to the given text. Requires the `frida` capability on Android and iOS. |
| `startApp` | (`appId`: `string`) => `Promise`<`void`\> | Start the app with the given app ID. Doesn't wait for the app to be ready. Also enables the certificate pinning bypass if enabled. Requires the `frida` or `ssh` capability on iOS. On Android, this will start the app with or without a certificate pinning bypass depending on the `certificate-pinning-bypass` capability. |
| `uninstallApp` | (`appId`: `string`) => `Promise`<`void`\> | Uninstall the app with the given app ID. Will not fail if the app is not installed. This also removes any data stored by the app. |

#### Defined in

appstraction/dist/index.d.ts:35

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
| `android` | { `device`: `unknown` ; `emulator`: { `snapshotName`: `string` ; `startEmulatorOptions?`: { `audio?`: `boolean` ; `emulatorName`: `string` ; `ephemeral?`: `boolean` ; `headless?`: `boolean` ; `proxy?`: `string`  }  }  } | The options for the Android platform. |
| `android.device` | `unknown` | The options for the Android physical device run target. |
| `android.emulator` | { `snapshotName`: `string` ; `startEmulatorOptions?`: { `audio?`: `boolean` ; `emulatorName`: `string` ; `ephemeral?`: `boolean` ; `headless?`: `boolean` ; `proxy?`: `string`  }  } | The options for the Android emulator run target. |
| `android.emulator.snapshotName` | `string` | The name of a snapshot to use when resetting the emulator. |
| `android.emulator.startEmulatorOptions?` | { `audio?`: `boolean` ; `emulatorName`: `string` ; `ephemeral?`: `boolean` ; `headless?`: `boolean` ; `proxy?`: `string`  } | Options for the emulator if you want it to be automatically started and stopped by this library. |
| `android.emulator.startEmulatorOptions.audio?` | `boolean` | Whether to start the emulator with audio (default: `false`). |
| `android.emulator.startEmulatorOptions.emulatorName` | `string` | The name of the emulator to start. |
| `android.emulator.startEmulatorOptions.ephemeral?` | `boolean` | Whether to discard all changes when exiting the emulator (default: `true`). |
| `android.emulator.startEmulatorOptions.headless?` | `boolean` | Whether to start the emulator in headless mode (default: `false`). |
| `android.emulator.startEmulatorOptions.proxy?` | `string` | The proxy to use for the emulator, in the format `host:port` or `user:password@host:port`. Currently defaults to `127.0.0.1:8080` (use an empty string to set no proxy), though the default will likely change to "no proxy" in the future. |
| `ios` | { `device`: ``"ssh"`` extends `Capability` ? { `ip`: `string` ; `rootPw?`: `string`  } : `unknown` ; `emulator`: `never`  } | The options for the iOS platform. |
| `ios.device` | ``"ssh"`` extends `Capability` ? { `ip`: `string` ; `rootPw?`: `string`  } : `unknown` | The options for the iOS physical device run target. |
| `ios.emulator` | `never` | The options for the iOS emulator run target. |

#### Defined in

[cyanoacrylate/src/index.ts:150](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L150)

___

### SupportedCapability

Ƭ **SupportedCapability**<`Platform`\>: `Platform` extends ``"android"`` ? ``"frida"`` \| ``"certificate-pinning-bypass"`` : `Platform` extends ``"ios"`` ? ``"ssh"`` \| ``"frida"`` : `never`

A capability supported by this library.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Platform` | extends [`SupportedPlatform`](README.md#supportedplatform) |

#### Defined in

[cyanoacrylate/src/index.ts:14](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L14)

___

### SupportedPlatform

Ƭ **SupportedPlatform**: ``"android"`` \| ``"ios"``

A platform that is supported by this library.

#### Defined in

appstraction/dist/index.d.ts:31

___

### SupportedRunTarget

Ƭ **SupportedRunTarget**<`Platform`\>: `Platform` extends ``"android"`` ? ``"emulator"`` \| ``"device"`` : `Platform` extends ``"ios"`` ? ``"device"`` : `never`

A run target that is supported by this library for the given platform.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Platform` | extends [`SupportedPlatform`](README.md#supportedplatform) |

#### Defined in

appstraction/dist/index.d.ts:33

## Variables

### androidPermissions

• `Const` **androidPermissions**: readonly [``"android.permission.ACCEPT_HANDOVER"``, ``"android.permission.ACCESS_BACKGROUND_LOCATION"``, ``"android.permission.ACCESS_COARSE_LOCATION"``, ``"android.permission.ACCESS_FINE_LOCATION"``, ``"android.permission.ACCESS_LOCATION_EXTRA_COMMANDS"``, ``"android.permission.ACCESS_MEDIA_LOCATION"``, ``"android.permission.ACCESS_NETWORK_STATE"``, ``"android.permission.ACCESS_NOTIFICATION_POLICY"``, ``"android.permission.ACCESS_WIFI_STATE"``, ``"android.permission.ACTIVITY_RECOGNITION"``, ``"android.permission.ANSWER_PHONE_CALLS"``, ``"android.permission.AUTHENTICATE_ACCOUNTS"``, ``"android.permission.BLUETOOTH_ADMIN"``, ``"android.permission.BLUETOOTH_ADVERTISE"``, ``"android.permission.BLUETOOTH_CONNECT"``, ``"android.permission.BLUETOOTH_SCAN"``, ``"android.permission.BLUETOOTH"``, ``"android.permission.BODY_SENSORS_BACKGROUND"``, ``"android.permission.BODY_SENSORS"``, ``"android.permission.BROADCAST_STICKY"``, ``"android.permission.CALL_COMPANION_APP"``, ``"android.permission.CALL_PHONE"``, ``"android.permission.CAMERA"``, ``"android.permission.CHANGE_NETWORK_STATE"``, ``"android.permission.CHANGE_WIFI_MULTICAST_STATE"``, ``"android.permission.CHANGE_WIFI_STATE"``, ``"android.permission.DELIVER_COMPANION_MESSAGES"``, ``"android.permission.DISABLE_KEYGUARD"``, ``"android.permission.EXPAND_STATUS_BAR"``, ``"android.permission.FLASHLIGHT"``, ``"android.permission.FOREGROUND_SERVICE"``, ``"android.permission.GET_ACCOUNTS"``, ``"android.permission.GET_PACKAGE_SIZE"``, ``"android.permission.GET_TASKS"``, ``"android.permission.HIDE_OVERLAY_WINDOWS"``, ``"android.permission.HIGH_SAMPLING_RATE_SENSORS"``, ``"android.permission.INTERNET"``, ``"android.permission.KILL_BACKGROUND_PROCESSES"``, ``"android.permission.MANAGE_ACCOUNTS"``, ``"android.permission.MANAGE_OWN_CALLS"``, ``"android.permission.MODIFY_AUDIO_SETTINGS"``, ``"android.permission.NEARBY_WIFI_DEVICES"``, ``"android.permission.NFC_PREFERRED_PAYMENT_INFO"``, ``"android.permission.NFC_TRANSACTION_EVENT"``, ``"android.permission.NFC"``, ``"android.permission.PERSISTENT_ACTIVITY"``, ``"android.permission.POST_NOTIFICATIONS"``, ``"android.permission.PROCESS_OUTGOING_CALLS"``, ``"android.permission.QUERY_ALL_PACKAGES"``, ``"android.permission.READ_BASIC_PHONE_STATE"``, ``"android.permission.READ_CALENDAR"``, ``"android.permission.READ_CALL_LOG"``, ``"android.permission.READ_CELL_BROADCASTS"``, ``"android.permission.READ_CONTACTS"``, ``"android.permission.READ_EXTERNAL_STORAGE"``, ``"android.permission.READ_INSTALL_SESSIONS"``, ``"android.permission.READ_MEDIA_AUDIO"``, ``"android.permission.READ_MEDIA_IMAGES"``, ``"android.permission.READ_MEDIA_VIDEO"``, ``"android.permission.READ_NEARBY_STREAMING_POLICY"``, ``"android.permission.READ_PHONE_NUMBERS"``, ``"android.permission.READ_PHONE_STATE"``, ``"android.permission.READ_PROFILE"``, ``"android.permission.READ_SMS"``, ``"android.permission.READ_SOCIAL_STREAM"``, ``"android.permission.READ_SYNC_SETTINGS"``, ``"android.permission.READ_SYNC_STATS"``, ``"android.permission.READ_USER_DICTIONARY"``, ``"android.permission.RECEIVE_BOOT_COMPLETED"``, ``"android.permission.RECEIVE_MMS"``, ``"android.permission.RECEIVE_SMS"``, ``"android.permission.RECEIVE_WAP_PUSH"``, ``"android.permission.RECORD_AUDIO"``, ``"android.permission.REORDER_TASKS"``, ``"android.permission.REQUEST_COMPANION_PROFILE_WATCH"``, ``"android.permission.REQUEST_COMPANION_RUN_IN_BACKGROUND"``, ``"android.permission.REQUEST_COMPANION_START_FOREGROUND_SERVICES_FROM_BACKGROUND"``, ``"android.permission.REQUEST_COMPANION_USE_DATA_IN_BACKGROUND"``, ``"android.permission.REQUEST_DELETE_PACKAGES"``, ``"android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS"``, ``"android.permission.REQUEST_OBSERVE_COMPANION_DEVICE_PRESENCE"``, ``"android.permission.REQUEST_PASSWORD_COMPLEXITY"``, ``"android.permission.RESTART_PACKAGES"``, ``"android.permission.SCHEDULE_EXACT_ALARM"``, ``"android.permission.SEND_SMS"``, ``"android.permission.SET_WALLPAPER_HINTS"``, ``"android.permission.SET_WALLPAPER"``, ``"android.permission.SUBSCRIBED_FEEDS_READ"``, ``"android.permission.SUBSCRIBED_FEEDS_WRITE"``, ``"android.permission.TRANSMIT_IR"``, ``"android.permission.UPDATE_PACKAGES_WITHOUT_USER_ACTION"``, ``"android.permission.USE_BIOMETRIC"``, ``"android.permission.USE_CREDENTIALS"``, ``"android.permission.USE_EXACT_ALARM"``, ``"android.permission.USE_FINGERPRINT"``, ``"android.permission.USE_FULL_SCREEN_INTENT"``, ``"android.permission.USE_SIP"``, ``"android.permission.UWB_RANGING"``, ``"android.permission.VIBRATE"``, ``"android.permission.WAKE_LOCK"``, ``"android.permission.WRITE_CALENDAR"``, ``"android.permission.WRITE_CALL_LOG"``, ``"android.permission.WRITE_CONTACTS"``, ``"android.permission.WRITE_EXTERNAL_STORAGE"``, ``"android.permission.WRITE_PROFILE"``, ``"android.permission.WRITE_SMS"``, ``"android.permission.WRITE_SOCIAL_STREAM"``, ``"android.permission.WRITE_SYNC_SETTINGS"``, ``"android.permission.WRITE_USER_DICTIONARY"``, ``"com.android.alarm.permission.SET_ALARM"``, ``"com.android.browser.permission.READ_HISTORY_BOOKMARKS"``, ``"com.android.browser.permission.WRITE_HISTORY_BOOKMARKS"``, ``"com.android.launcher.permission.INSTALL_SHORTCUT"``, ``"com.android.launcher.permission.UNINSTALL_SHORTCUT"``, ``"com.android.voicemail.permission.ADD_VOICEMAIL"``, ``"com.google.android.gms.dck.permission.DIGITAL_KEY_READ"``, ``"com.google.android.gms.dck.permission.DIGITAL_KEY_WRITE"``, ``"com.google.android.gms.permission.ACTIVITY_RECOGNITION"``, ``"com.google.android.gms.permission.AD_ID_NOTIFICATION"``, ``"com.google.android.gms.permission.AD_ID"``, ``"com.google.android.gms.permission.CAR_FUEL"``, ``"com.google.android.gms.permission.CAR_MILEAGE"``, ``"com.google.android.gms.permission.CAR_SPEED"``, ``"com.google.android.gms.permission.CAR_VENDOR_EXTENSION"``, ``"com.google.android.gms.permission.REQUEST_SCREEN_LOCK_COMPLEXITY"``, ``"com.google.android.gms.permission.TRANSFER_WIFI_CREDENTIAL"``, ``"com.google.android.ims.providers.ACCESS_DATA"``, ``"com.google.android.providers.gsf.permission.READ_GSERVICES"``]

The IDs of known permissions on Android.

#### Defined in

appstraction/dist/index.d.ts:23

___

### iosPermissions

• `Const` **iosPermissions**: readonly [``"kTCCServiceLiverpool"``, ``"kTCCServiceUbiquity"``, ``"kTCCServiceCalendar"``, ``"kTCCServiceAddressBook"``, ``"kTCCServiceReminders"``, ``"kTCCServicePhotos"``, ``"kTCCServiceMediaLibrary"``, ``"kTCCServiceBluetoothAlways"``, ``"kTCCServiceMotion"``, ``"kTCCServiceWillow"``, ``"kTCCServiceExposureNotification"``, ``"kTCCServiceCamera"``, ``"kTCCServiceMicrophone"``, ``"kTCCServiceUserTracking"``]

The IDs of known permissions on iOS.

#### Defined in

appstraction/dist/index.d.ts:27

## Functions

### getAppPathAll

▸ **getAppPathAll**(`appPath`): `string`[]

Utility function to get an array of all files from an [AppPath](README.md#apppath).

#### Parameters

| Name | Type |
| :------ | :------ |
| `appPath` | [`AppPath`](README.md#apppath) |

#### Returns

`string`[]

#### Defined in

[cyanoacrylate/src/path.ts:12](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/path.ts#L12)

___

### getAppPathMain

▸ **getAppPathMain**(`appPath`): `string`

Utility function to get the main file from an [AppPath](README.md#apppath).

#### Parameters

| Name | Type |
| :------ | :------ |
| `appPath` | [`AppPath`](README.md#apppath) |

#### Returns

`string`

#### Defined in

[cyanoacrylate/src/path.ts:10](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/path.ts#L10)

___

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

▸ **startAnalysis**<`Platform`, `RunTarget`, `Capabilities`\>(`options`): [`Analysis`](README.md#analysis)<`Platform`, `RunTarget`\>

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
| `options` | [`AnalysisOptions`](README.md#analysisoptions)<`Platform`, `RunTarget`, `Capabilities`\> | The options for the analysis. |

#### Returns

[`Analysis`](README.md#analysis)<`Platform`, `RunTarget`\>

An object that can be used to instrument the device and analyze apps.

#### Defined in

[cyanoacrylate/src/index.ts:231](https://github.com/tweaselORG/cyanoacrylate/blob/main/src/index.ts#L231)
