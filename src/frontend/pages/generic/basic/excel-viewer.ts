import { pageMatch } from '../../../pageMatch';

import { ColDef, Grid, GridOptions, IFilterOptionDef, INumberFilterParams } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import './ag-grid-custom.scss';

import { camelCaseToTitleCase } from '../../../../shared/util/stringUtil';
import { ColGroupDef } from 'ag-grid-community/dist/lib/entities/colDef';
import { sort } from '../../../../shared/util/arrayUtil';
import { startListeners } from '../../../util/eventLoader';

const booleanFilter: INumberFilterParams = {
  filterOptions: [
    {
      displayKey: 'true',
      displayName: 'True',
      predicate: (_, cellValue) => +cellValue === 1,
      numberOfInputs: 0,
    },
    {
      displayKey: 'false',
      displayName: 'False',
      predicate: (_, cellValue) => +cellValue === 0,
      numberOfInputs: 0,
    }
  ] as IFilterOptionDef[],
  suppressAndOrCondition: true,
};

pageMatch('pages/generic/basic/excel-viewer-table', () => {
  const gridEl: HTMLElement = document.querySelector('#excelViewerGrid');

  if (!gridEl) {
    return;
  }

  let excelData: any[] = (<any> window).excelData;

  const remapExcelData = (row: any): any => {
    for (let key of Object.keys(row)) {
      let value = row[key];
      if (value && typeof value === 'object') {
        row[key] = JSON.stringify(row[key]);
      }
    }
    return row;
  };

  excelData = excelData.map(remapExcelData);

  const gridOptions: GridOptions = {
    columnDefs: [],
    rowData: excelData,
    defaultColDef: {
      resizable: true,
      sortable: true,
      wrapText: true,
      autoHeight: true,
      autoHeaderHeight: true,
      wrapHeaderText: true,
    },
    enableCellTextSelection: true,
    ensureDomOrder: true,
  };

  function getColumnDefs(): (ColDef | ColGroupDef)[] {
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

        if (colDefForKey[key]) {
          continue;
        }

        if (row[key] && typeof row[key] === 'object' && !Array.isArray(row[key])) {
          colDefForKey[key] = <ColGroupDef> {
            headerName: camelCaseToTitleCase(key),
            children: Object.keys(row[key]).map(subKey => ({
              headerName: camelCaseToTitleCase(subKey),
              headerTooltip: camelCaseToTitleCase(subKey),
              field: `${key}.${subKey}`,
              filter: typeof row[key][subKey] === 'number' || typeof row[key][subKey] === 'boolean' ? 'agNumberColumnFilter' : 'agTextColumnFilter',
              filterParams: typeof row[key][subKey] === 'boolean' ? booleanFilter : undefined,
              width: typeof row[key][subKey] === 'string' ? 200 : 100,
              hide: subKey.includes('TextMapHash') || subKey.endsWith('Hash'),
            }))
          };
        } else {
          colDefForKey[key] = <ColDef> {
            headerName: camelCaseToTitleCase(key),
            headerTooltip: camelCaseToTitleCase(key),
            field: key,
            filter: typeof row[key] === 'number' || typeof row[key] === 'boolean' ? 'agNumberColumnFilter' : 'agTextColumnFilter',
            filterParams: typeof row[key] === 'boolean' ? booleanFilter : undefined,
            spanHeaderHeight: true,
            width: typeof row[key] === 'string' ? 200 : 100,
            hide: key.includes('TextMapHash') || key.endsWith('Hash'),
          };
        }

        columnDefs.push(colDefForKey[key]);
      }
    }
    console.log('Unique Keys:', uniqueKeys);
    sort(columnDefs,  (a, b): number => {
      if (a.headerName === 'ID') {
        return -1;
      }
      if (b.headerName === 'ID') {
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
      return a.headerName.localeCompare(b.headerName);
    });
    return columnDefs;
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

  gridOptions.columnDefs = getColumnDefs();

  new Grid(gridEl, gridOptions);
  const api = gridOptions.api;

  startListeners([
    {
      el: '[data-grid-toggle="text-map-hash"]',
      ev: 'click',
      fn: (evt, target) => {
        const columnDefs = getColumnDefs();

        if (target.classList.contains('active')) {
          target.classList.remove('active');
          walkColumnDefs(columnDefs, colDef => colDef.hide = colDef.field.includes('TextMapHash') || colDef.field.endsWith('Hash'));
        } else {
          target.classList.add('active');
          walkColumnDefs(columnDefs, colDef => colDef.hide = false);
        }

        console.log('yooooo');
        api.setColumnDefs(columnDefs);
      }
    }
  ]);
});