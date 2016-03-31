import Controller from '../lib/controller';
import ListPaginateView from '../views/list-paginate';
import _ from 'lodash';

class ListPaginateController extends Controller {
  constructor(currentPage, totalPages) {
    super();

    this.paginateView = new ListPaginateView({ model: { currentPage: currentPage, totalPages: totalPages, pages: totalPages === 1 ? [1] : _.range(1, totalPages + 1)} });

    this.paginateView.once('render', () => {
      this.emit('paginateViewUpdate', this.paginateView.element);

      this.paginateView.on('click', (e) => {
        let t = e.target;
        let page;
        e.preventDefault();

        if (t.tagName.toLowerCase() !== 'a' || (t.parentElement && t.parentElement.classList.contains('disabled'))) {
          return;
        }

        page = t.dataset.page === 'prev' ? (this.paginateView.model.currentPage - 1) : (t.dataset.page === 'next' ? (this.paginateView.model.currentPage + 1) : parseInt(t.dataset.page, 10));
        if (page < 1) {
          page = 1;
        }

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
    this.paginateView.model.pages = total === 1 ? [1] : _.range(1, total + 1);
    this.paginateView.render();
  }

}

export default ListPaginateController;