import { pageMatch } from '../../../pageMatch';
import { HomeWorldFurnitureTypeTree } from '../../../../shared/types/genshin/homeworld-types';
import { CheckTree } from '../../../util/checkTree';
import { escapeHtml } from '../../../../shared/util/stringUtil';
import { sort } from '../../../../shared/util/arrayUtil';
import { defaultMap } from '../../../../shared/util/genericUtil';

pageMatch('pages/genshin/archive/furniture-list', () => {
  const typeTree: HomeWorldFurnitureTypeTree = (<any> window).typeTree;

  const tokensToId: {[token: string]: Set<number>} = defaultMap('Set');
  const allRows: HTMLTableRowElement[] = Array.from(document.querySelectorAll('.furnishing-row'));

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
      label: subTreeName,
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
            <img src="/images/genshin/${type.typeIcon}.png" style="width:20px;height:20px;background:#2a2a36;border-radius:50%" />
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
});