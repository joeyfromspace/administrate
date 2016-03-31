/* jshint browser:true */
/* global ADMIN_LOCALS:true */
import Router     from './lib/router';
import config     from './config';

import ListController       from './controllers/list';
import WebFontController    from './controllers/webfont';

// Routes
const router = new Router();
const baseUrl = ADMIN_LOCALS.baseUrl;

router.add('*', WebFontController, config.webFonts);
router.add(baseUrl + '/:model', ListController);

router.resolve();
