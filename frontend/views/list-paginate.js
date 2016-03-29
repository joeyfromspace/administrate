import View from '../lib/view';

const paginationTemplate = require('fs').readFileSync(__dirname + '/../templates/list-pagination.hbs', 'utf8');

class ListPaginateView extends View {
  constructor(opts) {
    super(opts);

    this.viewName = 'List View Paginate';
    this.template = paginationTemplate;
    this.tag = 'nav';
  }
}

export default ListPaginateView;