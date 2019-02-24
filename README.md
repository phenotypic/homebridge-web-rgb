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
| Key | Description | Type | Default |
| --- | --- | --- | --- |
| `accessory` | Must be `HTTP-RGB` | `string` | N/A |
| `name` | Name to appear in the Home app | `string` | N/A |
| `apiroute` | Root URL of your device (excluding the rest of the requests) | `string` | N/A |
| `pollInterval` _(optional)_ | Time between when homebridge will check the `/status` of your device | `integer` (seconds) | `60` |

### Additional options
| Key | Description | Type | Default |
| --- | --- | --- | --- |
| `timeout` _(optional)_ | Time until the accessory will be marked as "Not Responding" if it is unreachable | `integer` (milliseconds) | `5000` |
| `http_method` _(optional)_ | The HTTP method used to communicate with the device | `string` | `GET` |
| `username` _(optional)_ | Username if HTTP authentication is enabled | `string` | N/A |
| `password` _(optional)_ | Password if HTTP authentication is enabled | `string` | N/A |
| `model` _(optional)_ | Appears under "Model" for your accessory in the Home app | `string` | `homebridge-web-rgb` |
| `serial` _(optional)_ | Appears under "Serial" for your accessory in the Home app | `string` | `HTTP Serial Number` |
| `manufacturer` _(optional)_ | Appears under "Manufacturer" for your accessory in the Home app | `string` | `HTTP Manufacturer` |

## API Interfacing

Your API should be able to:

1. Return info when it receives `/status` in the JSON format like below:
```
{
    "currentState": {BOOL_VALUE},
    "currentBrightness": {INT_VALUE},
    "currentColor": "{HEX_VALUE}"
}
```

2. Set the state when it receives:
```
/setState/{BOOL_VALUE}
```

3. Set the color when it receives:
```
/setColor/{HEX_VALUE}
```

4. Set the brightness when it receives:
```
/setBrightness/{INT_VALUE_0_TO_100}
```

## To-do

- [ ] Fix an issue where changing the color too fast may cause the values to come out of sync due to how the plugin handles the way HomeKit requests the color (rarely occurs, fixes on subsequent poll)
