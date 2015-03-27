'use strict';

var filter = require('./index');

var tree = filter('./test/data');

module.exports = filter(tree);
