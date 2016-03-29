/**
 * List Controller
 */
import Controller from '../lib/controller';
import _          from 'underscore';
import URI        from 'urijs';
import request    from 'browser-request';
import velocity   from 'velocity-animate';
import async      from 'async';

import ListResultRowView from '../views/list-result-row';
import ListPaginateController from './list-paginate';

const JSON_API_PREFIX = window.location.pathname + '/search';
const ANIMATION_DURATION = 200;
const ANIMATION_EASING = 'linear';
const ERROR_TEXT = 'There was a problem retrieving the data';

class ListController extends Controller {
  constructor() {
    super();

    this.query = {
      page: 1,
      limit: 25,
      populateRelationships: true,
      sortBy: undefined,
      sortDir: 'asc'
    };
  }

  load() {
    this.resultsContainer = document.getElementById('results-table');
    this.tbody = this.resultsContainer.querySelector('tbody');
    this.parseUrl();
    this.listenSortClick();
    this.paginateController = new ListPaginateController(this.query.page, window.ADMIN_LOCALS.totalPages);

    this.paginateController.on('paginateViewUpdate', (element) => {
      if (!this.paginateElement) {
        this.resultsContainer.parentElement.appendChild(element);
      }

      this.paginateElement = element;
    });

    this.paginateController.on('pageChange', (page) => {
      this.query.page = page;
      this.applySort();
    });

    this.paginateController.load();
  }


  _req(req, callback) {
    let query = _.pairs(req);
    query = _.map(query, (q) => {
      return q.join('=');
    }).join('&');

    request.get({ url: JSON_API_PREFIX + '?' + query, json: true }, callback);
  }

  _destroyData() {
    let rows = this.resultsContainer.querySelectorAll('tbody tr');

    return new Promise((resolve) => {
      velocity(rows, { opacity: [0,1], scaleY:[0,1], translateY:['-100%',0]}, { duration: ANIMATION_DURATION, easing: ANIMATION_EASING }).then(() => {
        _.each(rows, (r) => {
          r.remove();
        });

        return resolve();
      });
    });
  }

  applySort() {
    let query = this.query;
    this.loader = this.renderLoading();

    this._destroyData().then(() => {
      this.tbody.appendChild(this.loader);
      this._req(query, this.render.bind(this));
    });
  }

  listenSortClick() {
    let tableHeads = this.resultsContainer.querySelectorAll('thead th');

    _.each(tableHeads, (th) => {
      th.addEventListener('click', this.onSortClick.bind(this));
    });
  }

  parseUrl() {
    let query = _.clone(URI(window.location.href).query);
    _.defaults(query, this.query);
    this.query = query;
  }

  onSortClick(e) {
    e.preventDefault();

    this.query.sortBy = e.currentTarget.dataset.key;
    this.query.sortDir = this.query.sortDir === 'asc' ? 'desc' : 'asc';

    this.applySort();
  }

  render(err, response) {
    let jsonResponse = JSON.parse(response.responseText);
    let results = jsonResponse.data;

    this.paginateController.setTotalPages(jsonResponse.totalPages);

    this.loader.remove();
    this.loader = undefined;

    if (err) {
      return this.renderError(err);
    }

    if (results.length === 0) {
      return this.renderInfo('No results.');
    }

    async.eachSeries(results, this.renderResult.bind(this), () => {
      /* Post sort function callback */
    });
  }

  renderError(err) {
    this.renderAlert('danger', ERROR_TEXT + (err.message ? ': ' + err : ''));
  }

  renderInfo(mesg) {
    this.renderAlert('info', mesg);
  }

  renderAlert(type, mesg) {
    let errorDiv = document.createElement('div');

    errorDiv.classList.add('alerts');
    errorDiv.classList.add('alerts-' + type);
    errorDiv.innerText = mesg;

    this.tbody.appendChild(errorDiv);

    velocity(errorDiv, { opacity: [1, 0] }, { duration: ANIMATION_DURATION, easing: ANIMATION_EASING });
  }

  renderLoading() {
    let loader = document.createElement('div');
    let loaderInner = document.createElement('div');

    loader.style.position = 'absolute';
    loader.style.top = 0;
    loader.style.left = 0;
    loader.style.width = '100%';
    loader.style.height = '100%';
    loader.classList.add('administrate-loader');

    loader.appendChild(loaderInner);

    return loader;
  }

  renderResult(data, callback) {
    let row = new ListResultRowView({ model: data });
    let columnOrder = [];
    let tableHeads = this.resultsContainer.querySelectorAll('th');

    _.each(tableHeads, (th) => {
      columnOrder.push(th.dataset.key);
    });

    row.columnOrder = columnOrder;

    this.tbody.appendChild(row.render());
    velocity(row.element, { opacity: [1, 0], translateY: [0, '-100%']}, { duration: ANIMATION_DURATION, easing: ANIMATION_EASING }).then(() => {
      return callback();
    });
  }

}

export default ListController;
