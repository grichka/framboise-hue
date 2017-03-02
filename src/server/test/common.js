var path = require('path'),
    fs = require('fs'),
    chai = require('chai');

var config = JSON.parse(fs.readFileSync(path.join(process.env.ROOT, 'config.json')));

module.exports = {
    config: config,
    expect: chai.expect,
    assert: chai.assert
};