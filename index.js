'use strict';

var fs = require('fs');
var glob = require('glob');
var mkdirp = require('mkdirp');
var path = require('path');

var Writer = require('broccoli-writer');
var po2json = require('po2json');

function Po2JsonWriter (inputTree, options) {
    if (!(this instanceof Po2JsonWriter)) {
        return new Po2JsonWriter(inputTree, options);
    }

    this.inputTree = inputTree;
    this.options = options || {};

    // Set sensible src and dest directory defaults
    if (!this.options.srcDir) {
        this.options.srcDir = '/';
    }

    if (!this.options.destDir) {
        this.options.destDir = '/';
    }

    // Make sure po2json returns a string and not a JSON object
    this.options.stringify = true;

    // Default to Jed v1.x and higher format for output
    if (!this.options.format) {
        this.options.format = 'jed1.x';
    }
}

Po2JsonWriter.prototype = Object.create(Writer.prototype);
Po2JsonWriter.prototype.constructor = Po2JsonWriter;

/**
 * Find all .po files within defined source directory, and output
 * compiled JSON/JS versions as .js files directly into the destination
 * directory, using the locale name as file name.
 */
Po2JsonWriter.prototype.write = function (readTree, destDir) {
    var self = this;

    return readTree(this.inputTree).then(function (srcDir) {
        var
            srcPath = path.join(srcDir, self.options.srcDir),
            destPath = path.join(destDir, self.options.destDir),
            compiledLocales = [],
            index;

        if (!fs.existsSync(destPath)) {
            mkdirp.sync(destPath);
        }

        var files = glob.sync('**/*.po', {
            cwd: srcPath
        });

        files.forEach(function (file) {
            var locale = file.split(path.sep)[0];
            var data = self.compile(path.join(srcPath, file));
            var destFile = fs.openSync(path.join(destPath, locale + '.js'), 'w');

            fs.writeSync(destFile, data);

            compiledLocales.push(locale);
        });

        if (compiledLocales.length) {
            if (self.options.es6) {
                index = self.generateES6Index(compiledLocales);
            }
            else if (self.options.node) {
                index = self.generateNodeIndex(compiledLocales);
            }

            if (index) {
                fs.writeSync(fs.openSync(path.join(destPath, 'index.js'), 'w'), index);
            }
        }
    });
};

/**
 * Run actual compilation of .po file through po2json.
 *
 * If either es6 or node option is enabled the JSON output of po2json
 * will be wrapped in ES6 or CommonJS export directive, making the
 * output a valid module in either module system.
 */
Po2JsonWriter.prototype.compile = function (poFile) {
    var result = po2json.parseFileSync(poFile, this.options);

    if (this.options.es6) {
        result = 'export default ' + result + ';';
    }
    else if (this.options.node) {
        result = 'module.exports = ' + result + ';';
    }

    return result;
};

/**
 * Generate ES6 module syntax index module for all compiled locales.
 *
 * This is only created if .po files were compiled with the es6 option enabled.
 */
Po2JsonWriter.prototype.generateES6Index = function (locales) {
    var
        imports = '',
        exports = [];

    locales.forEach(function (locale) {
        imports += "import " + locale + " from './" + locale + "';\n";
        exports.push(locale + ': ' + locale);
    });

    return imports + (
        'export default {' +
            exports.join(',') +
        '};'
    );
};

/**
 * Generate CommonJS module syntax index module for all compiled locales.
 *
 * This is only created if .po files were compiled with the node option enabled.
 */
Po2JsonWriter.prototype.generateNodeIndex = function (locales) {
    var
        imports = '',
        exports = [];

    locales.forEach(function (locale) {
        imports += 'var ' + locale + " = require('./" + locale + "');\n";
        exports.push(locale + ': ' + locale);
    });

    return imports + (
        'module.exports = {' +
            exports.join(',') +
        '};'
    );
};

module.exports = Po2JsonWriter;
