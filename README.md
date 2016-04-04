#Administrate
Connect-style middleware that dynamically generates an admin web app from Mongoose models. Compatible with Express 4.x+

##Installation
```
npm install administrate

```

##How To Use
Administrate works like any other piece of Express 4.x middleware. Usage is as simple as:
```
const administrate = require('administrate');

const options = {
    modelPath: '/app/models',
    authMiddlewareFn: passport.middleware // Whatever middleware you use on your routes to verify a request is coming from an admin user
};

app.use('/admin', administrate(options));
```

##Options
Administrate has a number of options. While none are required, you will need to set at least two as in the example above.

`string: modelsPath`: A string to the path of your mongoose models directory. All .js files in this folder will be parsed as models. *Defaults to /app/models*

`array OR object: models`: Depending on how you load models in your app, you may run into compilation errors from Mongoose. If this happens, pass your mounted models in an array or object.

`function: authMiddlewareFn`: A middleware function to use to verify requests. **IMPORTANT:** If no middleware function is provided, admin routes will be exposed to the public, allowing anyone to edit/remove/generally mess up your databse. **This is bad.** A good authentication/middleware library to use is [Passport.js](http://www.passportjs.org "Passport.js").

`string: appName`: The name of your app. Displayed in the admin site header. *Defaults to Administrate*

`object: customListColumns`: An object with keys corresponding to lowercase model names as registered in mongoose.model(). Each key is an array containing a list of schema paths to display in the admin list view. The list columns will be rendered in the order of keys. The `id` path will always be displayed and will always appear in the first column of every list.

Example:
```
const customListColumns = {
  user: ['email', 'name', 'createdAt', 'updatedAt']
};
```

`string: logoutLink`: The path to your app's logout route. If this is provided, then the admin site header will display a logout link. Example: `'/logout'`. *Defaults to `undefined`*

`[string]: pathsBlacklist`: Suppress certain paths from your schemas from appearing in the admin interface. This is useful if you have any hidden metadata paths that aren't meant to be edited by humans. By default, this filters out paths auto-generated by Mongoose. Adding your own values will be combined with the existing list.

`string: viewsPath`: A custom path to JADE templates to render for admin. This is if you want to overwrite the default templates with your own. However, keep in mind that you will need to properly populate the local variables for templates to work. Changing this value is not recommended without first studying the built-in templates in /templates.

##Schema modifiers
Administrate supports a few options that affect how Schema paths are displayed and edited in the admin. Slip these into the schema path options and they will automatically be applied in the admin.

###Filter Support
Add `filter: true` to a schema path to make it filterable in the admin view.

###Search fields
Add `searchField: [path]` to search and display values by in a `ref` path.

###Textarea Support
Add `extended: true` to your `String` schema paths to display a textarea in the admin interface instead of a single text input. Useful for editing blog posts and other larger bodies of text.

###Hidden Paths
Add `hidden: true` to any Schema path to hide it from being displayed in the admin.

###Read-only Paths
Add `edit: false` to any Schema path to have a path disabled on the front-end.

##TODO
Tests. They don't exist.

##Changelog
**04-04-2016**: In ObjectID ref paths, you may now specify a `searchField` to search by in Detail views.

**04-01-2016**: Many a bug squashed. Sub-documents now supported. Default sorting by createdAt if available in schema.

**03-31-2016**: Added filtration, improved sorting and pagination, frontend bug fixes

**03-29-2016**: Updated list view with pagination and sorting.
