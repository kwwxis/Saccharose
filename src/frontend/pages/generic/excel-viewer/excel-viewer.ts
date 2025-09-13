import { pageMatch } from '../../../core/pageMatch.ts';

import type {
  ColDef, ColGroupDef,
  ColumnState,
  GetContextMenuItemsParams,
  GridApi,
  GridOptions, GridReadyEvent,
  ICellRendererParams,
  MenuItemDef,
} from 'ag-grid-community';

import { camelCaseToTitleCase, escapeHtml, isString, isStringArray } from '../../../../shared/util/stringUtil.ts';
import { sort } from '../../../../shared/util/arrayUtil.ts';
import { listen } from '../../../util/eventListen.ts';
import {
  copyImageToClipboard,
  downloadImage,
  downloadObjectAsJson, frag1,
  getTextWidth, hasSelection, waitForElementCb,
} from '../../../util/domutil.ts';
import { isEmpty, isNotEmpty, isUnset } from '../../../../shared/util/genericUtil.ts';
import { booleanFilter } from './excel-custom-filters.ts';
import SiteModeInfo from '../../../core/userPreferences/siteModeInfo.ts';
import { ExcelViewerDB, invokeExcelViewerDB } from './excel-viewer-storage.ts';
import { StoreNames } from 'idb/build/entry';
import { highlightJson, highlightWikitext } from '../../../core/ace/aceHighlight.ts';
import { isNightmode, onSiteThemeChange } from '../../../core/userPreferences/siteTheme.ts';
import { toInt } from '../../../../shared/util/numberUtil.ts';
import { templateIcon } from '../../../util/templateIcons.ts';
import { doWithCreateGrid } from '../../../core/gridInterface/agGridInterface.ts';

function initializeThemeWatcher(elements: HTMLElement[]) {
  onSiteThemeChange(theme => {
    if (theme === 'nightmode') {
      for (let element of elements) {
        element.classList.remove('ag-theme-alpine');
        element.classList.add('ag-theme-alpine-dark');
      }
    } else {
      for (let element of elements) {
        element.classList.remove('ag-theme-alpine-dark');
        element.classList.add('ag-theme-alpine');
      }
    }
  });
}

export type SingleColumnDefOpts = {
  /**
   * Override any logic that may automatically hide a column and instead have it be initially shown.
   */
  defaultShown?: boolean
}

function determineInitialWidth(fieldName: string, data: any) {
  let initialWidth = typeof data === 'string' ? 200 : 100;
  let headerWidth = getTextWidth(camelCaseToTitleCase(fieldName), `bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif`);
  headerWidth += (18 * 2) + 16; // 18px left and right padding + filter icon width
  initialWidth = Math.max(initialWidth, headerWidth);
  return initialWidth;
}

