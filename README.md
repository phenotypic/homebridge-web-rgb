# homebridge-web-rgb

#### Homebridge plugin to control a web-based RGB device

## Description

homebridge-web-thermostat exposes an RGB light to HomeKit and makes it controllable via HTTP requests. The plugin will poll your device at regular intervals and present you with this information when requested. The plugin also allows you so control a light variables via HomeKit such as the brightness.

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
| Key | Description |
| --- | --- |
| `accessory` | Must be `HTTP-RGB` |
| `name` | Name to appear in the Home app |
| `apiroute` | Root URL of your device (excluding the rest of the requests) |
| `pollInterval` _(optional)_ | Time (in seconds) between when homebridge will check the `/status` of your device (`60` is default) |

### Additional options
| Key | Description |
| --- | --- |
| `timeout` _(optional)_ | Time (in milliseconds) until the accessory will be marked as "Not Responding" if it is unreachable (`5000` is default) |
| `http_method` _(optional)_ | The HTTP method used to communicate with the thermostat (`GET` is default) |
| `username` _(optional)_ | Username if HTTP authentication is enabled |
| `password` _(optional)_ | Password if HTTP authentication is enabled |
| `model` _(optional)_ | Appears under "Model" for your accessory in the Home app |
| `serial` _(optional)_ | Appears under "Serial" for your accessory in the Home app |
| `manufacturer` _(optional)_ | Appears under "Manufacturer" for your accessory in the Home app |

## API Interfacing

Your API should be able to:

1. Return info when it recieves `/status` in the JSON format like below:
```
{
    "currentState": {BOOL_VALUE},
    "currentBrightness": {INT_VALUE},
    "currentHEX": "{HEX_VALUE}"
}
```

2. Set the state when it recieves:
```
/setState/{BOOL_VALUE}
```

3. Set the color when it recieves:
```
/setColor/{HEX_VALUE}
```

4. Set the brightness when it recieves:
```
/setBrightness/{INT_VALUE_0_TO_100}
```
