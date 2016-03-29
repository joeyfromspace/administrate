import EventEmitter from './events';

const _getElementFromSelector = (selector) => {
  return document.querySelector(selector);
};

class Controller extends EventEmitter {
  constructor(args) {
    if (!Array.isArray(args)) {
      args = [args];
    }

    super(args[0]);

    if (this.element && typeof this.element === 'string') {
      this.element = _getElementFromSelector(this.element);
    }

    if (this.element) {
      this.computedStyle  = window.getComputedStyle(this.element);
    }
  }

  load() {
    console.log('Super Controller');
  }


}

export default Controller;
