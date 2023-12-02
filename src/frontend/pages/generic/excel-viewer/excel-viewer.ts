import { pageMatch } from '../../../pageMatch';

import { ColDef, Grid, GridApi, GridOptions, IFilterOptionDef, INumberFilterParams } from 'ag-grid-community';
import { LicenseManager } from 'ag-grid-enterprise';
LicenseManager.prototype.validateLicense = function() {};
LicenseManager.prototype.isDisplayWatermark = function() {return false};
LicenseManager.prototype.getWatermarkMessage = function() {return null};
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import './ag-grid-custom.scss';

import { camelCaseToTitleCase, escapeHtml } from '../../../../shared/util/stringUtil';
import { ColGroupDef } from 'ag-grid-community/dist/lib/entities/colDef';
import { sort } from '../../../../shared/util/arrayUtil';
import { startListeners } from '../../../util/eventLoader';
import { downloadObjectAsJson, getTextWidth } from '../../../util/domutil';
import { ICellRendererParams } from 'ag-grid-community/dist/lib/rendering/cellRenderers/iCellRenderer';
import { highlightJson, highlightWikitext } from '../../../util/ace/wikitextEditor';
import { isNotEmpty, isUnset } from '../../../../shared/util/genericUtil';
import { DOMClassWatcher } from '../../../util/domClassWatcher';
import { booleanFilter } from './excel-custom-filters';

function initializeThemeWatcher(gridEl: HTMLElement, topEl: HTMLElement) {
  new DOMClassWatcher('body', 'nightmode',
    () => {
      gridEl.classList.remove('ag-theme-alpine');
      gridEl.classList.add('ag-theme-alpine-dark');

      topEl.classList.remove('ag-theme-alpine');
      topEl.classList.add('ag-theme-alpine-dark');
    },
    () => {
      gridEl.classList.remove('ag-theme-alpine-dark');
      gridEl.classList.add('ag-theme-alpine');

      topEl.classList.remove('ag-theme-alpine-dark');
      topEl.classList.add('ag-theme-alpine');
    });
}

function walkColumnDefs(columnDefs: (ColDef | ColGroupDef)[], cb: (colDef: ColDef) => void) {
  for (let colDef of columnDefs) {
    if (colDef.hasOwnProperty('children')) {
      walkColumnDefs((<ColGroupDef> colDef).children, cb);
    } else {
      cb(colDef);
    }
  }
}

function makeSingleColumnDef(fieldKey: string, fieldName: string, data: any) {
  let initialWidth = typeof data === 'string' ? 200 : 100;
  let headerWidth = getTextWidth(camelCaseToTitleCase(fieldName), `bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif`);
  headerWidth += (18 * 2) + 16; // 18px left and right padding + filter icon width
  initialWidth = Math.max(initialWidth, headerWidth);

  const colDef = <ColDef> {
    headerName: camelCaseToTitleCase(fieldName),
    headerTooltip: camelCaseToTitleCase(fieldName),
    field: fieldKey,
    filter: typeof data === 'number' || typeof data === 'boolean' ? 'agNumberColumnFilter' : 'agTextColumnFilter',
    filterParams: typeof data === 'boolean' ? booleanFilter : undefined,
    width: initialWidth,
    hide: fieldName.includes('TextMapHash') || fieldName.endsWith('Hash'),
    cellClass: 'cell-type-' + (isUnset(data) ? 'null' : typeof data),
    floatingFilter: true
  };

  if (typeof data === 'string' && pageMatch.isStarRail && (fieldName.includes('Image')
      || fieldName.includes('Icon') || fieldName.includes('Path') || fieldName.includes('Pic') || fieldName.includes('Map'))) {
    colDef.cellRenderer = function(params: ICellRendererParams) {
      if (!params.value || typeof params.value !== 'string' || !params.value.endsWith('.png')) {
        return '';
      }
      let safeValue = escapeHtml(params.value);
      return `<img class="excel-image" src="/images/hsr/${safeValue}" loading="lazy" decoding="async"
          alt="Image not found" onerror="this.classList.add('excel-image-error')" />
        <span class="code">${safeValue}</span>`;
    };
  } else if (typeof data === 'string' && pageMatch.isGenshin && (fieldName.includes('Image') || fieldName.includes('Icon')
      || fieldName.includes('Path') || fieldName.includes('Pic') || fieldName.includes('Map') || data.startsWith('UI_'))) {
    colDef.cellRenderer = function(params: ICellRendererParams) {
      const genshinImageRegex: RegExp =
        /^(UI_|.*Tutorial).*$/i;
      if (!params.value || typeof params.value !== 'string' || !genshinImageRegex.test(params.value)) {
        return '';
      }
      const safeValue = escapeHtml(params.value);
      return `<img class="excel-image" src="/images/genshin/${safeValue}.png" loading="lazy" decoding="async"
          alt="Image not found" onerror="this.classList.add('excel-image-error')" />
        <span class="code">${safeValue}</span>`;
    };
  } else if (typeof data === 'string' && (fieldName.includes('Text') || fieldName.includes('Name')
    || fieldName.includes('Title') || fieldName.includes('Desc') || fieldName.includes('Story'))) {
    colDef.cellRenderer = function(params: ICellRendererParams) {
      if (!params.value) {
        return '';
      }
      return highlightWikitext(params.value).outerHTML;
    };
  } else if (typeof data === 'object') {
    colDef.cellRenderer = function(params: ICellRendererParams) {
      if (!params.value) {
        return '';
      }
      if (Array.isArray(params.value)) {
        params.value = params.value.filter(x => isNotEmpty(x));
        if (!params.value.length) {
          return '';
        }
      }
      return highlightJson(JSON.stringify(params.value)).outerHTML;
    };
  } else if (typeof data === 'string' && data.toUpperCase() === data) {
    colDef.cellRenderer = function(params: ICellRendererParams) {
      if (!params.value) {
        return '';
      }
      return `<code>${escapeHtml(params.value)}</code>`;
    };
  }

  return colDef;
}

