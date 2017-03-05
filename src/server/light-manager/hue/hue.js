'use strict';

var q = require('q'),
    _ = require('lodash');

/**
 * Hue class
 */
function Hue(config) {
    this.ip = _.get(config, 'hue.ip', '192.168.1.10');

    this.connectToBridge = function() {};

    this.setLightState = function(lightId, lightState) {
        var deferred = q.defer();

        deferred.resolve('TODO' + lightId + lightState);

        return deferred.promise;
    };
}

module.exports = Hue;