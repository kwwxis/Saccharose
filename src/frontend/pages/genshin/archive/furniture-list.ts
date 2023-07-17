import { pageMatch } from '../../../pageMatch';
import { HomeWorldFurnitureTypeTree } from '../../../../shared/types/genshin/homeworld-types';
import { CheckTree } from '../../../util/checkTree';
import { escapeHtml, ltrim, rtrim } from '../../../../shared/util/stringUtil';
import { sort } from '../../../../shared/util/arrayUtil';
import { defaultMap } from '../../../../shared/util/genericUtil';
import lunr from 'lunr';
import { startListeners } from '../../../util/eventLoader';

pageMatch('pages/genshin/archive/furniture-list', () => {
  const typeTree: HomeWorldFurnitureTypeTree = (<any> window).typeTree;

  const tokensToId: {[token: string]: Set<number>} = defaultMap('Set');
  const allRows: HTMLTableRowElement[] = Array.from(document.querySelectorAll('.furnishing-row'));

  const furnIdx: lunr.Index = lunr(function() {
    this.ref('id');
    this.field('name');
    this.field('category');
    this.field('subcategory');

    for (let row of allRows) {
      const furnId = parseInt(row.getAttribute('data-id'));
      const furnName = row.getAttribute('data-name');
      const furnCategory = row.getAttribute('data-category');
      const furnSubcategory = row.getAttribute('data-subcategory');

      const tokens = row.getAttribute('data-filter-tokens').split(',');
      for (let token of tokens) {
        tokensToId[token].add(furnId);
      }

      this.add({
        id: furnId,
        name: furnName,
        category: furnCategory,
        subcategory: furnSubcategory
      })
    }
  });

  const myTree = new CheckTree(document.querySelector('#type-tree'), {
    data: Object.entries(typeTree).map(([subTreeName, subTree]) => ({
      checked: true,
      customLabelClass: 'ui-checkbox',
      label: subTreeName === 'InteriorAndExterior' ? 'Interior & Exterior' : subTreeName,
      value: subTreeName,
      children: sort(Object.values(subTree).map(category => ({
        value: 'category-'+category.categoryId,
        label: category.categoryName,
        checked: true,
        customLabelClass: 'ui-checkbox',
        children: sort(Object.values(category.types).map(type => ({
          value: 'subcategory-' + type.typeId,
          label: type.typeName,
          html: `<div class="valign">
            <span class="alignCenter justifyCenter" style="width:20px;height:20px;background:#2a2a36;border-radius:50%">
              `+(type.typeIcon ? `<img src="/images/genshin/${type.typeIcon}.png" style="width:16px;height:16px" />` : '')+`
            </span>
            <span class="spacer5-left">${escapeHtml(type.typeName)}</span>
          </div>`,
          checked: true,
          customLabelClass: 'ui-checkbox',
        })), 'label')
      })), 'label'),
    })),
    cbChanged() {
      const tokens = this.getValues();
      rowLoop: for (let row of allRows) {
        const furnId = parseInt(row.getAttribute('data-id'));
        for (let token of tokens) {
          if (tokensToId[token].has(furnId)) {
            row.classList.remove('hide');
            continue rowLoop;
          }
        }
        row.classList.add('hide');
      }
    },
    cbLoaded() {
      document.getElementById('filter-loading-panel').classList.add('hide');
      document.getElementById('filter-toggle-panel').classList.remove('hide');
    }
  })

  startListeners([
    {
      el: '#filter-quick-search',
      ev: 'input',
      fn: function(event: InputEvent, target: HTMLInputElement) {
        let searchText = target.value.trim();
        if (!searchText) {
          document.querySelectorAll('.furnishing-row.lunr-hide')
            .forEach(el => el.classList.remove('lunr-hide'));
          return;
        }

        let query = '';
        query += rtrim(searchText, '*') + '^2 '
        query += rtrim(searchText, '*') + '*' + ' '
        query += ltrim(searchText, '*') + '~1';

        let results: lunr.Index.Result[] = furnIdx.search(query);

        document.querySelectorAll('.furnishing-row').forEach(el => el.classList.add('lunr-hide'));

        for (let result of results) {
          document.querySelector(`.furnishing-row[data-id="${result.ref}"]`).classList.remove('lunr-hide');
        }
      }
    },
  ]);
});