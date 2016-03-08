// Wrapper for Google WebFont Loader to eliminate nasty text flashing
import Controller from '../lib/Controller';
import velocity   from 'velocity-animate';
import WebFont    from 'webfontloader';

class WebFontController extends Controller {
  constructor(webFonts) {
    super();

    if (typeof webFonts === 'string') {
      webFonts = [webFonts];
    }

    this.webFonts = webFonts;
  }

  load() {
    WebFont.load({
      google: {
        families: this.webFonts
      },
      inactive: this.showDocument,
      active: this.showDocument
    });
  }

  showDocument() {
    const body = document.body;
    body.style.opacity = 0;

    velocity(body, { opacity: [1,0] }, { duration: 300 });
  }
}

export default WebFontController;
