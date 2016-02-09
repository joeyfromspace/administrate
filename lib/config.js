/* Config file for admin generator */

const path    =   require('path');

module.exports = {
  VIEWS_PATH:       path.join(__dirname, '..', 'templates'),
  ROUTES_PATH:      path.join(__dirname, '..', '..', 'app', 'routes', 'admin'),
  MODELS_PATH:      path.join(__dirname, '..', '..', 'app', 'models'),
  TEMPLATE_LANG:    'jade', // Accepts html or jade
  PATH_BLACKLIST:   ['__v', 'isNew', 'errors', 'db', 'discriminators', 'schema', 'collection']
};
