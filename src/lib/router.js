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

    let routes = _.filter(this.routes, (r) => {
      return r.path === location || r.path === '*';
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
