(function() {
  'use strict';
  window.adminDetailSelector = (selectors) => {
    const _p = function(s) {
      const modelSettings = {
        label: $(s).attr('data-label'),
        search: $(s).attr('data-label'),
        url: $(s).attr('data-url')
      };
      return $(s).selectize({
          valueField: 'id',
          labelField: modelSettings.label,
          searchField: modelSettings.label,
          create: false,
          maxItems: 1,
          preload: false,
          render: {
              option: function(item, escape) {
                  return '<div>' +
                      '<span class="title">' +
                          '<span class="name">' + escape(item[modelSettings.label]) + '</span>' +
                      '</span>' +
                  '</div>';
              }
          },
          score: function(search) {
              let score = this.getScoreFunction(search);
              return function(item) {
                  return score(item);
              };
          },
          load: function(query, callback) {
              if (!query.length) {
                return callback();
              }
              $.ajax({
                  url: ADMIN_LOCALS.baseUrl + '/' + modelSettings.url + '/search?' + encodeURIComponent(modelSettings.search) + '=' + encodeURIComponent(query),
                  accepts: 'application/json',
                  type: 'GET',
                  error: function(res) {
                    console.log(res);
                    callback();
                  },
                  success: function(res) {
                    callback(res.slice(0, 10));
                  }
              });
          }
      });
    };

    if (typeof selectors === 'string') {
      selectors = [selectors];
    }

    return selectors.map(_p);
  };
}());
