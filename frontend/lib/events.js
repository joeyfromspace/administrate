import _ 			from 'lodash';

class EventEmitter {
  constructor(element) {
    if (element) {
      if (typeof element === 'string') {
        element = document.querySelector(element);
      }
      this.element = element;
    }
    this._eventRegistry = [];
  }

  _pull(event) {
    if (this.element) {
      this.element.removeEventListener(event.event, event.boundFn);
    }
    _.pull(this._eventRegistry, event);
  }

  on(e, handler, context, once) {
    let event;
    let _remHandler = function() {
      this.element.removeEventListener(event.event, _remHandler);
      this._pull(event);
    }.bind(this);

    if (typeof context === 'boolean') {
      once = context;
      context = undefined;
    }

    if (typeof once === 'undefined') {
      once = false;
    }

    event = { event: e, fn: handler, context: context, once: once, boundFn: handler.bind(context) };

    if (this.element) {
      this.element.addEventListener(event.event, event.boundFn);

      if (event.once) {
        this.element.addEventListener(event.event, _remHandler);
      }
    }

    this._eventRegistry.push(event);
  }

  once(e, handler, context) {
    this.on(e, handler, context, true);
  }

  off(e, handler) {
    let removeItems;

    if (arguments.length === 0) {
      return _.forEach(this._eventRegistry, this._pull.bind(this));
    }

    if (!handler) {
      removeItems = _.filter(this._eventRegistry, _.matches({event: e }));
    } else {
      removeItems = _.filter(this._eventRegistry, _.matches({event: e, fn: handler}));
    }

    _.forEach(removeItems, this._pull.bind(this));
  }

  emit(e, args) {
    let events = _.filter(this._eventRegistry, (event) => {
      return event.event === e;
    });

    _.forEach(events, (event) => {
      event.fn.call(event.context, args);
      if (event.once) {
        this._pull(event);
      }
    });
  }
}

export default EventEmitter;
