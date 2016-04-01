'use strict';

/**
 * Generic Admin Interface
 * For Express 4.x and MongoDB/Mongoose Apps
 *
 * Setup as middleware in your express application.
 * Example: app.use('/admin', require('administrator'));
 */

/* Begin Dependencies */
var CONFIG     =     require('./lib/config');
var helper     =     require('./lib/helper');
var pluralize  =     require('pluralize');
var _          =     require('underscore');
var async      =     require('async');
var express    =     require('express');
var jade       =     require('jade');
var path       =     require('path');
var fs         =     require('fs');
var moment     =     require('moment');
var mongoose   =     require('mongoose');
/* End Dependencies */

var Administrate  = (function() {

  var _private  = {
    options: undefined,
    models: {},
    bindRoutes: function(router, context) {
      this.options = context.getOptions();
      router.all('*', this.options.authMiddlewareFn);
      router.all('*', express.static(path.join(__dirname, 'assets')));
      router.all('*', _private.setLocals);
      router.get('/', _private.routes.home);
      router.param('model', _private.getModel);
      router.param('id', _private.getDoc);
      router.get('/:model/', _private.routes.index);
      router.get('/:model/new', _private.routes.createForm);
      router.get('/:model/search', _private.routes.search);
      router.get('/:model/:id', _private.routes.detail);
      router.get('/:model/:id/:subschema', _private.routes.index);
      router.get('/:model/:id/:subschema/new', _private.routes.createForm);
      router.get('/:model/:id/:subschema/search', _private.routes.search);
      router.get('/:model/:id/:subschema/:subdoc', _private.routes.detail);
      router.post('/:model', _private.routes.create);
      router.post('/:model/:id/:subschema', _private.routes.create);
      router.put('/:model/:id', _private.routes.update);
      router.put('/:model/:id/:subschema/:subdoc', _private.routes.update);
      router.delete('/:model/:id', _private.routes.remove);
      router.delete('/:model/:id/:subschema/:subdoc', _private.routes.remove);

      _private.getModelsList();
      return router;
    },
    parseSchema: function(schema, callback) {
      var inputs = {};
      var subdocs = {};
      async.forEachOf(schema.paths, (path, name, done) => {
        var type, ref;

        if (path.options.hidden || _private.options.pathBlacklist.indexOf(name) >= 0) {
          return done();
        }

        if (path.options.isSubDoc === true) {
          return _private.parseSchema(path.schema, (err, results) => {
            subdocs[name] = results;
            done(err);
          });
        }

        switch (path.options.type.schemaName) {
          case 'String':
            type = path.options.extended ? 'textarea' : 'text';
            break;
          case 'Number':
            type = 'number';
            break;
          case 'Boolean':
            type = 'checkbox';
            break;
          case 'ObjectId':
            if (path.options.hasOwnProperty('ref')) {
              type = 'relationship';
              ref = path.options.ref.toLowerCase();
            }
            break;

          default:
            if (path.instance === 'Date') {
              type = 'date';
            }

            if (path.instance === 'Boolean') {
              type = 'checkbox';
            }

            break;
        }
        if (!type) {
          return done();
        }

        inputs[name] = { type: type, label: name,  name: name, edit:  path.options.edit && path.options.edit === false ? false : true, isFilterable: Boolean(path.options.filter) };

        if (ref) {
          inputs[name].ref = ref;
        }
        done();
      }, (err) => {
        if (err) {
          return callback(err);
        }

        return callback(null, { inputs: inputs, subdocs: subdocs });
      });
    },
    routes: {
      create: function(req, res, next) {
        var data = req.body;
        var subdoc = req.params.subschema || false;
        var model = subdoc ?  res.locals.model : new req.admin.Model(data);

        if (!data) {
          return next('Empty request');
        }

        if (subdoc) {
          if (Array.isArray(model[subdoc])) {
            model[subdoc].push(data);
          } else {
           model[subdoc] = data;
          }
        }

        model.save((err, doc) => {
          if (err) {
            if (err.name === 'ValidationError') {
              return res.status(403).json({ error: err.message, details: _.pluck(err.errors, 'message'), success: false });
            }
            return next(err);
          }

          res.json(subdoc ? _.last(doc[subdoc]) : doc);
        });
      },
      createForm: function(req, res) {
        res.locals.model = {};

        return _private.routes.detail(req, res);
      },
      detail: function(req, res) {
        var subdoc = req.params.subdoc || false;
        var subschema = req.params.subschema || false;
        res.locals.inputs = {};
        res.locals.subdocs = {};
        res.locals.isSubSchema = Boolean(subschema);
        res.locals.subSchemaName = subschema;

        function buildInputs(callback) {
          _private.parseSchema(req.admin.Model.schema, (err, results) => {
            if (err) {
              return callback(err);
            }
            if (subschema) {
              res.locals.inputs = results.subdocs[req.params.subschema].inputs;
              res.locals.subdocs = results.subdocs[req.params.subschema].subdocs;
            } else {
              res.locals.inputs = results.inputs;
              res.locals.subdocs = results.subdocs;
            }
            return callback();
          });
        }

        function populateRelationships(callback) {
          var relationships;

          relationships = _.pick(res.locals.inputs, (value) => {
            return value.type === 'relationship';
          });

          async.forEachOf(relationships, (rel, key, done) => {
            var Model = _private.models[rel.ref];

            if (res.locals.model === {}) {
              res.locals.model[key] = {};
              return done();
            }


            Model.findById(res.locals.model[key]).exec((err, doc) => {
              res.locals.model[key] = doc ? doc : {};

              if (Model.schema.paths[key].options.searchField) {
                re.displayField = Model.schema.paths[key].options.searchField;
              } else if (Model.schema.paths.name) {
                rel.displayField = 'name';
              } else if (Model.schema.paths.title) {
                rel.displayField = 'title';
              } else if (Model.schema.paths.label) {
                rel.displayField = 'label';
              } else {
                rel.displayField = '_id';
              }

              res.locals.inputs[key] = rel;

              return done(err);
            });
          }, callback);
        }

        if (subdoc) {
          res.locals.model = _.find(res.locals.model[req.params.subschema], (s) => {
            return s._id.toString() === subdoc;
          });
        }

        async.series([buildInputs, populateRelationships], () => {
          res.locals.active = pluralize(req.admin.Model.modelName, 2);
          res.send(_private.render('detail', res.locals));
        });

      },
      home: function(req, res) {
        res.locals.title = res.locals.appName;
        res.send(_private.render('home', res.locals));
      },
      index: function(req, res, next) {
        var isSubDoc = Boolean(req.params.subschema);

        _private.getData(req.admin.Model, {}, { populateRelationships: true }, (err, collection) => {
          if (err) {
            return next(err);
          }

          if (isSubDoc) {
            collection.data = _.pluck(_.find(collection.data, (c) => {
              return c.id.toString() === res.locals.model;
            }), req.params.subschema);
          }

          _private.parseSchema(req.admin.Model.schema, (err, results) => {
            res.locals.inputs = isSubDoc ? results.subdocs[req.params.subschema].inputs : results.inputs;
            res.locals.collection = collection.data;
            res.locals.count = isSubDoc ? collection.data.length : collection.count;
            res.locals.totalPages = isSubDoc ? Math.ceil(collection.data[req.params.subschema] / CONFIG.PAGE_LIMIT) : collection.totalPages;
            res.locals.sortOrder = isSubDoc ? false : (_private.options.customListColumns.hasOwnProperty(req.admin.Model.modelName.toLowerCase()) ? _private.options.customListColumns[req.admin.Model.modelName.toLowerCase()] : false);
            res.locals.active = pluralize(req.admin.Model.modelName, 2);
            res.locals.title = isSubDoc ? pluralize(req.params.subschema, 2) : pluralize(req.admin.Model.modelName, 2);

            res.send(_private.render('list', res.locals));
          });
        });
      },
      remove: function(req, res, next) {
        var model = res.locals.model;
        var subdoc = req.params.subdoc || false;

        if (subdoc) {
          model[req.params.subschema].pull({ _id: req.params.subdoc });
          return model.save((err) => {
            if (err) {
              return next(err);
            }

            res.json({ success: true });
          });
        }

        model.remove((err) => {
          if (err) {
            return next(err);
          }
          res.json({ success: true });
        });
      },
      search: function(req, res, next) {
        var query = {};
        var opts;
        var limit = parseInt(req.query.limit, 10) || 25;
        var page = parseInt(req.query.page, 10) || 1;

        opts = {
          populateRelationships: req.query.populateRelationships || false,
          page: page,
          skip: (page * limit) - limit,
          limit: limit,
          sortBy: (req.query.sortBy || 'createdAt'),
          sortDir: (req.query.sortDir || -1)
        };

        if (req.query) {
          _.each(req.query, (value, key) => {
            var regex;

            if (Object.keys(opts).indexOf(key) >= 0) {
              return;
            }

            if (key === '_id') {
              query[key] = value;
              return;
            }

            regex = new RegExp(value, 'i');
            query[key] = { $in: [ regex ]};
          });
        }

        return _private.getData(req.admin.Model, query, opts, (err, collection) => {
          if (err) {
            return next(err);
          }

          return res.json(collection);
        });
      },
      update: function(req, res, next) {
        var data = req.body;
        var subdoc = req.params.subdoc || false;
        var subschema = req.params.subschema || false;
        var model;

        if (subdoc) {
          model = _.find(res.locals.model[req.params.subschema], (_doc) => {
            return _doc._id.toString() === req.params.subdoc;
          });
        } else {
          model = res.locals.model;
        }

        if (!data) {
          return _private.routes.detail(req, res, next);
        }

        async.forEachOf(data, (value, key, done) => {
          model[key] = value;
          return done();
        }, () => {
          res.locals.model.save((err, doc) => {
            if (err) {
              if (err.name === 'ValidationError') {
                return res.status(403).json({ error: err.message, details: _.pluck(err.errors, 'message'), success: false });
              }
              return next(err);
            }

            res.json(doc);
          });
        });
      }
    },
    getData: function(Model, query, options, done) {
      var baseQuery;
      var countQuery;
      var countResult;
      var asyncOp = [];

      var populateRelationships = (callback) => {
        var populations = [];
        async.forEachOf(Model.schema.paths, (path, name, cb) => {
          if (typeof path.options.type.schemaName === 'undefined' || path.options.type.schemaName !== 'ObjectId' || path.options.hasOwnProperty('ref') === false) {
            return cb();
          }

          populations.push(name);
          return cb();
        }, () => {
          baseQuery = baseQuery.populate(populations);
          callback();
        });
      };

      var applyCount = (callback) => {
        countQuery.exec((err, count) => {
          countResult = count;
          return callback(err);
        });
      };

      var applyLimit  = (callback) => {
        baseQuery.limit(options.limit);
        callback();
      };

      var applySort = (callback) => {
        var sortee = {};
        sortee[options.sortBy] = options.sortDir && typeof options.sortDir === 'string' && options.sortDir.toLowerCase() === 'asc' ? 1 : -1;
        baseQuery.sort(sortee);
        callback();
      };

      var applySkip = (callback) => {
        console.log(options.skip);
        baseQuery.skip(options.skip);
        callback();
      };

      if (typeof query === 'function' && typeof options === 'undefined') {
        done = query;
        query = {};
        options = {};
      } else if (typeof options === 'function' && typeof done === 'undefined') {
        done = options;
        options = {};
      }

      _.defaults(options, {
        populateRelationships: false,
        skip: 0,
        limit: CONFIG.PAGE_LIMIT,
        sortBy: 'createdAt',
        sortDir: -1
      });

      baseQuery = Model.find(query);
      countQuery = Model.count(query);

      if (options.populateRelationships) {
        asyncOp.push(populateRelationships);
      }

      if (options.limit && typeof options.limit === 'number') {
        asyncOp.push(applyLimit);
      }

      if (options.sortBy) {
        asyncOp.push(applySort);
      }

      if (options.skip && typeof options.skip === 'number') {
        asyncOp.push(applySkip);
      }

      asyncOp.push(applyCount);

      async.series(asyncOp, () => {
        baseQuery.exec((err, results) => {
          var collection;
          if (err) {
            return done(err);
          }

          collection = _.map(results, (result) => {
            return  _.mapObject(_.pick(result, function(value, key) {
              return _private.options.customListColumns.hasOwnProperty(Model.modelName.toLowerCase()) ? _private.options.customListColumns[Model.modelName.toLowerCase()].indexOf(key) >= 0 : (key.charAt(0) !== '_' && key.charAt(0) !== '$' && typeof value !== 'function' && _private.options.pathBlacklist.indexOf(key) === -1);
            }), (value) => {
              if (_.isDate(value)) {
                return moment(value).calendar();
              }
              return value;
            });
          });
          return done(null, { data: collection, count: countResult, totalPages: Math.ceil(countResult / (options.limit || 1))  });
        });
      });
    },
    getDoc: function(req, res, next, id) {
      req.admin.Model.findById(id).exec((err, result) => {
        if (err) {
          return next(err);
        }

        res.locals.model = result;

        if (req.params.subschema) {
          res.locals.parentId = res.locals.model._id.toString();
        }

        return next();
      });
    },
    getModel: function(req, res, next, id) {
      req.admin.Model = _private.models[pluralize(id.toLowerCase(), 1)];
      res.locals.title = req.admin.Model.modelName;
      return next();
    },
    getModelsList: function(callback) {
      var modelNames = [];

      if (typeof callback === 'undefined' || typeof callback !== 'function') {
        callback = ()=>{};
      }

      if ((Array.isArray(this.options.models) && this.options.models.length > 0) || (Object.keys(this.options.models).length > 0)) {
        _.each(this.options.models, function(model, key) {
          _private.models[pluralize(key.toLowerCase(), 1)] = model;
          modelNames.push(model.schema.modelName);
        });
        return callback(null, modelNames);
      }

      fs.readdir(this.options.modelsPath, (err, files) => {
        if (err) {
          return callback(err);
        }

        async.each(files, (file, done) => {
          var model;

          if (path.extname(file) !== '.js') {
            return done();
          }

          if (mongoose.models[path.basename(file, '.js')]) {
            model = mongoose.model(path.basename(file, '.js'));
          } else {
            model = require(path.join(this.options.modelsPath, file));
          }

          _private.models[model.modelName.toLowerCase()] = model;
          modelNames.push(model.schema.modelName);
          return done();
        }, (err) => {
          return callback(err, modelNames);
        });
      });
    },
    render: function(view, locals) {
      return jade.renderFile(path.join(this.options.viewsPath, view + '.jade'), locals);
    },
    setLocals: function(req, res, next) {
      res.locals._ = {
        _: _,
        moment: moment,
        pluralize: pluralize,
        toCamelCase: helper.toCamelCase,
        toProperCase: helper.toProperCase
      };
      res.locals.logoutLink = _private.options.logoutLink;
      res.locals.active = undefined;
      res.locals.appName  = _private.options.appName + ' Admin';
      res.locals.models = _.pluck(_private.models, 'modelName');
      res.locals.loggedInUser = req.user ? _.omit(req.user, ['password']) : undefined;
      res.locals.baseUrl = req.baseUrl;
      res.locals.messages = [];
      req.admin = {};
      return next();
    }
  };

  var Administrate = function(options) {
    var router = express.Router();
    var defaults = {
      modelsPath: CONFIG.MODELS_PATH,
      viewsPath:  CONFIG.VIEWS_PATH,
      models: {},
      pathBlacklist: CONFIG.PATH_BLACKLIST,
      appName: 'Adminstrate',
      logoutLink: undefined,
      customListColumns: {},
      authMiddlewareFn: (req, res, next) => {
        return next();
      }
    };

    if (options.pathBlacklist) {
      options.pathBlacklist = options.pathBlacklist.concat(defaults.pathBlacklist);
    }

    _.defaults(options, defaults);

    this.router = router;
    this.options = options;

    return _private.bindRoutes(router, this);

  };
  Administrate.prototype = Object.create(null);
  Administrate.prototype.constructor = Administrate;

  Administrate.prototype.getRouter = function() {
    return this.router;
  };

  Administrate.prototype.getOptions = function() {
    return this.options;
  };

  return Administrate;
}());

module.exports = function(options) {
  return new Administrate(options);
};
