import { pageMatch } from '../../../pageMatch';
import { HomeWorldFurnitureTypeTree } from '../../../../shared/types/genshin/homeworld-types';
import { CheckTree } from '../../../util/checkTree';
import { escapeHtml } from '../../../../shared/util/stringUtil';
import { sort } from '../../../../shared/util/arrayUtil';
import { defaultMap } from '../../../../shared/util/genericUtil';
import { startListeners } from '../../../util/eventLoader';

pageMatch('pages/genshin/archive/furniture-list', () => {
  const typeTree: HomeWorldFurnitureTypeTree = (<any> window).typeTree;

  const tokensToId: {[token: string]: Set<number>} = defaultMap('Set');
  const allRows: HTMLTableRowElement[] = Array.from(document.querySelectorAll('.furnishing-row'));
  const pendingIconEl = document.getElementById('filter-quick-search-pending');

  for (let row of allRows) {
    const furnId = parseInt(row.getAttribute('data-id'));
    const tokens = row.getAttribute('data-filter-tokens').split(',');
    for (let token of tokens) {
      tokensToId[token].add(furnId);
    }
  }

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
            <span class="alignCenter justifyCenter" style="width:20px;height:20px;background:#2a2a36;border-radius:50%;padding:0;">
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
  });

  const lc = (s: string) => s ? s.toLowerCase() : '';
  let debounceId: any;

  startListeners([
    {
      el: '#filter-quick-search',
      ev: 'input',
      fn: function(event: InputEvent, target: HTMLInputElement) {
        clearTimeout(debounceId);
        pendingIconEl.classList.remove('hide');

        debounceId = setTimeout(() => {
          let searchText = target.value.trim().toLowerCase();

          if (!searchText) {
            setTimeout(() => {
              allRows.forEach(el => el.classList.remove('search-hide'));
              pendingIconEl.classList.add('hide');
            });
            return;
          }

          for (let row of allRows) {
            let name = lc(row.getAttribute('data-name'));
            let category = lc(row.getAttribute('data-category'));
            let subcategory = lc(row.getAttribute('data-subcategory'));

            let isMatch = name.includes(searchText) || category.includes(searchText) || subcategory.includes(searchText);
            if (isMatch) {
              row.classList.remove('search-hide');
            } else {
              row.classList.add('search-hide');
            }
          }

          pendingIconEl.classList.add('hide');
        }, 250);
      }
    },
  ]);
});