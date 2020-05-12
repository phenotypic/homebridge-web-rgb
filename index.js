var Service, Characteristic
const packageJson = require('./package.json')
const request = require('request')
const convert = require('color-convert')
const ip = require('ip')
const http = require('http')

module.exports = function (homebridge) {
  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  homebridge.registerAccessory('homebridge-web-rgb', 'HTTP-RGB', HTTP_RGB)
}

function HTTP_RGB (log, config) {
  this.log = log

  this.name = config.name
  this.apiroute = config.apiroute
  this.pollInterval = config.pollInterval || 300

  this.listener = config.listener || false
  this.port = config.port || 2000
  this.requestArray = ['color', 'brightness', 'state', 'colorTemperature']

  this.manufacturer = config.manufacturer || packageJson.author.name
  this.serial = config.serial || this.apiroute
  this.model = config.model || packageJson.name
  this.firmware = config.firmware || packageJson.version

  this.username = config.username || null
  this.password = config.password || null
  this.timeout = config.timeout || 3000
  this.http_method = config.http_method || 'GET'

  this.disableColor = config.disableColor || false
  this.disableBrightness = config.disableBrightness || false
  this.colorTemperature = config.colorTemperature || false

  this.cacheHue = 0
  this.cacheSaturation = 0
  this.count = 0

  if (this.username != null && this.password != null) {
    this.auth = {
      user: this.username,
      pass: this.password
    }
  }

  if (this.listener) {
    this.server = http.createServer(function (request, response) {
      var baseURL = 'http://' + request.headers.host + '/'
      var url = new URL(request.url, baseURL)
      if (this.requestArray.includes(url.pathname.substr(1))) {
        this.log.debug('Handling request')
        response.end('Handling request')
        this._httpHandler(url.pathname.substr(1), url.searchParams.get('value'))
      } else {
        this.log.warn('Invalid request: %s', request.url)
        response.end('Invalid request')
      }
    }.bind(this))

    this.server.listen(this.port, function () {
      this.log('Listen server: http://%s:%s', ip.address(), this.port)
    }.bind(this))
  }

  this.service = new Service.Lightbulb(this.name)
}

