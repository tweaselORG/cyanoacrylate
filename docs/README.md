hot-glue

# hot-glue

## Table of contents

### Type Aliases

- [RunTargetOptions](README.md#runtargetoptions)
- [SupportedCapability](README.md#supportedcapability)

### Functions

- [pause](README.md#pause)

## Type Aliases

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
| `android.emulator.startEmulatorOptions?` | { `audio?`: `boolean` ; `emulatorName`: `string` ; `ephemeral?`: `boolean` ; `headless?`: `boolean` ; `proxy?`: `string`  } | Options for the emulator if you want it to be automatically started and stopped by hot-glue. |
| `android.emulator.startEmulatorOptions.audio?` | `boolean` | Whether to start the emulator with audio (default: `false`). |
| `android.emulator.startEmulatorOptions.emulatorName` | `string` | The name of the emulator to start. |
| `android.emulator.startEmulatorOptions.ephemeral?` | `boolean` | Whether to discard all changes when exiting the emulator (default: `true`). |
| `android.emulator.startEmulatorOptions.headless?` | `boolean` | Whether to start the emulator in headless mode (default: `false`). |
| `android.emulator.startEmulatorOptions.proxy?` | `string` | The proxy to use for the emulator, in the format `host:port` or `user:password@host:port`. Currently defaults to `127.0.0.1:8080` (use an empty string to set no proxy), though the default will likely change to "no proxy" in the future. |
| `ios` | { `device`: ``"ssh"`` extends `Capability` ? { `ip`: `string` ; `rootPw?`: `string`  } : `unknown` ; `emulator`: `never`  } | The options for the iOS platform. |
| `ios.device` | ``"ssh"`` extends `Capability` ? { `ip`: `string` ; `rootPw?`: `string`  } : `unknown` | The options for the iOS physical device run target. |
| `ios.emulator` | `never` | The options for the iOS emulator run target. |

#### Defined in

hot-glue/src/index.ts:19

___

### SupportedCapability

Ƭ **SupportedCapability**<`Platform`\>: `Platform` extends ``"android"`` ? ``"frida"`` \| ``"certificate-pinning-bypass"`` : `Platform` extends ``"ios"`` ? ``"ssh"`` \| ``"frida"`` : `never`

A capability supported by hot-glue.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Platform` | extends `SupportedPlatform` |

#### Defined in

hot-glue/src/index.ts:11

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
