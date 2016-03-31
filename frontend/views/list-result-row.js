import View from '../lib/View';
import ListResultColumnView from './list-result-col';

class ListResultRowView extends View {
  constructor(opts) {
    super(opts);

    this.viewName = 'result';
    this.template = '';
    this.tag = 'tr';
    this.columnOrder = opts.columnOrder || [];
  }

  render() {
    super.render();

    if (this.columnOrder.length === 0) {
      return this.element;
    }

    _.each(this.columnOrder, (colKey) => {
      let col = new ListResultColumnView();

      if (colKey === '_id') {
        col.model = { value: this.model.id, link: true, baseUrl: ADMIN_LOCALS.baseUrl.toLowerCase(), modelName: ADMIN_LOCALS.modelName.toLowerCase(), id: this.model.id };
      } else if (typeof this.model[colKey] !== 'object') {
        col.model = {value: this.model[colKey]};
      } else {
        if (this.model[colKey]._id) {
          col.model = { value: this.model[colKey].name ? this.model[colKey].name : (this.model[colKey].label ? this.model[colKey].label : this.model[colKey]._id), link: true, modelName: colKey.toLowerCase(), id: this.model[colKey]._id };
        } else {
          col.model = { value: this.model[colKey] };
        }
      }

      this.element.appendChild(col.render());
    });

    return this.element;
  }
}

export default ListResultRowView;