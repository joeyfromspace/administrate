/* Config file for admin generator */

module.exports = {
  VIEWS_PATH:       __dirname + '/../templates',
  MODELS_PATH:      process.cwd() + '/app/models',
  TEMPLATE_LANG:    'jade',
  PATH_BLACKLIST:   ['__v', 'isNew', 'errors', 'db', 'discriminators', 'schema', 'collection'],
  PAGE_LIMIT: 25
};
