import View from '../lib/view';
import _ from 'lodash';

const filterTemplate = require('fs').readFileSync(__dirname + '/../templates/list-filter.hbs', 'utf8');

class ListFilterView extends View {
  constructor(opts) {
    super(opts);

    this.tag = 'div';
    this.viewName = 'filter';
    this.template = filterTemplate;
    this.filterType = opts.filterType || 'text';
    this.events = {
      text: { event: 'keyup', handler: this.searchText.bind(this) },
      checkbox: { event: 'change', handler: this.toggleCheckbox.bind(this) }
    };

    this.on('render', this.bindHandlers.bind(this));
  }

  toggleCheckbox(e) {
    let t = e.currentTarget;

    this.model.value = t.checked;
    this.parseInput();
  }

  searchText(e) {
    let validKeys = _.concat([8], [32], _.range(48, 57), _.range(65, 90), [46], _.range(188, 222));
    let t = e.currentTarget;

    if (validKeys.indexOf(e.keyCode) === -1 || this.model.value === t.value) {
      return;
    }

    this.model.oldValue = this.model.value;
    this.model.value = t.value;
    this.parseInput();
  }

  bindHandlers() {
    let input = this.element.querySelector('input');
    input.addEventListener(this.events[this.filterType].event, this.events[this.filterType].handler);

    this.on('destroy', () => {
      input.removeEventListener(this.events[this.filterType].event, this.events[this.filterType].handler);
    });
  }

  parseInput() {
    this.emit('update', { value: this.model.value, name: this.model.name, filterType: this.filterType });
  }

  render() {
    this.model.filterType = this.filterType;
    return super.render();
  }
}

export default ListFilterView;