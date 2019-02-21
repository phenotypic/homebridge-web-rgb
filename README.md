# homebridge-web-rgb

#### Homebridge plugin to control a web-based RGB device

# Installation

1. Install [homebridge](https://github.com/nfarina/homebridge#installation-details).

2. Install this plugin: `npm install -g homebridge-web-rgb`

3. Update your `config.json` file

# Configuration Example

    "accessories": [
        {
            "accessory": "HTTP-RGB",
            "name": "RGB Led Strip",
            "host": "http://192.168.1.200",
            "setBright": "/bset/%s",
            "setColor": "/set/%s"
        }
    ]

### Structure

| Key | Description |
| --- | --- |
| `accessory` | Must be `Thermostat` |
| `name` | Name to appear in the Home app |
| `apiroute` | Root URL of your Thermostat device (excluding the rest of the requests) |
| `setBright` | URL extension to set the brightness |
| `setColor` | URL extension to set the color |
| `pollInterval` _(optional)_ | Time (in seconds) between when homebridge will check the `/status` of your thermostat (`60` is default) |
| `timeout` _(optional)_ | Time (in milliseconds) until the accessory will be marked as "Not Responding" if it is unreachable (`5000` is default) |
| `http_method` _(optional)_ | The HTTP method used to communicate with the thermostat (`GET` is default) |
| `username` _(optional)_ | Username if HTTP authentication is enabled |
| `password` _(optional)_ | Password if HTTP authentication is enabled |
| `model` _(optional)_ | Appears under "Model" for your accessory in the Home app |
| `serial` _(optional)_ | Appears under "Serial" for your accessory in the Home app |
| `manufacturer` _(optional)_ | Appears under "Manufacturer" for your accessory in the Home app |

## API Interfacing

Your API should be able to:

1. Return info when it recieves `/status` in the JSON format like below (only requested from polling):
```
{
    "currentState": BOOL,
    "currentBrightness": FLOAT_VALUE
}
```

2. Turn ON when it recieves `/true`, OFF when it recieves `/false`

3. Set the color when it recieves:
```
/set/HEX
```

4. Set the brightness when it recieves:
```
/bset/0-100
```
