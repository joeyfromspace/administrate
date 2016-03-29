import handlebars from 'handlebars';

export default (function() {
  handlebars.registerHelper('ifeq', function(a, b, options) {
    return a === b ? options.fn(this) : options.inverse(this);
  });
}());