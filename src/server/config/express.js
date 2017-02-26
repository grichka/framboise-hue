'use strict';

var express = require('express'),
    path = require('path'),
    ejs = require('ejs'),
    bodyParser = require('body-parser'),
    expressValidator = require('express-validator');

module.exports = function(app) {
    // Serve files under client as static files (cache 1 day)
    var maxAge = 86400000;
    app.use(express.static(path.join(process.env.ROOT, 'client'), {
        setHeaders: function(res) {
            res.set('Cache-Control', 'private, no-cache, must-revalidate, max-age=' + maxAge);
        }
    }));

    // Views related settings
    app.engine('html', ejs.renderFile);
    app.set('views', path.join(process.env.ROOT + 'client', 'views'));
    app.set('view engine', 'html');

    // body-parser
    app.use(bodyParser.json({limit: '100Kb'}));
    app.use(bodyParser.urlencoded({extended: true}));

    //Express-validator
    app.use(expressValidator());
};