'use strict';

const fs        =   require('fs');
const path      =   require('path');
const async     =   require('async');
const jade      =   require('jade');
const pluralize =   require('pluralize');

const CONFIG  =   require('./config');

/* PRIVATE METHODS */
const _private = (function() {
  const _private = function() {};
  _private.prototype = Object.create(null);
  _private.prototype.constructor = _private;

  _private.prototype.timestamp = function() {
    return '[' + (new Date()).toString() + '] ';
  };

  _private.prototype.loadPath = function(tp, options, callback) {
    let output = {};
    const finalPath = path.join(__dirname, '..', tp);

    const finish = function(err) {
      return callback(err, output);
    };

    fs.readdir(finalPath, (err, files) => {
      if (err) {
        return callback(err);
      }

      async.each(files, (file, done) => {
        let name;
        if (path.extname(file) !== options.extname) {
          return done();
        }

        name = exports.toCamelCase(path.basename(file, options.extname));

        /* We require js files, load the rest as strings */
        if (options.extname === '.js') {
          output[name] = require(path.join(finalPath, file));
          return done();
        }

        fs.readFile(path.join(finalPath, file), 'utf8', (err, data) => {
          output[name] = data;
          return done(err);
        });

      }, finish);

    });
  };

  return new _private();
}());
/* END PRIVATE METHODS */

exports.bootstrap = function(targetPath, callback) {
  _private.loadPath(targetPath, { extname: '.js' }, callback);
};

exports.getTemplate = function(targetPath, callback) {
  const finalPath = path.resolve(__dirname, targetPath);

  fs.readFile(finalPath, 'utf8', (err, data) => {
    if (err) {
      return callback(err);
    }

    if (CONFIG.TEMPLATE_LANG !== 'jade') {
      return callback(null, data);
    }

    return callback(null, jade.compile(data));
  });
};

exports.toCamelCase = function(input) {
  return input.toLowerCase().replace(/-(.)/g, (match, n) => {
    return n.toUpperCase();
  });
};

exports.toProperCase = function(input) {
  input = input.charAt(0).toUpperCase() + input.substr(1);
  return input.replace(/([A-Z]|\.[A-z])/g, (match, n, offset) => {
    if (offset === 0) {
      return n;
    }
    if (n.charAt(0) === '.') {
      return ' ' + n.charAt(1).toUpperCase();
    }
    return ' ' + n;
  });
};

exports.pluralize = function(input) {
  return pluralize(input);
};

exports.log = function(message) {
  console.info(_private.timestamp() + message);
};

exports.makeRoute = require('./routes');
