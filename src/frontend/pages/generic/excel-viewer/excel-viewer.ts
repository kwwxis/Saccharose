import { pageMatch } from '../../../pageMatch.ts';
import {
  ColDef,
  ColumnApi, ColumnState,
  GetContextMenuItemsParams,
  Grid,
  GridApi,
  GridOptions,
  MenuItemDef,
} from 'ag-grid-community';
import { LicenseManager } from 'ag-grid-enterprise';
LicenseManager.prototype.validateLicense = function() {};
LicenseManager.prototype.isDisplayWatermark = function() {return false};
LicenseManager.prototype.getWatermarkMessage = function() {return null};
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import './ag-grid-custom.scss';
import { camelCaseToTitleCase, escapeHtml } from '../../../../shared/util/stringUtil.ts';
import { ColGroupDef } from 'ag-grid-community/dist/lib/entities/colDef';
import { sort } from '../../../../shared/util/arrayUtil.ts';
import { listen } from '../../../util/eventListen.ts';
import {
  copyImageToClipboard,
  DOMClassWatcher,
  downloadImage,
  downloadObjectAsJson,
  getTextWidth,
} from '../../../util/domutil.ts';
import { ICellRendererParams } from 'ag-grid-community/dist/lib/rendering/cellRenderers/iCellRenderer';
import { highlightJson, highlightWikitext } from '../../../util/ace/wikitextEditor.ts';
import { isNotEmpty, isUnset, throttle } from '../../../../shared/util/genericUtil.ts';
import { booleanFilter } from './excel-custom-filters.ts';
import SiteMode from '../../../siteMode.ts';
import siteMode from '../../../siteMode.ts';
import { ExcelViewerDB, invokeExcelViewerDB } from './excel-viewer-storage.ts';
import { StoreNames } from 'idb/build/entry';
import { GridReadyEvent } from 'ag-grid-community/dist/lib/events';

