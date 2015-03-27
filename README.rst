Broccoli.js plugin for po2json
==============================

A simple Broccoli plugin to convert .po files to JSON or JavaScript modules
using po2json.

Expects the source directory tree to be the root of gettext compilation output.
Either pass this root as the input tree, or set the relative path to it using
the srcDir option.

Each directory inside the source directory should be named for the locale it
contains, and .po files should be within these directories.

The plugin will find all .po files, compile to JSON or JS, and store in the
destination tree with the locale name as the file name, and .js extension.

By default all .po files will be converted to JSON format with Jed v1.x and above
syntax. If you want to use the files directly as modules in ES6 or CommonJS
module systems, use the `es6` or `node` option. If you want to change the format
of the JSON object you can pass in a `format` option matching one of the
po2json supported formats.
