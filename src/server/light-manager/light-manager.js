'use strict';

var path = require('path');

var Hue = require(path.join(process.env.ROOT, 'light-manager', 'hue', 'hue.js'));

/**
 * LightManager class.
 * A light manager object to control connected lights like philips Hue.
 */
function LightManager(config) {
    this.hue = new Hue(config);

    this.connect = function() {
        this.hue.connectToBridge();
    };
    
    this.apply = function(colors) {
        console.log(colors);
    };
}

module.exports = LightManager;