function initializeThemeWatcher(elements: HTMLElement[]) {
  new DOMClassWatcher('body', 'nightmode',
    () => {
      for (let element of elements) {
        element.classList.remove('ag-theme-alpine');
        element.classList.add('ag-theme-alpine-dark');
      }
    },
    () => {
      for (let element of elements) {
        element.classList.remove('ag-theme-alpine-dark');
        element.classList.add('ag-theme-alpine');
      }
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
    colId: fieldKey,
    field: fieldKey,
    filter: typeof data === 'number' || typeof data === 'boolean' ? 'agNumberColumnFilter' : 'agTextColumnFilter',
    filterParams: typeof data === 'boolean' ? booleanFilter : undefined,
    width: initialWidth,
    hide: fieldName.includes('TextMapHash') || fieldName.endsWith('Hash'),
    cellClass: 'cell-type-' + (isUnset(data) ? 'null' : typeof data),
    floatingFilter: true
  };

  const dataType = {
    isStarRailImage: typeof data === 'string' && SiteMode.isStarRail &&
      (data.startsWith('SpriteOutput/') || data.startsWith('UI/') || data.endsWith('.png')),
    isGenshinImage: typeof data === 'string' && SiteMode.isGenshin && /^(ART\/.*\/)?(UI_|MonsterSkill_|Eff_).*$/.test(data),
    isWikitext: typeof data === 'string' && (fieldName.includes('Text') || fieldName.includes('Name')
      || fieldName.includes('Title') || fieldName.includes('Desc') || fieldName.includes('Story')),
    isJson: typeof data === 'object',
    isEnum: typeof data === 'string' && data.toUpperCase() === data,
  };

  if (dataType.isGenshinImage || dataType.isStarRailImage) {
    colDef.cellRenderer = function(params: ICellRendererParams) {
      if (!params.value || typeof params.value !== 'string')
        return '';
      let fileName: string = escapeHtml(params.value);
      let srcValue: string;

      if (fileName.endsWith('.png')) {
        fileName = fileName.slice(0, -4);
      }

      if (dataType.isGenshinImage) {
        if (params.value.includes('/')) {
          fileName = escapeHtml(params.value.split('/').pop());
        }
        srcValue = `/images/genshin/${fileName}.png`;
      } else if (dataType.isStarRailImage) {
        srcValue = `/images/hsr/${fileName}.png`;
      }

      // noinspection HtmlDeprecatedAttribute
      return `<img class="excel-image" src="${srcValue}" loading="lazy" decoding="async"
          alt="Image not found" onerror="this.classList.add('excel-image-error')" data-file-name="${fileName}.png" />
        <span class="code">${escapeHtml(params.value)}</span>`;
    };
  } else if (dataType.isWikitext) {
    colDef.cellRenderer = function(params: ICellRendererParams) {
      return !params.value ? '' : highlightWikitext(params.value).outerHTML;
    };
  } else if (typeof data === 'object') {
    colDef.cellRenderer = function(params: ICellRendererParams) {
      if (!params.value)
        return '';
      if (Array.isArray(params.value)) {
        params.value = params.value.filter(x => isNotEmpty(x));
        if (!params.value.length) {
          return '';
        }
      }
      return highlightJson(JSON.stringify(params.value)).outerHTML;
    };
  } else if (dataType.isEnum) {
    colDef.cellRenderer = function(params: ICellRendererParams) {
      return !params.value ? '' : `<code>${escapeHtml(params.value)}</code>`;
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

pageMatch('pages/generic/basic/excel-viewer-table', async () => {
  const gridEl: HTMLElement = document.querySelector('#excelViewerGrid');
  const topEl: HTMLElement = document.querySelector('#excelViewerTop');
  const gridLoadingEl: HTMLElement = document.querySelector('#excelViewerGridLoading');

  if (!gridEl) {
    return;
  }

  initializeThemeWatcher([gridEl, topEl, gridLoadingEl]);

  // noinspection JSUnresolvedReference
  const excelData: any[] = (<any> window).excelData;

  // noinspection JSUnresolvedReference
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
      ]
    },
    getContextMenuItems(params: GetContextMenuItemsParams): (string | MenuItemDef)[] {
      const cellEl: HTMLElement = document.querySelector(`.ag-body-viewport .ag-row[row-id="${params.node.id}"] .ag-cell[col-id="${params.column.getColId()}"]`);
      const cellImage: HTMLImageElement = cellEl.querySelector('.excel-image:not(.excel-image-error)');

      const result: (string | MenuItemDef)[] = [
        'copy',
        'copyWithHeaders'
      ];

      if (cellImage) {
        result.push(... [
          'separator',
          {
            name: 'Save image as',
            action: () => downloadImage(cellImage, cellImage.getAttribute('data-file-name'))
          },
          {
            name: 'Copy image',
            action: () => copyImageToClipboard(cellImage)
          },
        ])
      }

      result.push(... [
        'separator',
        'export'
      ]);

      return result;
    },
    async onGridReady(event: GridReadyEvent) {
      const initialColumnState = await getPreferredColumnState();
      if (initialColumnState) {
        event.columnApi.applyColumnState({
          state: initialColumnState,
          applyOrder: true
        });
      }
      gridLoadingEl.classList.add('hide');
      gridEl.classList.remove('hide');
    }
  };

  const grid: Grid = new Grid(gridEl, gridOptions);
  const columnApi: ColumnApi = gridOptions.columnApi;
  const gridApi: GridApi = gridOptions.api;
  const storeName: StoreNames<ExcelViewerDB> = `${SiteMode.storagePrefix}.ColumnState`;

  function getCurrentColumnState(): ColumnState[] {
    return columnApi.getColumnState();
  }

  async function getPreferredColumnState(): Promise<ColumnState[]> {
    return await invokeExcelViewerDB(db => {
      return db.get(storeName, excelFileName);
    });
  }

  async function savePreferredColumnState() {
    await invokeExcelViewerDB(db => {
      db.put(storeName, getCurrentColumnState(), excelFileName);
    });
  }

  (<any> window).grid = grid;
  (<any> window).gridApi = gridApi;
  (<any> window).columnApi = columnApi;
  (<any> window).getCurrentColumnState = getCurrentColumnState;
  (<any> window).getPreferredColumnState = getPreferredColumnState;
  (<any> window).savePreferredColumnState = savePreferredColumnState;

  let quickFilterDebounceId: any;

  listen([
    {
      selector: 'window',
      event: 'beforeunload',
      async handle()  {
        await savePreferredColumnState();
      }
    },
    {
      selector: '#excel-quick-filter',
      event: 'input',
      debounceId: 0,
      handle: (_evt, target: HTMLInputElement) => {
        if (quickFilterDebounceId) {
          clearTimeout(quickFilterDebounceId);
        }
        quickFilterDebounceId = setTimeout(() => {
          gridApi.setQuickFilter(target.value);
        }, 150);
      }
    },
    {
      selector: '#excel-export-csv',
      event: 'click',
      handle: () => {
        gridApi.exportDataAsCsv({
          fileName: excelFileName+'.csv'
        });
      }
    },
    {
      selector: '#excel-export-excel',
      event: 'click',
      handle: () => {
        gridApi.exportDataAsExcel({
          sheetName: excelFileName,
          fileName: excelFileName+'.xlsx',
          author: null
        });
      }
    },
    {
      selector: '#excel-export-json',
      event: 'click',
      handle: () => {
        downloadObjectAsJson(excelData, excelFileName + '.json', 2);
      }
    }
  ]);
});
