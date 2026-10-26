import { pageMatch } from '../../../core/pageMatch.ts';
import { HomeWorldFurnitureExcelConfigData, HomeWorldFurnitureTypeTree } from '../../../../shared/types/genshin/homeworld-types.ts';
import { CheckboxTree, CheckboxTreeNode, CheckTreeOpts } from '../../../util/CheckboxTree.ts';
import { sort } from '../../../../shared/util/arrayUtil.ts';
import { defaultMap } from '../../../../shared/util/genericUtil.ts';
import { listen } from '../../../util/eventListen.ts';
import { deleteQueryStringParameter, getQueryStringParameter, setQueryStringParameter } from '../../../util/domutil.ts';
import { escapeHtml, escapeHtmlAllowEntities } from '../../../../shared/util/stringHtmlUtil.ts';
import type { ColDef, GridApi, GridOptions, GridReadyEvent, ICellRendererParams, ITextFilterParams } from 'ag-grid-community';
import { doWithCreateGrid } from '../../../core/gridInterface/agGridInterface.ts';
import { OverlayScrollbars } from 'overlayscrollbars';
import { isNightmode, onSiteThemeChange } from '../../../core/userPreferences/siteTheme.ts';

pageMatch('FurnitureListPage', async () => {
  const typeTree: HomeWorldFurnitureTypeTree = (<any> window).typeTree;
  const furnitureList: HomeWorldFurnitureExcelConfigData[] = (<any> window).furnitureList;

  const gridEl: HTMLElement = document.getElementById('furniture-grid');
  const gridLoadingEl: HTMLElement = document.getElementById('furniture-grid-loading');
  const pendingIconEl = document.getElementById('filter-quick-search-pending');

  // Maps a category filter token (e.g. "category-5" or "subcategory-12") to the set of furniture IDs
  // belonging to that token, mirroring the `data-filter-tokens` attribute from the previous table-based UI.
  const tokensToId: {[token: string]: Set<number>} = defaultMap('Set');
  for (let furn of furnitureList) {
    for (let token of (furn.FilterTokens || [])) {
      tokensToId[token].add(furn.Id);
    }
  }

  // Null means "no category filter has been applied yet" (i.e. show everything).
  let checkedTokens: string[] = null;
  let searchText: string = '';

  function passesTreeFilter(furn: HomeWorldFurnitureExcelConfigData): boolean {
    if (checkedTokens === null) {
      return true;
    }
    for (let token of checkedTokens) {
      if (tokensToId[token] && tokensToId[token].has(furn.Id)) {
        return true;
      }
    }
    return false;
  }

  const lc = (s: string|number) => {
    if (typeof s === 'number') {
      return String(s);
    }
    return s ? s.toLowerCase() : '';
  };

  function passesSearchFilter(furn: HomeWorldFurnitureExcelConfigData): boolean {
    if (!searchText) {
      return true;
    }
    return lc(furn.Id) == searchText
      || lc(furn.NameText).includes(searchText)
      || lc(furn.CategoryNameText).includes(searchText)
      || lc(furn.TypeNameText).includes(searchText);
  }

  // Replicates the GenshinStars.vue component's rendering, since Vue SSR components aren't available client-side.
  function renderStars(quality: number): string {
    if (typeof quality !== 'number' || quality <= 0 || quality > 5) {
      return '';
    }
    const label = `${quality} star${quality > 1 ? 's' : ''}`;
    return `<img src="/images/genshin/static/Icon_${quality}_Stars.png" loading="lazy" decoding="async" ` +
      `style="height:18px;width:auto;" alt="${label}" title="${label}" />`;
  }

  function getCategoryLines(furn: HomeWorldFurnitureExcelConfigData): string[] {
    const interiorExterior = (furn.IsInterior && furn.IsExterior) ? 'Interior & Exterior'
      : (furn.IsInterior ? 'Interior' : (furn.IsExterior ? 'Exterior' : null));
    return [interiorExterior, furn.CategoryNameText, furn.TypeNameText].filter(Boolean);
  }

  // Matches the filter text against each individual category line separately (rather than against a single
  // concatenated string), so that e.g. "iorDec" doesn't falsely match a row with categories "Interior" and
  // "Decoration" just because the two words happen to abut when joined together.
  const categoriesFilterParams: ITextFilterParams = {
    caseSensitive: true,
    textMatcher: ({ value, filterText, filterOption }) => {
      if (!filterText) {
        return true;
      }
      const needle = filterText.toLowerCase();
      const haystacks: string[] = (Array.isArray(value) ? value : [value]).map((v: string) => (v || '').toLowerCase());
      switch (filterOption) {
        case 'notContains':
          return haystacks.every(h => !h.includes(needle));
        case 'equals':
          return haystacks.some(h => h === needle);
        case 'notEqual':
          return haystacks.every(h => h !== needle);
        case 'startsWith':
          return haystacks.some(h => h.startsWith(needle));
        case 'endsWith':
          return haystacks.some(h => h.endsWith(needle));
        case 'contains':
        default:
          return haystacks.some(h => h.includes(needle));
      }
    },
  };

  const ICON_ROW_HEIGHT = 58;
  const CATEGORY_LINE_HEIGHT = 20;
  const CATEGORY_VERTICAL_PADDING = 16;

  const columnDefs: ColDef<HomeWorldFurnitureExcelConfigData>[] = [
    {
      colId: 'icon',
      headerName: 'Icon',
      width: 90,
      sortable: false,
      filter: false,
      cellClass: 'valign justifyCenter',
      cellRenderer: (params: ICellRendererParams<HomeWorldFurnitureExcelConfigData>) => {
        const furn = params.data;
        const icon = furn.IconUrl || furn.Icon || furn.ItemIcon;
        if (!icon) {
          return '';
        }
        return `<img class="framed-icon x42" src="/images/genshin/${escapeHtml(icon)}.png" loading="lazy" decoding="async" />`;
      },
    },
    {
      colId: 'id',
      field: 'Id',
      headerName: 'ID',
      width: 100,
      sort: 'asc',
      filter: 'agTextColumnFilter',
      valueFormatter: params => String(params.value).padStart(6, '0'),
      cellRenderer: (params: ICellRendererParams<HomeWorldFurnitureExcelConfigData>) =>
        `<span class="code" style="font-size:14px">${String(params.value).padStart(6, '0')}</span>`,
    },
    {
      colId: 'name',
      field: 'NameText',
      headerName: 'Name',
      flex: 1,
      minWidth: 220,
      filter: 'agTextColumnFilter',
      cellRenderer: (params: ICellRendererParams<HomeWorldFurnitureExcelConfigData>) => {
        const furn = params.data;
        return `<a href="/genshin/furnishings/${furn.Id}" role="button" class="secondary border-light textAlignLeft">` +
          `${escapeHtmlAllowEntities(furn.NameText)}</a>`;
      },
    },
    {
      colId: 'categories',
      headerName: 'Categories',
      width: 200,
      valueGetter: params => getCategoryLines(params.data),
      valueFormatter: params => (Array.isArray(params.value) ? params.value.join(' / ') : params.value ?? ''),
      cellStyle: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        lineHeight: '1.25em',
        fontSize: '0.95em',
      },
      filter: 'agTextColumnFilter',
      filterParams: categoriesFilterParams,
      cellRenderer: (params: ICellRendererParams<HomeWorldFurnitureExcelConfigData>) => {
        const lines = getCategoryLines(params.data).map(line => `<span>${escapeHtml(line)}</span>`);
        return lines.join('<br>');
      },
    },
    {
      colId: 'quality',
      field: 'RankLevel',
      headerName: 'Quality',
      width: 120,
      filter: 'agNumberColumnFilter',
      cellRenderer: (params: ICellRendererParams<HomeWorldFurnitureExcelConfigData>) => renderStars(params.value),
    },
    {
      colId: 'comfort',
      field: 'Comfort',
      headerName: 'Adeptal Energy',
      width: 130,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      filter: 'agNumberColumnFilter',
    },
    {
      colId: 'cost',
      field: 'Cost',
      headerName: 'Load',
      width: 90,
      filter: 'agNumberColumnFilter',
    },
    {
      colId: 'discountCost',
      field: 'DiscountCost',
      headerName: 'Reduced Load',
      width: 130,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      filter: 'agNumberColumnFilter',
    },
  ];

  const gridOptions: GridOptions<HomeWorldFurnitureExcelConfigData> = {
    columnDefs,
    rowData: furnitureList,
    getRowId: params => String(params.data.Id),
    getRowHeight: params => {
      const lineCount = getCategoryLines(params.data).length || 1;
      const categoryHeight = lineCount * CATEGORY_LINE_HEIGHT + CATEGORY_VERTICAL_PADDING;
      return Math.max(ICON_ROW_HEIGHT, categoryHeight);
    },
    defaultColDef: {
      resizable: true,
      sortable: true,
      wrapText: true,
      suppressHeaderMenuButton: true,
      cellStyle: { display: 'flex', alignItems: 'center' },
    },
    isExternalFilterPresent: () => checkedTokens !== null || !!searchText,
    doesExternalFilterPass: params => passesTreeFilter(params.data) && passesSearchFilter(params.data),
    suppressContextMenu: true,
    enableCellTextSelection: true,
    onGridReady(_event: GridReadyEvent) {
      gridLoadingEl.classList.add('hide');
      gridEl.classList.remove('hide');
    },
  };

  gridEl.classList.add('ag-theme-alpine' + (isNightmode() ? '-dark' : ''));

  const createGrid = await doWithCreateGrid();
  const gridApi: GridApi<HomeWorldFurnitureExcelConfigData> = createGrid(gridEl, gridOptions);
  gridApi.sizeColumnsToFit();

  onSiteThemeChange(theme => {
    if (theme === 'nightmode') {
      gridEl.classList.remove('ag-theme-alpine');
      gridEl.classList.add('ag-theme-alpine-dark');
    } else {
      gridEl.classList.remove('ag-theme-alpine-dark');
      gridEl.classList.add('ag-theme-alpine');
    }
  });

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
      checkedTokens = this.getValues();
      gridApi.onFilterChanged();
    },
    cbLoaded() {
      document.getElementById('filter-loading-panel').classList.add('hide');

      OverlayScrollbars(document.querySelector<HTMLElement>('#type-tree-scroller'), {
        scrollbars: {
          theme: isNightmode() ? 'os-theme-light' : 'os-theme-dark',
          autoHide: 'leave'
        },
        overflow: {
          x: 'hidden'
        }
      });
    }
  });

  let debounceId: any;

  listen([
    {
      selector: '#filter-quick-search',
      event: 'input',
      handle: function(_event: InputEvent, target: HTMLInputElement) {
        clearTimeout(debounceId);
        pendingIconEl.classList.remove('hide');

        debounceId = setTimeout(() => {
          const rawSearchText = target.value.trim().toLowerCase();

          if (!rawSearchText) {
            deleteQueryStringParameter('q');
          } else {
            setQueryStringParameter('q', rawSearchText);
          }

          searchText = rawSearchText;
          gridApi.onFilterChanged();
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
