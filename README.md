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

app.use('\admin', administrate(options));
```

##Options
Administrate has a number of options. While none are required, you will need to set at least two as in the example above.

`string: modelsPath`: A string to the path of your mongoose models directory. All .js files in this folder will be parsed as models. *Defaults to /app/models*

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