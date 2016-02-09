(function() {
  'use strict';
  const DEFAULT_REQUEST_PATH = ADMIN_LOCALS.baseUrl + '/' + ADMIN_LOCALS.modelNamePlural;
  const UPDATE_COOLDOWN = 5000;
  let buttons;
  let inputs;
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
          console.log(response);
          if (method === 'DELETE') {
            return location.assign(DEFAULT_REQUEST_PATH);
          }
          if (method === 'POST') {
            return location.assign(DEFAULT_REQUEST_PATH + '/' + response._id);
          }

          controller.model = response;
        },
        error: (e) => {
          let response = JSON.parse(e.currentTarget.responseText);
          console.log('error');
          console.error(response);
        },
        abort: (e) => {
          let response = JSON.parse(e.currentTarget.responseText);
          console.log('abort');
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
      requestPath = (method === 'POST' ? DEFAULT_REQUEST_PATH : DEFAULT_REQUEST_PATH + '/' + controller.model._id);

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
      controller.model[prop] = value;
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
      let type = t.tagName.toLowerCase();
      switch (tag) {
       case 'input':
         if (type === 'checkbox' || type === 'radio') {
           value = t.selected;
         }
         value = t.value;
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
  });
})();
