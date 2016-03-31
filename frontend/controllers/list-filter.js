import Controller from '../lib/controller';
import _ from 'lodash';

import ListFilterView from '../views/list-filter';

class ListFilterController extends Controller {
  constructor(ele, filters) {
    super(ele);


    this.element = ele;
    this.filters = filters;
  }

  load() {
    _.map(this.filters, (filter) => {
      let view = new ListFilterView({ model: { name: filter.name, oldValue: '', value: '' },  filterType: filter.type });

      this.element.appendChild(view.render());

      view.on('update', (e) => {
        this.emit('update', e);
      });

      return view;
    });
  }
}

export default ListFilterController;