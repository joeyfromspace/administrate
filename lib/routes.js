'use strict';

const _       =   require('underscore');
const CONFIG  =   require('./config');
const path    =   require('path');

const VIEW_PATH = _.last(CONFIG.VIEWS_PATH.split(path.sep));

const RouterMaker = (function() {

  const RouterMaker = function(route) {
    this.outputJS = `
    \'use strict\';\n
    \* Routes for Admin Route: ' + route.modelName + '/*
    \n
    const ' + route.modelName + '   = require(\'' + route.modelPath + '\')\n
    const express = require(\'express\');\n
    const async   = require(\'async\');\n
    \n
    module.exports = function(app) {\n
      const router = express.Router();\n

      router.all(' + route.authMiddlewareFn + ')
      <%= ROUTES BLOCK %>\n
      \n
      return router;\n
    };`;
    this.route = route;
  };

  RouterMaker.prototype = Object.create(null);
  RouterMaker.prototype.constructor = RouterMaker;

  RouterMaker.prototype.paramRoute = function() {
    return `
      router.param(\'id\', (req, res, next, id) => {\n
        ' + this.route.modelName + '.findById(id).exec((err, result) => {\n
          if (err) {\n
            return next(err);\n
          }\n
          \n
          res.locals.model = result;\n
          \n
          res.render(\'' + VIEW_PATH + '/' + this.route.detailView + '\');\n
        });\n
      });\n
    `;
  };

  RouterMaker.prototype.indexRoute = function() {
    return `
    router.get(\'/\', (req, res, next) => {\n
      ' + this.route.modelName + '.find(req.query).exec((err, results) => {\n
        if (err) {\n
          return next(err)\n;\n
        }\n
        \n
        res.locals.collection = results;\n
        \n
        res.render(\'' + VIEW_PATH + '/' + this.route.listView + '\');\n
      });\n
    });\n
    `;
  };

  RouterMaker.prototype.createRoute = function() {
    return `
    router.post(\'/\', (req, res, next) => {\n
      let model = new ' + this.route.modelName + '(req.body);\n
      model.save((err, doc) => {\n
        if (err) {\n
          res.locals.error = err;\n
          return res.status(403).render(\'' + VIEW_PATH + '/' + this.route.listView + '\');\n
        }\n
        \n
        res.redirect(req.baseUrl + \'/\' + doc._id.toString());\n
      });\n
    });
    `;
  };

  RouterMaker.prototype.updateRoute = function() {
    return `
      router.put(\'/:id\', (req, res, next) => {\n
        let data = req.body;
        let model = req.params.id;
        \n
        async.forEachOf(data, (value, key, done) => {\n
          model[key] = value;\n
          return done();\n
        }, () => {\n
          model.save((err, doc) => {\n
            if (err) {\n
              res.locals.error = err;\n
              res.locals.model = req.param.id;
              res.status(403).render(\'' + VIEW_PATH + '/' + this.route.detailView + '\');\n
            }

            res.locals.message = \'Save successful\';
            res.locals.model = doc;
            res.render(\'' + VIEW_PATH + '/' + this.route.detailView + '\');\n
          });\n
        });\n
      });
    `;
  };

  RouterMaker.prototype.removeRoute = function() {
    return `
      router.delete(\'/:id\', (req, res, next) => {\n
        let model = req.params.id;
        model.remove().then(() => {
          ' + this.route.modelName + '.find().exec((err, results) => {
            let newUrl = req.baseUrl.split(\'/\');\n
            newUrl.pop();\n
            newUrl.join(\'/\');\n
            res.locals.success = \'Model deleted successfully\';\n
            res.locals.collection = results;\n
            res.location(newUrl);\n
            res.render(\'' + VIEW_PATH + '/' + this.route.listView + '\');\n
          });\n
        }).catch(next);\n
      });
    `;
  };

  RouterMaker.prototype.detailRoute = function() {
    return `
    router.get(\'/:id\', (req, res, next) {\n
      res.locals.model = req.params.id;\n
      res.render(\'' + VIEW_PATH + '/\'' + this.route.detailView + '\');\n
    });
    `;
  };

  RouterMaker.prototype.writeRoute = function(route, index, array) {
    if (index !== (array.length - 1)) {
      route += '\n<%= ROUTES BLOCK %>';
    }

    this.outputJS.replace('<%= ROUTES BLOCK %>', route);
  };

  RouterMaker.prototype.generate = function() {
    let routes = [this.paramRoute(), this.indexRoute(), this.detailRoute(), this.createRoute(), this.updateRoute(), this.removeRoute()];

    routes.forEach(this.writeRoute);
    return this.outputJS;
  };

  return RouterMaker;
}());

module.exports = function(route) {
  return (new RouterMaker(route)).generate();
};