function getColumnDefs(excelData: any[]): (ColDef | ColGroupDef)[] {
  const columnDefs: (ColDef | ColGroupDef)[] = [];
  const colDefForKey: {[key: string]: ColDef|ColGroupDef} = {};

  const uniqueKeys: {[key: string]: Set<any>|false} = {};

  for (let row of excelData) {
    for (let key of Object.keys(row)) {
      if (typeof row[key] === 'number') {
        if (!uniqueKeys.hasOwnProperty(key)) {
          uniqueKeys[key] = new Set<any>();
        }

        if (uniqueKeys[key] && uniqueKeys[key] instanceof Set) {
          const set: Set<any> = <Set<any>> uniqueKeys[key];
          if (set.has(row[key])) {
            uniqueKeys[key] = false;
          } else {
            set.add(row[key]);
          }
        }
      }

      if (row[key] && typeof row[key] === 'object' && !Array.isArray(row[key])) {
        if (!colDefForKey[key]) {
          colDefForKey[key] = <ColGroupDef> {
            headerName: camelCaseToTitleCase(key),
            headerTooltip: camelCaseToTitleCase(key),
            children: []
          };
          columnDefs.push(colDefForKey[key]);
        }
        for (let subKey of Object.keys(row[key])) {
          const fullKey: string = key + '.' + subKey;
          if (colDefForKey[fullKey] || !row[key][subKey]) {
            continue;
          }
          colDefForKey[fullKey] = makeSingleColumnDef(fullKey, subKey, row[key][subKey]);
          (<ColGroupDef> colDefForKey[key]).children.push(colDefForKey[fullKey]);
        }
      } else {
        if (colDefForKey[key] || !row[key]) {
          continue;
        }
        colDefForKey[key] = makeSingleColumnDef(key, key, row[key]);
        columnDefs.push(colDefForKey[key]);
      }
    }
  }

  //console.log('Unique Keys:', uniqueKeys);
  sort(columnDefs,  (a, b): number => {
    if (a.headerName === 'ID' || a.headerName === 'Order ID') {
      return -1;
    }
    if (b.headerName === 'ID' || b.headerName === 'Order ID') {
      return 1;
    }

    const a_field = (<any> a).field;
    const b_field = (<any> b).field;

    if (a.headerName.endsWith('Text')) {
      if (b.headerName.includes('Title') || b.headerName.includes('Name') || uniqueKeys[b_field]) {
        return 1;
      }
      return -1;
    }
    if (b.headerName.endsWith('Text')) {
      if (a.headerName.includes('Title') || a.headerName.includes('Name') || uniqueKeys[a_field]) {
        return -1;
      }
      return 1;
    }
    if (a_field && uniqueKeys[a_field]) {
      return -1;
    }
    if (b_field && uniqueKeys[b_field]) {
      return 1;
    }
    return 0;
  });
  return columnDefs;
}

pageMatch('pages/generic/basic/excel-viewer-table', () => {
  const gridEl: HTMLElement = document.querySelector('#excelViewerGrid');
  const topEl: HTMLElement = document.querySelector('#excelViewerTop');

  if (!gridEl) {
    return;
  }

  initializeThemeWatcher(gridEl, topEl);
  const excelData: any[] = (<any> window).excelData;
  const excelFileName: string = (<any> window).excelFileName;

  const gridOptions: GridOptions = {
    columnDefs: getColumnDefs(excelData),
    rowData: excelData,
    defaultColDef: {
      resizable: true,
      sortable: true,
      wrapText: true,
      autoHeight: true,
      autoHeaderHeight: true,
      wrapHeaderText: true
    },
    enableCellTextSelection: true,
    ensureDomOrder: true,
    enableRangeSelection: true,
    sideBar: {
      toolPanels: [
        {
          id: 'columns',
          labelDefault: 'Columns',
          labelKey: 'columns',
          iconKey: 'columns',
          toolPanel: 'agColumnsToolPanel',
          toolPanelParams: {
            suppressValues: true,
            suppressRowGroups: true,
            suppressPivots: true,
            suppressPivotMode: true,
          }
        },
        {
          id: 'filters',
          labelDefault: 'Filters',
          labelKey: 'filters',
          iconKey: 'filter',
          toolPanel: 'agFiltersToolPanel'
        }
      ],
      //defaultToolPanel: 'columns',
    }
  };

  new Grid(gridEl, gridOptions);
  const api: GridApi = gridOptions.api;

  let quickFilterDebounceId: any;

  startListeners([
    {
      el: '#excel-quick-filter',
      ev: 'input',
      debounceId: 0,
      fn: (evt, target: HTMLInputElement) => {
        if (quickFilterDebounceId) {
          clearTimeout(quickFilterDebounceId);
        }
        quickFilterDebounceId = setTimeout(() => {
          api.setQuickFilter(target.value);
        }, 150);
      }
    },
    {
      el: '#excel-export-csv',
      ev: 'click',
      fn: () => {
        api.exportDataAsCsv({
          fileName: excelFileName+'.csv'
        });
      }
    },
    {
      el: '#excel-export-excel',
      ev: 'click',
      fn: () => {
        api.exportDataAsExcel({
          sheetName: excelFileName,
          fileName: excelFileName+'.xlsx',
          author: null
        });
      }
    },
    {
      el: '#excel-export-json',
      ev: 'click',
      fn: () => {
        downloadObjectAsJson(excelData, excelFileName + '.json', 2);
      }
    }
  ]);
});