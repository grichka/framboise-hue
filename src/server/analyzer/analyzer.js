'use strict';

var path = require('path');

var ScreenAnalyzer = require(path.join(process.env.ROOT, 'analyzer', 'screen-analyzer', 'screen-analyzer.js'));
var SoundAnalyzer = require(path.join(process.env.ROOT, 'analyzer', 'sound-analyzer', 'sound-analyzer.js'));

function Analyzer(config/*, eventBus*/) {
    this.screenAnalyzer = new ScreenAnalyzer(config);
    this.soundAnalyzer = new SoundAnalyzer(config);

    this.start = function() {
        console.log('start');
    };
    this.stop = function() {
        console.log('stop');
    };
}

module.exports = Analyzer;