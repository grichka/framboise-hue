'use strict';

var path = require('path'),
    _ = require('lodash');

var ScreenAnalyzer = require(path.join(process.env.ROOT, 'analyzer', 'screen-analyzer', 'screen-analyzer.js'));
var SoundAnalyzer = require(path.join(process.env.ROOT, 'analyzer', 'sound-analyzer', 'sound-analyzer.js'));

/**
 * Analyzer class. 
 * An analyzer object is in charge of calling screen and sound analyzers and to corelate their results.
 */
function Analyzer(config, eventBus) {
    this.screenAnalyzer = new ScreenAnalyzer(config);
    this.soundAnalyzer = new SoundAnalyzer(config);

    this.interval = _.get(config, 'analysis.interval');
    this.colorMethod = _.get(config, 'screenAnalyzer.colorMethod', 'getScreenDominantColor');

    this.start = function() {
        var that = this;
        that.analysisLoop = setInterval(function() {
            that.screenAnalyzer[that.colorMethod]().then(function(colors) {
                eventBus.emit('colors', colors);
            }).catch(function(err) {
                that.stop();
                console.log(err);
            });
        }, that.interval);
    };

    this.stop = function() {
        clearInterval(this.analysisLoop);
    };
}

module.exports = Analyzer;