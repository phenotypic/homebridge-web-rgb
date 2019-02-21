var Service, Characteristic;
var request = require('request');

module.exports = function(homebridge){
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory('homebridge-web-rgb', 'HTTP-RGB', HTTP_RGB);
};

function HTTP_RGB(log, config) {

    this.log = log;

    this.name = config.name || 'RGB Light';
    this.host = config.host || '';
    this.pollInterval = config.pollInterval || 60;

    this.manufacturer = config.manufacturer || 'HTTP Manufacturer';
    this.model = config.model || 'homebridge-web-rgb';
    this.serial = config.serial || 'HTTP Serial Number';

    this.setBright = this.host + config.setBright;
    this.setColor = this.host + config.setColor;

    this.username = config.username || null;
  	this.password = config.password || null;
    this.timeout = config.timeout || 5000;
    this.http_method = config.http_method || 'GET';

    this.cache = {};
    this.cacheUpdated = false;
    this.cache.hue = 0;
    this.cache.saturation = 0;

    if(this.username != null && this.password != null){
      this.auth = {
        user : this.username,
        pass : this.password
      };
    }

    this.service = new Service.Lightbulb(this.name);
}

HTTP_RGB.prototype = {

  identify: function(callback) {
      this.log('Identify requested!');
      callback();
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
              callback(error, response, body);
          });
  },

  _getStatus: function(callback) {
    this.log("[+] Getting status from:", this.host+"/status");
    var url = this.host+"/status";
    this._httpRequest(url, '', 'GET', function (error, response, responseBody) {
        if (error) {
          this.log("[!] Error getting status: %s", error.message);
  				callback(error);
        } else {
  				var json = JSON.parse(responseBody);
          // Remote Characteristics
          this.log("[*] Thermostat response: ", responseBody);
          this.service.getCharacteristic(Characteristic.On).updateValue(json.currentState);
          this.service.getCharacteristic(Characteristic.Brightness).updateValue(json.currentBrightness);
          // Local Characteristics
          this.service.getCharacteristic(Characteristic.Hue).updateValue(this.cache.hue);
          this.service.getCharacteristic(Characteristic.Saturation).updateValue(this.cache.saturation);
  				callback();
    }}.bind(this));
  },

  setOn: function(value, callback) {
    this.log("[+] setOn to: %s", value);
    var url = this.host+"/"+value;
    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
        if (error) {
          this.log("[!] Error setting state", error.message);
  				callback(error);
        } else {
          this.log("[*] Sucessfully set state to %s", value);
  				callback();
        }
    }.bind(this));
  },

  setBrightness: function(value, callback) {
    this.log("[+] setBrightness to: ", value);
    var url = this.setBright.replace('%s', value);
    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
        if (error) {
          this.log("[!] Error setting brightness", error.message);
  				callback(error);
        } else {
          this.log("[*] Sucessfully set brightness to %s", value);
  				callback();
        }
    }.bind(this));
  },

  setHue: function(value, callback) {
    this.cache.hue = value;
    if (this.cacheUpdated) {
        this._setRGB(callback);
    } else {
        this.cacheUpdated = true;
        callback();
    }
  },

  setSaturation: function(value, callback) {
    this.cache.saturation = value;
    if (this.cacheUpdated) {
        this._setRGB(callback);
    } else {
        this.cacheUpdated = true;
        callback();
    }
  },

  _setRGB: function(callback) {
      var rgb = this._hsvToRgb(this.cache.hue, this.cache.saturation, 100);

      var r = this._decToHex(rgb.r);
      var g = this._decToHex(rgb.g);
      var b = this._decToHex(rgb.b);

      var url = this.setColor.replace('%s', r + g + b);
      this.cacheUpdated = false;

      this.log('[+] _setRGB converting H:%s S:%s B:%s to RGB:%s ...', this.cache.hue, this.cache.saturation, 100, r + g + b);

      this._httpRequest(url, '', this.http_method, function(error, response, body) {
          if (error) {
              this.log('... _setRGB() failed: %s', error);
              callback(error);
          } else {
              this.log('[*]] _setRGB() successfully set to #%s', r + g + b);
              callback();
          }
      }.bind(this));
  },

    _hsvToRgb: function(h, s, v) {
        var r, g, b, i, f, p, q, t;

        h /= 360;
        s /= 100;
        v /= 100;

        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }
        var rgb = { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
        return rgb;
    },

    _decToHex: function(d, padding) {
        var hex = Number(d).toString(16).toUpperCase();
        padding = typeof (padding) === 'undefined' || padding === null ? padding = 2 : padding;

        while (hex.length < padding) {
            hex = '0' + hex;
        }

        return hex;
    },

    getServices: function() {

    this.informationService = new Service.AccessoryInformation();
    this.informationService
		  .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
		  .setCharacteristic(Characteristic.Model, this.model)
		  .setCharacteristic(Characteristic.SerialNumber, this.serial);

		this.service
			.getCharacteristic(Characteristic.On)
			.on('set', this.setOn.bind(this));

    this.service
			.getCharacteristic(Characteristic.Brightness)
			.on('set', this.setBrightness.bind(this));

		this.service
			.getCharacteristic(Characteristic.Saturation)
			.on('set', this.setSaturation.bind(this));

		this.service
			.getCharacteristic(Characteristic.Hue)
			.on('set', this.setHue.bind(this));

      // This fills the homebridge cache on startup with current values, so that any request before the first poll has valid values
      this._getStatus(function() {

      }.bind(this));

      // This polls the thermostat device once per minute and updates homebridge with the current values
      setInterval(function() {
        this._getStatus(function() {
        }.bind(this));
      }.bind(this), this.pollInterval * 1000);

    return [this.informationService, this.service];
  }

};
