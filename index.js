'use strict';

var fs = require('fs');
var glob = require('glob');
var mkdirp = require('mkdirp');
var path = require('path');

var Plugin = require('broccoli-caching-writer');
var po2json = require('po2json');

function Po2JsonWriter (inputNodes, options) {
    if (!(this instanceof Po2JsonWriter)) {
        return new Po2JsonWriter(inputNodes, options);
    }

    Plugin.call(this, inputNodes, options);

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

Po2JsonWriter.prototype = Object.create(Plugin.prototype);
Po2JsonWriter.prototype.constructor = Po2JsonWriter;

/**
 * Find all .po files within input paths, and output compiled JSON/JS
 * versions as .js files directly into the destination directory,
 * using the locale name as file name.
 */
Po2JsonWriter.prototype.build = function () {
    var
        self = this,
        destPath = path.join(this.outputPath, this.options.destDir),
        compiledLocales,
        index;

    if (!fs.existsSync(destPath)) {
        mkdirp.sync(destPath);
    }

    compiledLocales = this.listFiles()
        .filter(function (path) {
            return path.substr(-3) === '.po';
        })
        .map(function (file) {
            var locale = /([^/]+)\/LC_MESSAGES\/.+\.po/.exec(file)[1];
            var data = self.compile(file);
            var destFile = fs.openSync(path.join(destPath, locale + '.js'), 'w');

            fs.writeSync(destFile, data);

            return locale;
        });

    if (compiledLocales.length) {
        if (this.options.es6) {
            index = this.generateES6Index(compiledLocales);
        }
        else if (this.options.node) {
            index = this.generateNodeIndex(compiledLocales);
        }

        if (index) {
            fs.writeSync(fs.openSync(path.join(destPath, 'index.js'), 'w'), index);
        }
    }
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
