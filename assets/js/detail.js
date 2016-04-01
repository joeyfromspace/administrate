(function() {
  'use strict';
  const ALERT_TIMEOUT = 5000;
  const UPDATE_COOLDOWN = 5000;
  const IS_SUB_SCHEMA = ADMIN_LOCALS.isSubSchema;
  const SUB_SCHEMA_NAME = ADMIN_LOCALS.subSchemaName;
  const PARENT_ID = ADMIN_LOCALS.parentId || false;
  const DEFAULT_REQUEST_PATH = ADMIN_LOCALS.baseUrl + '/' + ADMIN_LOCALS.modelNamePlural + (IS_SUB_SCHEMA ? '/' + PARENT_ID + '/' + SUB_SCHEMA_NAME : '');

  const alertMessage = function(messages, type) {
    let element = document.createElement('div');

    if (!Array.isArray(messages)) {
      messages = [messages];
    }

    if (!type) {
      type = 'danger';
    }

    element.classList.add('alert', 'alert-' + type);
    element.style.position = 'absolute';

    element.style.top = '70px';
    element.style.left = '50%';
    element.style.width = '50%';
    element.style.transform = 'translateX(-50%)';
    element.innerText = '';

    messages.forEach(function(message) {
      element.innerHTML += '<p>' + message + '</p>';
    });

    document.body.appendChild(element);

    setTimeout(function() {
      element.remove();
    }, ALERT_TIMEOUT);
  };
  let buttons;
  let inputs;
  let selectizes;
  let datepickers;
  let controller = {
    flags: {
      busy: false
    },
    model: ADMIN_LOCALS.model,
    isBusy: () => {
      return Boolean(controller.flags.busy);
    },
    setBusy: (val) => {
      controller.flags.busy = Boolean(val);
      controller.toggleButtons(!Boolean(val));
    },
    syncWithServer: (method) => {
      let xhr, requestPath, data;
      const handlers = {
        load: (e) => {
          let response = JSON.parse(e.currentTarget.responseText);
          if (response.error) {
            return alertMessage(response.details ? [response.error].concat(response.details) : [response.error]);
          }
          if (method === 'DELETE') {
            return location.assign(IS_SUB_SCHEMA ? '/' + ADMIN_LOCALS.baseUrl + '/' + ADMIN_LOCALS.modelNamePlural + '/' + PARENT_ID : DEFAULT_REQUEST_PATH);
          }
          if (method === 'POST') {
            return location.assign(DEFAULT_REQUEST_PATH + '/' + response._id);
          }

          controller.model = response.data;
        },
        error: (e) => {
          let response = JSON.parse(e.currentTarget.responseText);
          console.error(response);
        },
        abort: (e) => {
          let response = JSON.parse(e.currentTarget.responseText);
          console.info(response);
        },
        loadend: () => {
          Object.keys(handlers).forEach((handler) => {
            xhr.removeEventListener(handler, handlers[handler]);
          });
          controller.setBusy(false);
        }
      };
      if (controller.isBusy()) {
        return;
      }
      controller.setBusy(true);
      xhr = new XMLHttpRequest();
      method = method.toUpperCase();
      requestPath = (method === 'POST' ? DEFAULT_REQUEST_PATH : DEFAULT_REQUEST_PATH + (controller.model && controller.model._id ? '/' + controller.model._id : ''));

      Object.keys(handlers).forEach((handler) => {
        xhr.addEventListener(handler, handlers[handler]);
      });
      xhr.open(method, requestPath);

      if (method === 'POST' || method === 'PUT') {
        xhr.setRequestHeader('Content-Type', 'application/json');
        data = JSON.stringify(controller.model);
      }

      xhr.send(data);
    },
    toggleButtons: (isEnable) => {
      Array.prototype.forEach.call(buttons, (button) => {
        if (isEnable) {
          button.disabled = false;
          button.classList.remove('disabled');
        } else {
          button.disabled = true;
          button.classList.add('disabled');
        }
      });
    },
    updateModel: (prop, value) => {
      const findProp = function(model, props) {
        let currentProp = props.shift();
        if (!props.length) {
          model[currentProp] = value;
          return;
        }

        if (typeof model[currentProp] === 'undefined') {
          model[currentProp] = {};
        }

        return findProp(model[currentProp], props);
      };

      if (prop.indexOf('.') >= 0) {
        findProp(controller.model, prop.split('.'));
      } else {
        controller.model[prop] = value;
      }
    }
  };
  const actions = {
    new: () => {
      controller.syncWithServer('post');
    },
    update: () => {

      controller.syncWithServer('put');

    },
    remove: () => {
      let modal = new ADMIN_LOCALS.templates.Modal({ title: 'Delete item?', message: 'Are you sure you want to delete this item?'});
      modal.render();
      modal.on('modal-ok', () => {
        controller.syncWithServer('delete');
      });
      modal.on('modal-close', () => {
        modal.dismiss();
      });
    }
  };
  const events = {
    remove: () => {
      actions.remove();
    },
    save: (e) => {
      if(!controller.model._id) {
        return actions.new(e);
      }
      return actions.update(e);
    },
    update: (e) => {
      let value;
      let t = e.currentTarget;
      let tag = t.tagName.toLowerCase();
      let type = t.type.toLowerCase();
      switch (tag) {
       case 'input':
         if (type === 'checkbox') {
           value = t.checked;
         } else if (type === 'radio') {
           value = t.selected;
         } else {
          value = t.value;
         }
         break;

       case 'textarea':
         value = t.value;
         break;

       case 'select':
         value = t.options[t.selectedIndex].value;
         break;

       default:
         break;
      }

      controller.updateModel(t.name, value);
    }
  };
  document.addEventListener('DOMContentLoaded', () => {
     buttons = document.querySelectorAll('button,a');
     inputs = document.querySelectorAll('input,select,textarea');
     Array.prototype.forEach.call(buttons, (button) => {
       button.addEventListener('click', (e) => {
         if (controller.isBusy()) {
           e.preventDefault();
           return;
         }
         if (Object.keys(events).indexOf(e.currentTarget.name) >= 0) {
           e.preventDefault();
           return events[e.currentTarget.name](e);
         }
       });
     });
     Array.prototype.forEach.call(inputs, (input) => {
       if (input.dataset.provide === 'datepicker') {
         return;
       }
       input.addEventListener('change', (e) => {
         e.preventDefault();
         events.update(e);
       });
       input.addEventListener('keypress', (e) => {
         _.debounce(() => {
           events.update(e);
         }, UPDATE_COOLDOWN);
       });
     });
     datepickers = document.querySelectorAll('input[data-provide="datepicker"]');
     $(datepickers).datepicker().on('hide', function(e) {
       controller.updateModel(e.target.name, new Date(e.target.value));
     });
     selectizes = adminDetailSelector('.selectbox');
     selectizes.forEach((sel) => {
       sel.on('change', (e) => {
         controller.updateModel($(e.target).attr('data-name'), e.target.value);
       });
     });
  });
})();
