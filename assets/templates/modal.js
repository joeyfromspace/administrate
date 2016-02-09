(function() {
  if (!window.ADMIN_LOCALS.templates) {
    window.ADMIN_LOCALS.templates = {};
  }
  window.ADMIN_LOCALS.templates.Modal = (function() {
    'use strict';
    const Modal = function(options) {
      const defaults = {
        title: 'Dialog',
        message: 'Example',
        dismissible: true
      };

      _.defaults(options, defaults);

      this.options = options;
      this.template = _.template('<div class="modal-fade" role="dialog"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><button class="close" type="button" data-dismiss="modal" aria-label="Close" name="modal-close"><span aria-hidden="true">&times;</span></button><h4 class="modal-title"><%= title %></h4></div><div class="modal-body"><p><%= message %></p></div><div class="modal-footer"><button type="button" class="btn btn-primary" name="modal-ok">OK</button><button class="btn btn-default" data-dismiss="modal" name="modal-close">Close</button></div></div></div></div>');
      this.handlers = {};
    };
    Modal.prototype = Object.create(null);
    Modal.prototype.constructor = Modal;

    Modal.prototype.emit = function(e) {
      if (!e) {
        return;
      }

      if(!this.handlers.hasOwnProperty(e)) {
        return;
      }

      this.handlers[e].forEach((fn) => {
        fn.call(e);
      });
    };

    Modal.prototype.on = function(event, handlerFn) {
      if (this.handlers[event]) {
        return this.handlers[event].push(handlerFn);
      }

      this.handlers[event] = [handlerFn];
    };

    Modal.prototype.dismiss = function() {
      $(this.rendered).modal('hide');
    };

    Modal.prototype.render = function() {
      this.rendered = document.createElement('div');
      document.querySelector('#modal-container').appendChild(this.rendered);
      this.rendered.innerHTML = this.template(this.options);
      this.rendered.addEventListener('click', (e) => {
        e.preventDefault();        
        this.emit(e.target.name);
      });

      $(this.rendered).modal('show');
      return this.rendered;
    };

    return Modal;
  }());
}());
