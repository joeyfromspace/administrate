class Route {
  constructor(path, Controller, args) {
    if (typeof path === 'object') {
      Controller  = path.controller;
      path        = path.path;
      args        = path.args;
    }

    this.path         = path;
    this.Controller   = Controller;
    this.args         = args;
  }

  load() {
    if (this.instance) {
      return this.instance.load();
    }

    this.instance = new this.Controller(this.args);
    this.instance.load();
  }
}

export default Route;
