'use strict';

/**
 * Generic Admin Interface
 * For Express 4.x and MongoDB/Mongoose Apps
 *
 * Setup as middleware in your express application.
 * Example: app.use('/admin', require('administrator'));
 */

 /* Begin Dependencies */
 const CONFIG     =     require('./lib/config');
 const helper     =     require('./lib/helper');
 const pluralize  =     require('pluralize');
 const _          =     require('underscore');
 const async      =     require('async');
 const express    =     require('express');
 const jade       =     require('jade');
 const path       =     require('path');
 const fs         =     require('fs');
 const moment     =     require('moment');
 const mongoose   =     require('mongoose');
 /* End Dependencies */

const Administrate  = (function() {

    const _private  = {
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
          router.get('/:model/:id', _private.routes.detail);
          router.post('/:model', _private.routes.create);
          router.put('/:model/:id', _private.routes.update);
          router.delete('/:model/:id', _private.routes.remove);
          router.all(_private.routes.errors);

          _private.getModelsList();
          return router;
        },
        parseSchema: function(schema, callback) {
          let inputs = {};
          async.forEachOf(schema.paths, (path, name, done) => {
            let type, ref;

            if (path.options.hidden || _private.options.pathBlacklist.indexOf(name) >= 0) {
              return done();
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

            inputs[name] = { type: type, label: name,  name: name, edit:  path.options.edit && path.options.edit === false ? false : true };

            if (ref) {
              inputs[name].ref = ref;
            }
            done();
          }, (err) => {
            if (err) {
              return callback(err);
            }

            return callback(null, inputs);
          });
        },
        routes: {
          create: function(req, res, next) {
            let data = req.body;

            if (!data) {
              return next('Empty request');
            }

            let model = new req.admin.Model(data);
            model.save((err, doc) => {
              if (err) {
                return next(err);
              }

              res.json(doc);
            });
          },
          detail: function(req, res) {
            res.locals.inputs = {};
            function buildInputs(callback) {
              _private.parseSchema(req.admin.Model.schema, (err, inputs) => {
                if (err) {
                  return callback(err);
                }
                res.locals.inputs = inputs;
                return callback();
              });
            }

            function populateRelationships(callback) {
              let relationships;

              relationships = _.pick(res.locals.inputs, (value) => {
                return value.type === 'relationship';
              });

              async.forEachOf(relationships, (rel, key, done) => {
                let Model = _private.models[rel.ref];

                if (res.locals.model === {}) {
                  res.locals.model[key] = {};
                  return done();
                }


                Model.findById(res.locals.model[key]).exec((err, doc) => {
                  res.locals.model[key] = doc ? doc : {};

                  if (Model.schema.paths.name) {
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

            async.series([buildInputs, populateRelationships], () => {
              res.locals.active = pluralize(req.admin.Model.modelName, 2);
              res.send(_private.render('detail', res.locals));
            });

          },
          errors: function(err, req, res) {
            res.locals.messages.push({ type: 'error', message: (typeof err === 'object' ? err.message : err) });
            res.send(_private.render('errors', res.locals));
          },
          home: function(req, res) {
            res.locals.title = res.locals.appName;
            res.send(_private.render('home', res.locals));
          },
          index: function(req, res, next) {
            _private.getData(req.admin.Model, {}, { populateRelationships: true }, (err, collection) => {
              if (err) {
                return next(err);
              }

              _private.parseSchema(req.admin.Model.schema, (err, inputs) => {
                res.locals.inputs = inputs;
                res.locals.collection = collection;
                res.locals.sortOrder = _private.options.customListColumns.hasOwnProperty(req.admin.Model.modelName.toLowerCase()) ? _private.options.customListColumns[req.admin.Model.modelName.toLowerCase()] : false;
                res.locals.active = pluralize(req.admin.Model.modelName, 2);
                res.locals.title = pluralize(req.admin.Model.modelName);

                res.send(_private.render('list', res.locals));
              });
            });
          },
          remove: function(req, res, next) {
            let model = res.locals.model;
            model.remove((err) => {
              if (err) {
                return next(err);
              }
              res.json({ success: true });
            });
          },
          update: function(req, res, next) {
            let data = req.body;
            let model = res.locals.model;

            if (!data) {
              return _private.routes.detail(req, res, next);
            }

            async.forEachOf(data, (value, key, done) => {
              model[key] = value;
              return done();
            }, () => {
              model.save((err, doc) => {
                if (err) {
                  return next(err);
                }

                res.json(doc);
              });
            });
          }
        },
        getData: function(Model, query, options, done) {
          let baseQuery;
          let asyncOp = [];

          const populateRelationships = (callback) => {
            let populations = [];
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

          const applyLimit  = (callback) => {
            baseQuery.limit(options.limit);
            callback();
          };

          const applySort = (callback) => {
            baseQuery.sort(options.sort);
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
            limit: undefined,
            sort: undefined
          });

          baseQuery = Model.find(query);

          if (options.populateRelationships) {
            asyncOp.push(populateRelationships);
          }

          if (options.limit && typeof options.limit === 'number') {
            asyncOp.push(applyLimit);
          }

          if (options.sort && (typeof options.sort === 'string' || typeof options.sort === 'object')) {
            asyncOp.push(applySort);
          }

          async.series(asyncOp, () => {
            baseQuery.exec((err, results) => {
              let collection;
              if (err) {
                return done(err);
              }

              collection =_.map(results, (result) => {
                return  _.mapObject(_.pick(result, function(value, key) {
                  return _private.options.customListColumns.hasOwnProperty(Model.modelName.toLowerCase()) ? _private.options.customListColumns[Model.modelName.toLowerCase()].indexOf(key) >= 0 : (key.charAt(0) !== '_' && key.charAt(0) !== '$' && typeof value !== 'function' && _private.options.pathBlacklist.indexOf(key) === -1);
                }), (value) => {
                  if (_.isDate(value)) {
                    return moment(value).calendar();
                  }
                  return value;
                });
              });
              return done(null, collection);
            });
          });
        },
        getDoc: function(req, res, next, id) {
          let query = {};
          if (!id || id === 'new') {
            res.locals.model = {};
            return next();
          }
          if (id === 'search') {
            if (req.query) {
              _.each(req.query, (value, key) => {
                let regex = new RegExp(value, 'i');
                query[key] = { $in: [ regex ]};
              });
            }
            return _private.getData(req.admin.Model, query, (err, collection) => {
              if (err) {
                return next(err);
              }

              return res.json(collection);
            });
          }
          req.admin.Model.findById(id).exec((err, result) => {
            if (err) {
              return next(err);
            }

            res.locals.model = result;
            return next();
          });
        },
        getModel: function(req, res, next, id) {
          req.admin.Model = _private.models[pluralize(id.toLowerCase(), 1)];
          res.locals.title = req.admin.Model.modelName;
          return next();
        },
        getModelsList: function(callback) {
          let modelNames = [];

          if (typeof callback === 'undefined' || typeof callback !== 'function') {
            callback = ()=>{};
          }

          if ((Array.isArray(this.options.models) && this.options.models.length > 0) || (Object.keys(this.options.models).length > 0)) {
            _.each(this.options.models, function(model, key) {
              _private.models[key.toLowerCase()] = model;
              modelNames.push(model.schema.modelName);
            });
            return callback(null, modelNames);
          }

          fs.readdir(this.options.modelsPath, (err, files) => {
            if (err) {
              return callback(err);
            }

            async.each(files, (file, done) => {
              let model;

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

    const Administrate = function(options) {
      const router = express.Router();
      const defaults = {
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
