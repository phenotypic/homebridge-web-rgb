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
  this.requestArray = ['color', 'brightness', 'state']

  this.manufacturer = config.manufacturer || packageJson.author.name
  this.serial = config.serial || this.apiroute
  this.model = config.model || packageJson.name
  this.firmware = config.firmware || packageJson.version

  this.username = config.username || null
  this.password = config.password || null
  this.timeout = config.timeout || 3000
  this.http_method = config.http_method || 'GET'

  this.enableColor = config.enableColor || true
  this.enableBrightness = config.enableBrightness || true

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
      var parts = request.url.split('/')
      var partOne = parts[parts.length - 2]
      var partTwo = parts[parts.length - 1]
      if (parts.length === 3 && this.requestArray.includes(partOne)) {
        this.log('Handling request: %s', request.url)
        response.end('Handling request')
        this._httpHandler(partOne, partTwo)
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
    this.log('Getting status: %s', url)

    this._httpRequest(url, '', 'GET', function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error getting status: %s', error.message)
        this.service.getCharacteristic(Characteristic.On).updateValue(new Error('Polling failed'))
        callback(error)
      } else {
        this.log('Device response: %s', responseBody)
        var json = JSON.parse(responseBody)
        var hsv = convert.hex.hsv(json.currentColor)
        this.cacheHue = hsv[0]
        this.cacheSaturation = hsv[1]
        this.service.getCharacteristic(Characteristic.On).updateValue(json.currentState)
        this.log('Updated state: %s', json.currentState)
        if (this.enableBrightness) {
          this.service.getCharacteristic(Characteristic.Brightness).updateValue(json.currentBrightness)
          this.log('Updated brightness: %s', json.currentBrightness)
        }
        if (this.enableColor) {
          this.service.getCharacteristic(Characteristic.Hue).updateValue(this.cacheHue)
          this.log('Updated hue: %s', this.cacheHue)
          this.service.getCharacteristic(Characteristic.Saturation).updateValue(this.cacheSaturation)
          this.log('Updated saturation: %s', this.cacheSaturation)
        }
        callback()
      }
    }.bind(this))
  },

  _httpHandler: function (characteristic, value) {
    switch (characteristic) {
      case 'state':
        this.log('Updating %s to: %s', characteristic, value)
        this.service.getCharacteristic(Characteristic.On).updateValue(value)
        break
      case 'brightness':
        this.log('Updating %s to: %s', characteristic, value)
        this.service.getCharacteristic(Characteristic.Brightness).updateValue(value)
        break
      case 'color':
        var hsv = convert.hex.hsv(value)
        this.cacheHue = hsv[0]
        this.cacheSaturation = hsv[1]
        this.service.getCharacteristic(Characteristic.Hue).updateValue(this.cacheHue)
        this.log('Updating hue to: %s', this.cacheHue)
        this.service.getCharacteristic(Characteristic.Saturation).updateValue(this.cacheSaturation)
        this.log('Updating saturation to: %s', this.cacheSaturation)
        break
      default:
        this.log.warn('Unknown characteristic "%s" with value "%s"', characteristic, value)
    }
  },

  setOn: function (value, callback) {
    var url = this.apiroute + '/setState/' + value
    this.log('Setting state: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error setting state: %s', error.message)
        callback(error)
      } else {
        this.log('Successfully set state to %s', value)
        callback()
      }
    }.bind(this))
  },

  setBrightness: function (value, callback) {
    var url = this.apiroute + '/setBrightness/' + value
    this.log('Setting brightness: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error setting brightness: %s', error.message)
        callback(error)
      } else {
        this.log('Successfully set brightness to %s', value)
        callback()
      }
    }.bind(this))
  },

  setHue: function (value, callback) {
    this.log('Setting hue to: %s', value)
    this.cacheHue = value
    this._setRGB(callback)
  },

  setSaturation: function (value, callback) {
    this.log('Setting saturation to: %s', value)
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
    var url = this.apiroute + '/setColor/' + hex
    this.log('Setting color: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error setting color: %s', error)
        callback(error)
      } else {
        this.log('Successfully set color to: %s', hex)
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

    if (this.enableBrightness) {
      this.service
        .getCharacteristic(Characteristic.Brightness)
        .on('set', this.setBrightness.bind(this))
    }

    if (this.enableColor) {
      this.service
        .getCharacteristic(Characteristic.Saturation)
        .on('set', this.setSaturation.bind(this))
      this.service
        .getCharacteristic(Characteristic.Hue)
        .on('set', this.setHue.bind(this))
    }

    this._getStatus(function () {})

    setInterval(function () {
      this._getStatus(function () {})
    }.bind(this), this.pollInterval * 1000)

    return [this.informationService, this.service]
  }

}
