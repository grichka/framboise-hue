'use strict';

var path = require('path'),
    _ = require('lodash'),
    fs = require('fs'),
    q = require('q'),
    colorThief = new (require('color-thief'))(),
    childProcess = require('child_process');    // exec and spawn

var Canvas = require('canvas'),
    Image = Canvas.Image;

var nircmdPath = path.join(process.env.ROOT, 'lib', 'nircmd-x64', 'nircmd.exe');

var screenshotNumber = {
    screenshotAverageColor: 0,
    screenshotBetterAverageColor: 0,
    screenshotDominantColor: 0,
    screenshotPalette: 0
};
var getScreenshotName = function(name) {
    ++screenshotNumber[name];
    if (screenshotNumber[name] % 10 === 0) {
        screenshotNumber[name] = 0;
    }
    return path.join(process.env.ROOT, '.tmp', name + screenshotNumber[name] + '.png');
};

/**
 * ScreenAnalyzer class.
 * All of its functions return promises.
 */
function ScreenAnalyzer(config) {
    this.useZones = _.get(config, 'screenAnalyzer.useZones', _.has(config, 'lights[0].zone'));
    this.lights = _.get(config, 'lights', []);

    this.x = _.get(config, 'screenAnalyzer.x', 0);
    this.y = _.get(config, 'screenAnalyzer.y', 0);
    this.width = _.get(config, 'screenAnalyzer.width', 1920);
    this.height = _.get(config, 'screenAnalyzer.height', 1080);
    this.interval = _.get(config, 'screenAnalyzer.interval', 100);
    this.colorThiefQuality = _.get(config, 'screenAnalyzer.colorThiefQuality', 8);
    this.paletteColorCount = _.get(config, 'screenAnalyzer.paletteColorCount', 5);
    
    this.canvasWidth = _.get(config, 'screenAnalyzer.canvasWidth', 160);
    this.canvasHeight = _.get(config, 'screenAnalyzer.canvasHeight', 90);
    this.ctx = new Canvas(this.canvasWidth, this.canvasHeight).getContext('2d');
    // ctx.patternQuality('fast');
    this.canvasXScale = this.canvasWidth / this.width;
    this.canvasYScale = this.canvasHeight / this.height;

    this.lowThreshold = _.get(config, 'screenAnalyzer.lowThreshold', 10);
    this.midThreshold = _.get(config, 'screenAnalyzer.midThreshold', 40);
    this.highThreshold = _.get(config, 'screenAnalyzer.highThreshold', 145);
    
    /**
     * Get random colors and brightness to apply to each light
     */
    this.getRandomColor = function() {
        var deferred = q.defer();
        var that = this;
        
        var result = [];
        that.lights.forEach(function(light) {
            var brightness = ((Math.random() * 255) + 1) >> 0; // jshint ignore:line
            if(brightness < light.minBrightness) {
                brightness = light.minBrightness;
            } else if(brightness > light.maxBrightness) {
                brightness = light.maxBrightness;
            }
            result.push({
                id: light.id,
                color: [
                    ((Math.random() * 255) + 1) >> 0, // jshint ignore:line
                    ((Math.random() * 255) + 1) >> 0, // jshint ignore:line
                    ((Math.random() * 255) + 1) >> 0  // jshint ignore:line
                ],
                brightness: brightness,
                transition: light.transition || 0.7
            });
        });
        deferred.resolve(result);
        
        return deferred.promise;
    };

    /**
     * Get the colors to apply to each light corresponding to screen dominant color.
     */
    this.getScreenDominantColor = function() {
        var deferred = q.defer();
        var that = this;
        
        try {
            var screenshotName = getScreenshotName('screenshotDominantColor');
            var nircmd = childProcess.spawn(nircmdPath, ['savescreenshot', screenshotName, that.x, that.y, that.width, that.height]);
            nircmd.on('close', function (/*code, signal*/) {
                // if(that.useZones) {
                //
                // } else {
                var color = colorThief.getColor(screenshotName, that.colorThiefQuality);
                var result = [];
                that.lights.forEach(function(light) {
                    result.push({
                        id: light.id,
                        color: color,
                        brightness: light.maxBrightness, // FIXME
                        transition: light.transition || 0.7
                    });
                });
                deferred.resolve(result);
                // }
            });
        } catch (e) {
            deferred.reject(e);
        }

        return deferred.promise;
    };
    
    /**
     * Get the colors to apply to each light corresponding to screen average color.
     */
    this.getScreenAverageColor = function() {
        var deferred = q.defer();
        var that = this;

        try {
            var screenshotName = getScreenshotName('screenshotAverageColor');
            var nircmd = childProcess.spawn(nircmdPath, ['savescreenshot', screenshotName, that.x, that.y, that.width, that.height]);
            nircmd.on('close', function (/*code, signal*/) {
                fs.readFile(screenshotName, function (err, screenshotBuffer) {
                    if (err) {
                        deferred.reject(err);
                    } else {
                        var img = new Image();
                        img.src = screenshotBuffer;
                        that.ctx.drawImage(img, 0, 0, that.canvasWidth, that.canvasHeight);

                        var result = [];

                        that.lights.forEach(function(light) {
                            var r = 0,
                                g = 0,
                                b = 0,
                                pixelCount = 0;
                            var imageData;
                            if(that.useZones) {
                                imageData = that.ctx.getImageData((light.zone.x * that.canvasXScale) >> 0, (light.zone.y * that.canvasYScale) >> 0, (light.zone.width * that.canvasXScale) >> 0, (light.zone.height * that.canvasYScale) >> 0);//jshint ignore:line
                                // imageData = that.ctx.getImageData(light.zone.x, light.zone.y, light.zone.width, light.zone.height);
                            } else {
                                imageData = that.ctx.getImageData((that.x * that.canvasXScale) >> 0, (that.y * that.canvasYScale) >> 0, (that.width * that.canvasXScale) >> 0, (that.height * that.canvasYScale) >> 0);//jshint ignore:line
                                // imageData = that.ctx.getImageData(that.x, that.y, that.width, that.height);
                            }
                            var imageDataLength = imageData.data.length;
                            // console.log(imageDataLength)

                            var i;
                            for(i = 0 ; i < imageDataLength ; i += 4) {
                                ++pixelCount;
                                r += imageData.data[i];
                                g += imageData.data[i + 1];
                                b += imageData.data[i + 2];
                            }
                            // avoid dividing by zero
                            if(pixelCount === 0) {
                                pixelCount++;
                            }

                            var rAvg = (r / pixelCount) >> 0,// jshint ignore:line
                                gAvg = (g / pixelCount) >> 0,// jshint ignore:line
                                bAvg = (b / pixelCount) >> 0;// jshint ignore:line
                            
                            result.push({
                                id: light.id,
                                color: [rAvg, gAvg, bAvg],
                                brightness: light.maxBrightness, // FIXME
                                transition: light.transition || 0.7
                            });
                        });

                        deferred.resolve(result);
                    }
                });
            });
        } catch (e) {
            deferred.reject(e);
        }

        return deferred.promise;
    };

    /**
     * Get the colors to apply to each light corresponding to screen average color.
     * Uses thresholds and calculates dark pixels ratio to determine the brightness to apply.
     */
    this.getScreenBetterAverageColor = function() {
        var deferred = q.defer();
        var that = this;

        try {
            var screenshotName = getScreenshotName('screenshotBetterAverageColor');
            var nircmd = childProcess.spawn(nircmdPath, ['savescreenshot', screenshotName, that.x, that.y, that.width, that.height]);
            nircmd.on('close', function (/*code, signal*/) {
                fs.readFile(screenshotName, function (err, screenshotBuffer) {
                    if(err) {
                        deferred.reject(err);
                    } else {
                        var img = new Image();
                        img.src = screenshotBuffer;
                        that.ctx.drawImage(img, 0, 0, that.canvasWidth, that.canvasHeight);

                        var result = [];

                        // calculate avg color of all pixels and ratio of each zone
                        that.lights.forEach(function(light) {
                            var r = 0,
                                g = 0,
                                b = 0,
                                darkPixels = 0,
                                midDarkPixels = 0,
                                pixelCount = 0;
                            var imageData;
                            if(that.useZones) {
                                imageData = that.ctx.getImageData((light.zone.x * that.canvasXScale) >> 0, (light.zone.y * that.canvasYScale) >> 0, (light.zone.width * that.canvasXScale) >> 0, (light.zone.height * that.canvasYScale) >> 0);//jshint ignore:line
                            } else {
                                imageData = that.ctx.getImageData((that.x * that.canvasXScale) >> 0, (that.y * that.canvasYScale) >> 0, (that.width * that.canvasXScale) >> 0, (that.height * that.canvasYScale) >> 0);//jshint ignore:line
                            }
                            var imageDataLength = imageData.data.length;

                            var i;
                            for(i = 0 ; i < imageDataLength ; i += 4) {
                                ++pixelCount;
                                
                                var red = imageData.data[i],
                                    green = imageData.data[i + 1],
                                    blue = imageData.data[i + 2];
                                
                                // don't count pixels that are too dark
                                if(red < that.lowThreshold && green < that.lowThreshold && blue < that.lowThreshold) {
                                    ++darkPixels;
                                }
                                // don't count pixels that are too light
                                else if (red > that.highThreshold && green > that.highThreshold && blue > that.highThreshold) {
                                    // nothing
                                } else {
                                    if(red < that.midThreshold && green < that.midThreshold && blue < that.midThreshold) {
                                        ++midDarkPixels;
                                        ++darkPixels;
                                    }
                                    r += red;
                                    g += green;
                                    b += blue;
                                }
                            }

                            var rAvg = (r / pixelCount) >> 0,// jshint ignore:line
                                gAvg = (g / pixelCount) >> 0,// jshint ignore:line
                                bAvg = (b / pixelCount) >> 0;// jshint ignore:line
                            
                            var color = [
                                rAvg < that.lowThreshold ? that.lowThreshold : rAvg,
                                gAvg < that.lowThreshold ? that.lowThreshold : gAvg,
                                bAvg < that.lowThreshold ? that.lowThreshold : bAvg
                            ];

                            // FIXME: add an intensity option to decrease this brightness globally
                            var brightness = (( ((light.maxBrightness - ((darkPixels / pixelCount) * light.maxBrightness) - 1) * (light.maxBrightness - light.minBrightness)) / ((light.maxBrightness - 1) || 1)) + light.minBrightness + 1) >> 0; // jshint ignore:line

                            if(brightness < light.minBrightness) {
                                brightness = light.minBrightness;
                            } else if(brightness > light.maxBrightness) {
                                brightness = light.maxBrightness;
                            }

                            result.push({
                                id: light.id,
                                color: color,
                                brightness: brightness,
                                transition: light.transition || 0.7
                            });
                        });

                        deferred.resolve(result);
                    }
                });
            });
        } catch(e) {
            deferred.reject(e);
        }

        return deferred.promise;
    };
}

module.exports = ScreenAnalyzer;