export function makeSingleColumnDef(fieldKey: string, fieldName: string, data: any, opts: SingleColumnDefOpts = {}) {
  const colDef: ColDef = <ColDef> {
    // ID:
    colId: fieldKey,
    field: fieldKey,

    // Display Name:
    headerName: camelCaseToTitleCase(fieldName),
    headerTooltip: camelCaseToTitleCase(fieldName),

    // Filter:
    filter: typeof data === 'number' || typeof data === 'boolean' ? 'agNumberColumnFilter' : 'agTextColumnFilter',
    filterParams: typeof data === 'boolean' ? booleanFilter : undefined,
    floatingFilter: true,

    // Display:
    width: determineInitialWidth(fieldName, data),
    hide: opts.defaultShown ? false : (fieldName.includes('TextMapHash') || fieldName.endsWith('Hash')),
    cellClass: 'cell-type-' + (isUnset(data) ? 'null' : typeof data),

    // Default Formatter:
    valueFormatter: params => {
      if (isUnset(params.value)) {
        return '';
      }
      return typeof params.value === 'string' ? params.value : JSON.stringify(params.value, null, 2);
    }
  };

  const isStarRailImage = (datum: any) => typeof datum === 'string' && SiteModeInfo.isStarRail &&
    (datum.startsWith('SpriteOutput/') || datum.startsWith('UI/') || datum.endsWith('.png'));

  const isGenshinImage = (datum: any) => typeof datum === 'string' && SiteModeInfo.isGenshin && /^(ART\/.*\/)?(UI_|MonsterSkill_|Eff_).*$/.test(datum);

  const isWuwaImage = (datum: any) => typeof datum === 'string' && SiteModeInfo.isWuwa && datum.includes('UIResources');

  const dataType = {
    isStarRailImage: isStarRailImage(data) || (Array.isArray(data) && data.length && data.every(datum => isStarRailImage(datum))),
    isGenshinImage: isGenshinImage(data) || (Array.isArray(data) && data.length && data.every(datum => isGenshinImage(datum))),
    isWuwaImage: isWuwaImage(data) || (Array.isArray(data) && data.length && data.every(datum => isWuwaImage(datum))),
    isWikitext: typeof data === 'string' && (fieldName.includes('Text') || fieldName.includes('Name')
      || fieldName.includes('Title') || fieldName.includes('Desc') || fieldName.includes('Story')),
    isJson: typeof data === 'object',
    isEnum: typeof data === 'string' && data.toUpperCase() === data,
  };

  if (dataType.isGenshinImage || dataType.isStarRailImage || dataType.isWuwaImage) {
    colDef.cellRenderer = function(params: ICellRendererParams) {
      if (!params.value || !(isString(params.value) || isStringArray(params.value)))
        return '';

      const args = isStringArray(params.value) ? params.value : [params.value];
      let outHtml: string = '';

      for (let arg of args) {
        let fileName: string = arg;
        let srcValue: string;

        if (fileName.startsWith('/')) {
          fileName = fileName.slice(1);
        }
        if (fileName.endsWith('.png')) {
          fileName = fileName.slice(0, -4);
        }

        fileName = escapeHtml(fileName);

        if (dataType.isGenshinImage) {
          if (arg.includes('/')) {
            fileName = escapeHtml(arg.split('/').pop());
          }
          srcValue = `/images/genshin/${fileName}.png`;
        } else if (dataType.isStarRailImage) {
          srcValue = `/images/hsr/${fileName}.png`;
        } else if (dataType.isWuwaImage) {
          srcValue = `/images/wuwa/${fileName}.png`;
        }

        // noinspection HtmlDeprecatedAttribute
        outHtml += `<img class="excel-image" src="${srcValue}" loading="lazy" decoding="async"
          alt="Image not found" onerror="this.classList.add('excel-image-error')" data-file-name="${fileName}.png" />`;
      }

      if (isStringArray(params.value)) {
        return outHtml + highlightJson({ text: JSON.stringify(params.value) }).outerHTML;
      } else {
        return outHtml + `<span class="code">${escapeHtml(params.value)}</span>`;
      }
    };
  } else if (dataType.isWikitext) {
    colDef.cellRenderer = function(params: ICellRendererParams) {
      return !params.value ? '' : highlightWikitext({ text: String(params.value) }).outerHTML;
    };
  } else if (dataType.isJson) {
    colDef.cellRenderer = function(params: ICellRendererParams) {
      if (!params.value)
        return '';
      if (Array.isArray(params.value)) {
        params.value = params.value.filter(x => isNotEmpty(x));
        if (!params.value.length) {
          return '';
        }
      }
      return highlightJson({ text: JSON.stringify(params.value) }).outerHTML;
    };
  } else if (dataType.isEnum) {
    colDef.cellRenderer = function(params: ICellRendererParams) {
      return !params.value ? '' : `<code>${escapeHtml(params.value)}</code>`;
    };
  }

  return colDef;
}

