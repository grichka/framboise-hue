'use strict';

var path = require('path'),
    _ = require('lodash'),
    EventEmitter = require('events');

var config = require(path.join(process.env.ROOT, 'config.json')),
    eventBus = new EventEmitter(),
    analyzer = new(require(path.join(process.env.ROOT, 'analyzer', 'analyzer.js')))(config, eventBus);
analyzer.start();
/**
 * Events
 */
eventBus.on('colors', function(colors) {
    console.log(colors);
});

/**
 * Express APIs
 */
module.exports = function(app) {
    app.get('/', function (req, res) {
        res.send('TODO');
    });

    // req.body can contain a new config to override config.json
    app.post('/start', function (req, res) {
        var newConfig = req.body;
        try {
            analyzer.start(_.isEmpty(newConfig) ? config : newConfig);
            res.send('Started');
        } catch(e) {
            res.status(500).send('Cannot start: ' + e);
        }
    });

    app.post('/stop', function (req, res) {
        try {
            analyzer.stop();
            res.send('Stopped');
        } catch(e) {
            res.send('Cannot stop: '+ e);
        }
    });
};