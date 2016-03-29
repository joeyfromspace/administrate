import Controller from '../lib/controller';
import ListPaginateView from '../views/list-paginate';
import _ from 'lodash';

class ListPaginateController extends Controller {
  constructor(currentPage, totalPages) {
    super();

    this.paginateView = new ListPaginateView({ model: { currentPage: currentPage, totalPages: totalPages, pages: _.range(1, totalPages)} });

    this.paginateView.on('render', () => {
      this.emit('paginateViewUpdate', this.paginateView.element);

      this.paginateView.on('click', (e) => {
        let t = e.currentTarget;
        let page;
        e.preventDefault();

        if (t.tagName !== 'a' || (t.parentElement && t.parentElement.classList.contains('disabled'))) {
          return;
        }

        page = _.isNaN(parseInt(t.innerText, 10)) ? (t.previousSibling ? this.paginateView.model.currentPage + 1 : this.paginateView.model.currentPage - 1) : parseInt(t.innerText, 10);

        this.setPage(page);
        this.emit('pageChange', page);
      });
    });
  }

  load() {
    this.paginateView.render();
  }

  setPage(page) {
    this.paginateView.model.currentPage = page;
    this.paginateView.render();
  }

  setTotalPages(total) {
    this.paginateView.model.totalPages = total;
    this.paginateView.model.pages = _.range(1, total);
    this.paginateView.render();
  }

}

export default ListPaginateController;