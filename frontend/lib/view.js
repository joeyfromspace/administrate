import EventEmitter   from './events';
import _							from 'lodash';
import handlebars			from 'handlebars';
import helpers        from './view-helpers';
import $							from 'jquery';

class View extends EventEmitter {
  constructor(opts) {
    let defaults = {
      tag: 'div',
      className: null,
      viewName: 'view' + Math.floor(Math.random() * (99999 - 10000) + 10000),
      model: {}
    };
    super();

    if (typeof opts !== 'object') {
      opts = {};
    }

    _.defaults(opts, defaults);

    if (opts.template) {
      this.template = opts.template;
    }

    this._ = {
      element: null,
      isRendered: false
    };

    this.className = opts.className;
    this.viewName = opts.viewName;
    this.tag = opts.tag;
    this.model = opts.model;
  }

  _interpolate() {
    let template = handlebars.compile(this.template);
    return template(this.model);
  }

  off(e, handler) {
    /* Code to  keep render listeners intact on views when the .off() method is called */
    let renderEvents;

    if (arguments.length === 0) {
      renderEvents = _.remove(this._eventRegistry, _.matches({ event: 'render' }));
    }

    super.off(e, handler);

    if (renderEvents.length > 0) {
      this._eventRegistry = renderEvents;
    }

  }

  get element() {
    return this._.element;
  }

  destroy() {
    this.isRendered = false;

    /* Emit destroy event */
    this.emit('destroy', this);

    /* Disconnect event listeners */
    this.off();

    /* $ removeData for velocity compatibility */
    $(this.element).removeData();

    /* Remove element from DOM */
    this.element.remove();
    this._.element = undefined;
  }

  get isRendered() {
    return this._.isRendered;
  }

  set isRendered(value) {
    value = Boolean(value);

    this._.isRendered = value;
  }

  get parentElement() {
    return this._.parentElement;
  }

  render() {
    let compiledTemplate = handlebars.compile(this.template);
    let content = compiledTemplate(this.model);
    let element, registryCopy;

    /* Copy event registry prior to replacing DOM view */
    if (this.isRendered) {
      registryCopy = _.filter(this._eventRegistry, !_.matches({ event: 'render' }));
      this.off();
    }

    if (!this.isRendered || !this.element) {
      element = document.createElement(this.tag);
      element.id = _.uniqueId(this.viewName.toLowerCase().replace(' ', '-') + '-');

      if (this.className) {
        element.classList.add(this.className);
      }

    } else {
      element = this._.element;
    }

    element.innerHTML = content;

    this._.element = element;
    this.isRendered = true;
    this.emit('render', this);

    if (registryCopy && registryCopy.length) {
      _.forEach(registryCopy, (event) => {
        this.on(event);
      });
    }

    return element;
  }
}

export default View;
