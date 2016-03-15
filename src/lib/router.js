import _        from 'underscore';
import Route    from './route';

class Router {
  constructor() {
    this.routes = [];
  }

  add(path, controller, controllerOpts) {

    if (!path || !controller) {
      throw 'Not a valid route definition';
    }

    if (Array.isArray(path)) {
      return _.each(path, (p) => {
        this._add(p, controller, controllerOpts);
      });
    }

    this._add(path, controller, controllerOpts);
  }

  _add(path, controller, controllerOpts) {
    let route;

    route = new Route(path, controller, controllerOpts);
    this.routes.push(route);
  }

  resolve() {
    let location = window.location.pathname;

    // Iterate through routes for matches to the path, removing entries with duplicate controllers
    let routes = _.uniq(_.filter(this.routes, (r) => {
      if (r.path === '*') {
        return true;
      }
      let pathArray = r.path.split('/');
      let pathQuery = _.map(pathArray, (p) => {
        if (p.charAt(0) === ':') {
          return '(?:.+)';
        }
        return p;
      });
      let regexpQuery = new RegExp(pathQuery.join('/'), 'i');

      return regexpQuery.test(location);
    }), (r) => {
      return r.Controller;
    });

    if (!routes.length) {
      return;
    }

    _.each(routes, (r) => {
      r.load();
    });
  }
}

export default Router;