HTTP_RGB.prototype = {

  identify: function (callback) {
    this.log('Identify requested!')
    callback()
  },

  _httpRequest: function (url, body, method, callback) {
    request({
      url: url,
      body: body,
      method: this.http_method,
      timeout: this.timeout,
      rejectUnauthorized: false,
      auth: this.auth
    },
    function (error, response, body) {
      callback(error, response, body)
    })
  },

  _getStatus: function (callback) {
    var url = this.apiroute + '/status'
    this.log.debug('Getting status: %s', url)

    this._httpRequest(url, '', 'GET', function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error getting status: %s', error.message)
        this.service.getCharacteristic(Characteristic.On).updateValue(new Error('Polling failed'))
        callback(error)
      } else {
        this.log.debug('Device response: %s', responseBody)
        var json = JSON.parse(responseBody)
        var hsv = convert.hex.hsv(json.currentColor)
        this.cacheHue = hsv[0]
        this.cacheSaturation = hsv[1]
        this.service.getCharacteristic(Characteristic.On).updateValue(json.currentState)
        this.log.debug('Updated state to: %s', json.currentState)
        if (!this.disableBrightness) {
          this.service.getCharacteristic(Characteristic.Brightness).updateValue(json.currentBrightness)
          this.log.debug('Updated brightness to: %s', json.currentBrightness)
        }
        if (!this.disableColor) {
          this.service.getCharacteristic(Characteristic.Hue).updateValue(this.cacheHue)
          this.log.debug('Updated hue to: %s', this.cacheHue)
          this.service.getCharacteristic(Characteristic.Saturation).updateValue(this.cacheSaturation)
          this.log.debug('Updated saturation to: %s', this.cacheSaturation)
          this.log.debug('Updated color to: %s', json.currentColor)
        }
        if (this.colorTemperature) {
          this.service.getCharacteristic(Characteristic.ColorTemperature).updateValue(json.colorTemperature)
          this.log.debug('Updated color temperature to: %s', json.colorTemperature)
        }
        callback()
      }
    }.bind(this))
  },

  _httpHandler: function (characteristic, value) {
    switch (characteristic) {
      case 'state':
        this.service.getCharacteristic(Characteristic.On).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        break
      case 'brightness':
        this.service.getCharacteristic(Characteristic.Brightness).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        break
      case 'colorTemperature':
        this.service.getCharacteristic(Characteristic.ColorTemperature).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        break
      case 'color':
        var hsv = convert.hex.hsv(value)
        this.cacheHue = hsv[0]
        this.cacheSaturation = hsv[1]
        this.service.getCharacteristic(Characteristic.Hue).updateValue(this.cacheHue)
        this.log.debug('Updated hue to: %s', this.cacheHue)
        this.service.getCharacteristic(Characteristic.Saturation).updateValue(this.cacheSaturation)
        this.log.debug('Updated saturation to: %s', this.cacheSaturation)
        this.log('Updated %s to: %s', characteristic, value)
        break
      default:
        this.log.warn('Unknown characteristic "%s" with value "%s"', characteristic, value)
    }
  },

  setOn: function (value, callback) {
    var url = this.apiroute + '/setState?value=' + value
    this.log.debug('Setting state: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error setting state: %s', error.message)
        callback(error)
      } else {
        this.log('Set state to %s', value)
        callback()
      }
    }.bind(this))
  },

  setColorTemperature: function (value, callback) {
    var url = this.apiroute + '/setColorTemperature?value=' + value
    this.log.debug('Setting color temperature: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error setting color temperature: %s', error.message)
        callback(error)
      } else {
        this.log('Set color temperature to %s', value)
        callback()
      }
    }.bind(this))
  },

  setBrightness: function (value, callback) {
    var url = this.apiroute + '/setBrightness?value=' + value
    this.log.debug('Setting brightness: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error setting brightness: %s', error.message)
        callback(error)
      } else {
        this.log('Set brightness to %s', value)
        callback()
      }
    }.bind(this))
  },

  setHue: function (value, callback) {
    this.log.debug('Setting hue to: %s', value)
    this.cacheHue = value
    this._setRGB(callback)
  },

  setSaturation: function (value, callback) {
    this.log.debug('Setting saturation to: %s', value)
    this.cacheSaturation = value
    this._setRGB(callback)
  },

  _setRGB: function (callback) {
    this.count = this.count + 1
    if (this.count === 1) {
      callback()
      return
    }

    var hex = convert.hsv.hex(this.cacheHue, this.cacheSaturation, 100)
    var url = this.apiroute + '/setColor?value=' + hex
    this.log.debug('Setting color: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error setting color: %s', error)
        callback(error)
      } else {
        this.log('Set color to: %s', hex)
        callback()
      }
      this.count = 0
    }.bind(this))
  },

  getServices: function () {
    this.informationService = new Service.AccessoryInformation()
    this.informationService
      .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
      .setCharacteristic(Characteristic.Model, this.model)
      .setCharacteristic(Characteristic.SerialNumber, this.serial)
      .setCharacteristic(Characteristic.FirmwareRevision, this.firmware)

    this.service
      .getCharacteristic(Characteristic.On)
      .on('set', this.setOn.bind(this))

    if (!this.disableBrightness) {
      this.service
        .getCharacteristic(Characteristic.Brightness)
        .on('set', this.setBrightness.bind(this))
    }

    if (!this.disableColor) {
      this.service
        .getCharacteristic(Characteristic.Saturation)
        .on('set', this.setSaturation.bind(this))
      this.service
        .getCharacteristic(Characteristic.Hue)
        .on('set', this.setHue.bind(this))
    }

    if (this.colorTemperature) {
      this.service
        .getCharacteristic(Characteristic.ColorTemperature)
        .on('set', this.setColorTemperature.bind(this))
    }

    this._getStatus(function () {})

    setInterval(function () {
      this._getStatus(function () {})
    }.bind(this), this.pollInterval * 1000)

    return [this.informationService, this.service]
  }

}
