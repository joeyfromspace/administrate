import View from '../lib/View';

class ListResultColumnView extends View {
  constructor(opts) {
    super(opts);

    this.viewName = 'result col';
    this.template = '{{#if link }}<a href="/{{modelName}}s/{{id}}">{{/if}}{{value}}{{#if link}}</a>{{/if}}';
    this.tag = 'td';
  }
}

export default ListResultColumnView;