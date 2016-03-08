/**
 * Example Controller
 */
import Controller from '../lib/controller';

class ExampleController extends Controller {
  constructor() {
    super();
  }

  load() {
    console.log('Hello world!');
  }
}

export default ExampleController;
