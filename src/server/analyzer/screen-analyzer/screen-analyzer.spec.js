'use strict';

var path = require('path'),
    common = require(path.join(process.env.ROOT, 'test', 'common.js')),
    expect = common.expect,
    config = common.config;

var ScreenAnalyzer = require('./screen-analyzer.js');

describe('ScreenAnalyzer', function () {
    
    describe('#getRandomColors', function () {
        it('should generate random colors, brightness and transition for all lights', function(done) {
            var screenAnalyzer = new ScreenAnalyzer(config);
            screenAnalyzer.getRandomColors().then(function(colors) {
                expect(colors).to.exist.and.to.have.length(config.lights.length);
                expect(colors[0]).to.have.property('id');
                expect(colors[0]).to.have.property('color');
                expect(colors[0]).to.have.property('brightness');
                expect(colors[0]).to.have.property('transition');
                done();
            }).catch(function(err) {
                done(err);  
            });
        });
    });
});