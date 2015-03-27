'use strict';

var Filter = require('broccoli-filter');
var po2json = require('po2json');

function Po2JsonFilter (inputTree, options) {
    if (!(this instanceof Po2JsonFilter)) {
        return new Po2JsonFilter(inputTree, options);
    }

    this.inputTree = inputTree;
    this.options = options || {};

    this.options.stringify = true;
    if (!this.options.format) {
        this.options.format = 'jed1.x';
    }
}

Po2JsonFilter.prototype = Object.create(Filter.prototype);
Po2JsonFilter.prototype.constructor = Po2JsonFilter;

Po2JsonFilter.prototype.extensions = ['po'];
Po2JsonFilter.prototype.targetExtension = 'js';

Po2JsonFilter.prototype.processString = function (string) {
    var result = po2json.parse(string, this.options);
    return result;
};

module.exports = Po2JsonFilter;
