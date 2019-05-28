# homebridge-web-rgb

[![npm](https://img.shields.io/npm/v/homebridge-web-rgb.svg)](https://www.npmjs.com/package/homebridge-web-rgb) [![npm](https://img.shields.io/npm/dt/homebridge-web-rgb.svg)](https://www.npmjs.com/package/homebridge-web-rgb)

## Description

This [homebridge](https://github.com/nfarina/homebridge) plugin exposes a web-based RGB device to Apple's [HomeKit](http://www.apple.com/ios/home/). Using simple HTTP requests, the plugin allows you to turn on/off the light as well as control its color and brightness.

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
| `pollInterval` _(optional)_ | Time (in seconds) between device polls | `60` |

## Optional fields
| Key | Description | Default |
| --- | --- | --- |
| `enableColor` | Whether to expose color for your RGB device | `true` |
| `enableBrightness` | Whether to expose brightness for your RGB device | `true` |

### Additional options
| Key | Description | Default |
| --- | --- | --- |
| `timeout` _(optional)_ | Time (in milliseconds) until the accessory will be marked as _Not Responding_ if it is unreachable | `3000` |
| `http_method` _(optional)_ | HTTP method used to communicate with the device | `GET` |
| `username` _(optional)_ | Username if HTTP authentication is enabled | N/A |
| `password` _(optional)_ | Password if HTTP authentication is enabled | N/A |
| `model` _(optional)_ | Appears under the _Model_ field for the accessory | `homebridge-web-rgb` |
| `serial` _(optional)_ | Appears under the _Serial_ field for the accessory | apiroute |
| `manufacturer` _(optional)_ | Appears under the _Manufacturer_ field for the accessory | `Tom Rodrigues` |

## API Interfacing

Your API should be able to:

1. Return JSON information when it receives `/status`:
```
{
    "currentState": BOOL_VALUE,
    "currentBrightness": INT_VALUE,
    "currentColor": "HEX_VALUE"
}
```

2. Set the state when it receives:
```
/setState/BOOL_VALUE
```

3. Set the color when it receives:
```
/setColor/HEX_VALUE
```

4. Set the brightness when it receives:
```
/setBrightness/INT_VALUE
```
