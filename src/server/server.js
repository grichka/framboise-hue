'use strict';

var path = require('path'),
    _ = require('lodash'),
    express = require('express'),
    app = express(),

    config = require(path.join(__dirname, 'config.json')),
    port = _.get(config, 'server.port', 3333);

// process env variables
process.env.ROOT = path.normalize(__dirname);

// Express settings
require(path.join(process.env.ROOT, 'config', 'express.js'))(app);

// Application routes and logic
require(path.join(process.env.ROOT, 'controllers', 'index.js'))(app);

app.listen(port, function() {
    console.log('Framboise Hue app listening on port', port);
});

// on Ctrl+C
process.on('SIGINT', function () {
    // log result
    console.log('Bye!');
    process.exit();
});

module.exports = app;