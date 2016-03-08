import EventEmitter from './events';

class Controller extends EventEmitter {
  constructor(args) {
    if (!Array.isArray(args)) {
      args = [args];
    }

    super(args[0]);

    if (this.element) {
      this.computedStyle  = window.getComputedStyle(this.element);
    }
  }

  load() {
    console.log('Super Controller');
  }
}

export default Controller;
