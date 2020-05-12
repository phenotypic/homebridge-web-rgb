<p align="center">
  <a href="https://github.com/homebridge/homebridge"><img src="https://raw.githubusercontent.com/homebridge/branding/master/logos/homebridge-color-round-stylized.png" height="140"></a>
</p>

<span align="center">

# homebridge-web-rgb

[![npm](https://img.shields.io/npm/v/homebridge-web-rgb.svg)](https://www.npmjs.com/package/homebridge-web-rgb) [![npm](https://img.shields.io/npm/dt/homebridge-web-rgb.svg)](https://www.npmjs.com/package/homebridge-web-rgb)

</span>

## Description

This [homebridge](https://github.com/nfarina/homebridge) plugin exposes a web-based RGB device to Apple's [HomeKit](http://www.apple.com/ios/home/). Using simple HTTP requests, the plugin allows you to turn on/off the light as well as control its color, color temperature, and brightness.

Find script samples for the RGB controller in the _examples_ folder.

## Installation

1. Install [homebridge](https://github.com/nfarina/homebridge#installation-details)
2. Install this plugin: `npm install -g homebridge-web-rgb`
3. Update your `config.json` file

## Configuration

```json
"accessories": [
     {
       "accessory": "HTTP-RGB",
       "name": "RGB strip",
       "apiroute": "http://myurl.com"
     }
]
```

### Core
| Key | Description | Default |
| --- | --- | --- |
| `accessory` | Must be `HTTP-RGB` | N/A |
| `name` | Name to appear in the Home app | N/A |
| `apiroute` | Root URL of your device | N/A |

## Optional fields
| Key | Description | Default |
| --- | --- | --- |
| `disableColor` | Whether the color characteristic should be hidden | `false` |
| `disableBrightness` | Whether the brightness characteristic should be hidden | `false` |
| `colorTemperature` | Whether to expose the color temperature characteristic separately from the color characteristic | `false` |

### Additional options
| Key | Description | Default |
| --- | --- | --- |
| `pollInterval` | Time (in seconds) between device polls | `300` |
| `listener` | Whether to start a listener to get real-time changes from the device | `false` |
| `timeout` | Time (in milliseconds) until the accessory will be marked as _Not Responding_ if it is unreachable | `3000` |
| `port` | Port for your HTTP listener (if enabled) | `2000` |
| `http_method` | HTTP method used to communicate with the device | `GET` |
| `username` | Username if HTTP authentication is enabled | N/A |
| `password` | Password if HTTP authentication is enabled | N/A |
| `model` | Appears under the _Model_ field for the accessory | plugin |
| `serial` | Appears under the _Serial_ field for the accessory | apiroute |
| `manufacturer` | Appears under the _Manufacturer_ field for the accessory | author |
| `firmware` | Appears under the _Firmware_ field for the accessory | version |

## Examples

| Device type | Changes to `config.json` |
| --- | --- |
| RGB | N/A |
| RGBW/WW | N/A (API handles) |
| Cool/warm white | `"disableColor": true` |
| CCT | `"disableColor": true`, `"colorTemperature": true`|
| RBGCCT | `"colorTemperature": true`|

## API Interfacing

Your API should be able to:

1. Return JSON information when it receives `/status`:
```
{
    "currentState": INT_VALUE,
    "currentBrightness": INT_VALUE,
    "currentColor": "HEX_VALUE"
}
```

**Note:** You must also include the following fields in `/status` where relevant:

- `colorTemperature` (if `colorTemperature` is enabled)

2. Set the state when it receives:
```
/setState?value=BOOL_VALUE
```

3. Set the color when it receives:
```
/setColor?value=HEX_VALUE
```

4. Set the brightness when it receives:
```
/setBrightness?value=INT_VALUE
```

4. Set the color temperature when it receives: (if `colorTemperature` is enabled)
```
/setColorTemperature?value=INT_VALUE
```

### Optional (if listener is enabled)

1. Update `state` following a manual override by messaging the listen server:
```
/state?value=INT_VALUE
```

2. Update `color` following a manual override by messaging the listen server:
```
/color?value=HEX_VALUE
```

3. Update `brightness` following a manual override by messaging the listen server:
```
/brightness?value=INT_VALUE
```

3. Update `colorTemperature` following a manual override by messaging the listen server: (if `colorTemperature` is enabled)
```
/colorTemperature?value=INT_VALUE
```
