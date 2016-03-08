/**
 * SWARM Website 2016
 * Main App Controller
 */
import Router     from './lib/router';
import config     from './config';

import ExampleController    from './controllers/example';
import WebFontController    from './controllers/webfont';

// Routes
const router = new Router();
router.add('*', WebFontController, config.webFonts);
router.add('/', ExampleController);

router.resolve();