function generateColDefs(excelData: any[]): (ColDef | ColGroupDef)[] {
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
          if (colDefForKey[fullKey] || !row[key][subKey] || isEmpty(row[key][subKey])) {
            continue;
          }
          colDefForKey[fullKey] = makeSingleColumnDef(fullKey, subKey, row[key][subKey]);
          (<ColGroupDef> colDefForKey[key]).children.push(colDefForKey[fullKey]);
        }
      } else {
        if (colDefForKey[key] || !row[key] || isEmpty(row[key])) {
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

function createExcelViewerHtml(fileName: string, includeExcelListButton: boolean, height: string) {
  console.log(document.getElementById('template-maximize-icon'));
  return frag1(`
  <div class="excel-viewer">
    <section class="excel-viewer-top card ag-theme-alpine${isNightmode() ? '-dark' : ''}">
      <h2 class="valign">
        <span>Excel Viewer &ndash; <strong>${escapeHtml(fileName)}</strong></span>
        <span class="grow"></span>
        ${includeExcelListButton ? `<a role="button" class="secondary small" href="${SiteModeInfo.home}/excel-viewer">Back to excel list</a>` : ''}
        <button class="excel-toggle-full-screen valign secondary spacer10-left">
          <span class="maximize-text spacer5-right">Enter Full Screen</span>
          <span class="minimize-text spacer5-right">Exit Full Screen</span>
          <span class="maximize-icon valign">${document.getElementById('template-maximize-icon').innerHTML}</span>
          <span class="minimize-icon valign">${document.getElementById('template-minimize-icon').innerHTML}</span>
        </button>
      </h2>
      <div class="content">
        <div class="valign justifySpaceBetween">
          <div class="excel-quick-filter-box valign">
            <label>Quick Filter:</label>
            <input class="excel-quick-filter" type="text" />
          </div>
          <div class="excel-export posRel">
            <button class="secondary border-light" ui-action="dropdown">
              <span class="spacer5-right">Export</span>
              ${templateIcon('chevron-down')}
            </button>
            <div class="ui-dropdown right">
              <div class="excel-export-csv option" ui-action="dropdown-item">As CSV</div>
              <div class="excel-export-excel option" ui-action="dropdown-item">As Excel</div>
              <div class="option-sep"></div>
              <div class="excel-export-json option" ui-action="dropdown-item">Original JSON</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  
    <div style="height: ${height}; width: 100%" class="excel-viewer-grid hide ag-theme-alpine${isNightmode() ? '-dark' : ''}">
    </div>
    <div class="excel-viewer-grid-loading card valign justifyCenter ag-theme-alpine${isNightmode() ? '-dark' : ''}" style="height: 80vh; width: 100%">
      <h1 class="valign justifyCenter">
        <span class="loading x36"></span>
        <span class="loading-label spacer15-left">Loading table...</span>
      </h1>
    </div>
  </div>
  `);
}

export type ExcelViewerOpts<T = any> = {
  height?: string,
  includeExcelListButton?: boolean,
  overrideColDefs?: (ColDef<T> | ColGroupDef<T>)[],
}

export async function initExcelViewer<T = any>(excelFileName: string,
                                excelData: T[],
                                appendTo: HTMLElement,
                                opts: ExcelViewerOpts<T> = {}) {
  const parentEl: HTMLElement = createExcelViewerHtml(excelFileName, opts.includeExcelListButton, opts.height || '80vh');
  if (appendTo) {
    appendTo.append(parentEl);
  }

  const topEl: HTMLElement = parentEl.querySelector('.excel-viewer-top');
  const gridEl: HTMLElement = parentEl.querySelector('.excel-viewer-grid');
  const gridLoadingEl: HTMLElement = parentEl.querySelector('.excel-viewer-grid-loading');

  initializeThemeWatcher([topEl, gridEl, gridLoadingEl]);

  const gridOptions: GridOptions = {
    columnDefs: opts.overrideColDefs || generateColDefs(excelData),
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
        event.api.applyColumnState({
          state: initialColumnState,
          applyOrder: true
        });
      }
      gridLoadingEl.classList.add('hide');
      gridEl.classList.remove('hide');
      document.body.addEventListener('keydown', e => {
        if (e.code === 'KeyC' && (e.ctrlKey || e.metaKey)) {
          if (hasSelection()) {
            return;
          }
          e.stopPropagation();
          e.stopImmediatePropagation();
          e.preventDefault();
          event.api.copySelectedRangeToClipboard();
        }
      });
      waitForElementCb(document.body, '.ag-center-cols-container', el => {
        document.body.addEventListener('mousedown', e => {
          if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) {
            return;
          }
          const el = (e.target as HTMLElement).closest('.ag-cell-value');
          if (!el) {
            return;
          }

          e.stopPropagation();
          e.stopImmediatePropagation();

          const colId: string = el.closest('[col-id]').getAttribute('col-id');
          const rowIndex: number = toInt(el.closest('[row-id]').getAttribute('row-index'));

          event.api.clearRangeSelection();
          event.api.clearFocusedCell();
          event.api.setFocusedCell(rowIndex, colId);
          event.api.addCellRange({
            rowStartIndex: rowIndex,
            rowEndIndex: rowIndex,
            columnStart: colId,
            columnEnd: colId
          });
        }, true);
      });
    }
  };

  const createGrid = await doWithCreateGrid();
  const gridApi: GridApi = createGrid(gridEl, gridOptions);
  const storeName: StoreNames<ExcelViewerDB> = `${SiteModeInfo.storagePrefix}.ColumnState`;
  let noAutoSave: boolean = false;

  function getCurrentColumnState(): ColumnState[] {
    return gridApi.getColumnState();
  }

  async function getPreferredColumnState(): Promise<ColumnState[]> {
    return await invokeExcelViewerDB(db => {
      return db.get(storeName, excelFileName);
    });
  }

  async function savePreferredColumnState() {
    if (noAutoSave) {
      return;
    }
    await invokeExcelViewerDB(db => {
      db.put(storeName, getCurrentColumnState(), excelFileName);
    });
  }

  async function resetPreferredColumnState() {
    noAutoSave = true;
    await invokeExcelViewerDB(db => {
      db.put(storeName, [], excelFileName);
    });
  }

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
      selector: '.excel-quick-filter',
      event: 'input',
      debounceId: 0,
      handle: (_evt, target: HTMLInputElement) => {
        if (quickFilterDebounceId) {
          clearTimeout(quickFilterDebounceId);
        }
        quickFilterDebounceId = setTimeout(() => {
          gridApi.setGridOption('quickFilterText', target.value);
        }, 150);
      }
    },
    {
      selector: '.excel-export-csv',
      event: 'click',
      handle: () => {
        gridApi.exportDataAsCsv({
          fileName: excelFileName+'.csv'
        });
      }
    },
    {
      selector: '.excel-export-excel',
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
      selector: '.excel-export-json',
      event: 'click',
      handle: () => {
        downloadObjectAsJson(excelData, excelFileName + '.json', 2);
      }
    },
    {
      selector: '.excel-toggle-full-screen',
      event: 'click',
      handle: () => {
        if (parentEl.classList.contains('full-screen')) {
          parentEl.classList.remove('full-screen');
          document.body.classList.remove('disable-scroll');
        } else {
          parentEl.classList.add('full-screen');
          document.body.classList.add('disable-scroll');
        }
      }
    }
  ], parentEl);

  return {
    parentEl,
    topEl,
    gridEl,
    gridLoadingEl,
    gridApi,
    getCurrentColumnState,
    getPreferredColumnState,
    savePreferredColumnState,
    resetPreferredColumnState,
  };
}

pageMatch('vue/ExcelViewerTablePage', async () => {
  const containerEl: HTMLElement = document.querySelector('#excelViewerContainer');

  if (!containerEl) {
    return;
  }

  // noinspection JSUnresolvedReference
  const excelData: any[] = (<any> window).excelData;

  // noinspection JSUnresolvedReference
  const excelFileName: string = (<any> window).excelFileName;

  const {
    parentEl,
    gridApi,
    getCurrentColumnState,
    getPreferredColumnState,
    savePreferredColumnState,
    resetPreferredColumnState,
  } = await initExcelViewer(excelFileName, excelData, containerEl, {
    includeExcelListButton: true
  });

  (<any> window).gridApi = gridApi;
  (<any> window).gridElement = parentEl;
  (<any> window).getCurrentColumnState = getCurrentColumnState;
  (<any> window).getPreferredColumnState = getPreferredColumnState;
  (<any> window).savePreferredColumnState = savePreferredColumnState;
  (<any> window).resetPreferredColumnState = resetPreferredColumnState;
});
