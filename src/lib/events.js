import _ from 'underscore';

const BROWSER_EVENTS = ['click', 'mouseenter', 'mouseleave', 'change', 'load'];

class EventEmitter {
  constructor(element) {
    this.element  = element;
    this.registry = {};
  }

  on(e, handler) {
    if (!this.registry[e]) {
      this.registry[e] = [];
    }

    if (this.element && BROWSER_EVENTS.indexOf(e) >= 0) {
      this.element.addEventListener(e, handler);
    }

    this.registry[e].push(handler);
  }

  off(e, handler) {
    let index = this.registry[e].indexOf(handler);

    if (index === -1) {
      return;
    }

    if (this.element && BROWSER_EVENTS.indexOf(e) >= 0) {
      this.element.removeEventListener(e, handler);
    }

    this.registry[e].splice(index, 1);
  }

  emit(e, details) {
    _.each(this.registry[e], (fn) => {
      fn.call(undefined, details);
    });
  }
}

export default EventEmitter;
