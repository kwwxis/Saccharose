import { pageMatch } from '../../../core/pageMatch.ts';
import { HomeWorldFurnitureTypeTree } from '../../../../shared/types/genshin/homeworld-types.ts';
import { CheckboxTree, CheckboxTreeNode, CheckTreeOpts } from '../../../util/CheckboxTree.ts';
import { escapeHtml } from '../../../../shared/util/stringUtil.ts';
import { sort } from '../../../../shared/util/arrayUtil.ts';
import { defaultMap } from '../../../../shared/util/genericUtil.ts';
import { listen } from '../../../util/eventListen.ts';
import { deleteQueryStringParameter, getQueryStringParameter, setQueryStringParameter } from '../../../util/domutil.ts';
import { toInt } from '../../../../shared/util/numberUtil.ts';

pageMatch('vue/FurnitureListPage', () => {
  const typeTree: HomeWorldFurnitureTypeTree = (<any> window).typeTree;

  const tokensToId: {[token: string]: Set<number>} = defaultMap('Set');
  const allRows: HTMLTableRowElement[] = Array.from(document.querySelectorAll('.furnishing-row'));
  const pendingIconEl = document.getElementById('filter-quick-search-pending');

  for (let row of allRows) {
    const furnId = toInt(row.getAttribute('data-id'));
    const tokens = row.getAttribute('data-filter-tokens').split(',');
    for (let token of tokens) {
      tokensToId[token].add(furnId);
    }
  }

  new CheckboxTree(document.querySelector('#type-tree'), <CheckTreeOpts> {
    data: Object.entries(typeTree).map(([subTreeName, subTree]) => (<CheckboxTreeNode> {
      checked: true,
      customLabelClass: 'ui-checkbox',
      label: subTreeName === 'InteriorAndExterior' ? 'Interior & Exterior' : subTreeName,
      value: subTreeName,
      children: sort(Object.values(subTree).map(category => (<CheckboxTreeNode> {
        value: 'category-'+category.categoryId,
        label: category.categoryName,
        checked: true,
        customLabelClass: 'ui-checkbox',
        children: sort(Object.values(category.types).map(type => (<CheckboxTreeNode> {
          value: 'subcategory-' + type.typeId,
          label: type.typeName,
          html: `<div class="valign">
            <span class="alignCenter justifyCenter" style="width:20px;height:20px;background:#2a2a36;border-radius:50%;padding:0;flex-shrink:0;">
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
      const tokens: string[] = this.getValues();
      rowLoop: for (let row of allRows) {
        const furnId = toInt(row.getAttribute('data-id'));
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
    }
  });

  const lc = (s: string) => s ? s.toLowerCase() : '';
  let debounceId: any;

  listen([
    {
      selector: '#filter-quick-search',
      event: 'input',
      handle: function(_event: InputEvent, target: HTMLInputElement) {
        clearTimeout(debounceId);
        pendingIconEl.classList.remove('hide');

        debounceId = setTimeout(() => {
          let searchText = target.value.trim().toLowerCase();

          if (!searchText) {
            deleteQueryStringParameter('q');
            setTimeout(() => {
              allRows.forEach(el => el.classList.remove('search-hide'));
              pendingIconEl.classList.add('hide');
            });
            return;
          }

          setQueryStringParameter('q', searchText);

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

  const initialQuery = getQueryStringParameter('q');
  if (initialQuery) {
    const el = document.querySelector<HTMLInputElement>('#filter-quick-search');
    el.value = initialQuery;
    el.dispatchEvent(new Event('input'));
  }
});
