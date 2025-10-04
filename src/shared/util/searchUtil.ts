import { escapeRegExp } from './stringUtil.ts';
import { walkObject } from './arrayUtil.ts';
import { Marker } from './highlightMarker.ts';

export type ExcelUsages = { [fileName: string]: ExcelUsagesItem[] };
export type ExcelUsagesItem = {
  field: string,
  originalField: string,
  refIndex: number,
  refObject: any,
  refObjectStringified: string,
  refObjectMarkers: Marker[],
};
export type ScalarToExcelUsages = {[scalar: number|string]: ExcelUsages};

export type SearchMode = 'W' | 'WI' | 'C' | 'CI' | 'R' | 'RI';
export const SEARCH_MODES: SearchMode[] = ['W', 'WI', 'C', 'CI', 'R', 'RI'];
export const DEFAULT_SEARCH_MODE: SearchMode = 'WI';

export function simpleSeqSearch<T>(array: T[], searchText: string, searchMode: SearchMode, fieldFilter: RegExp = /Text$|Id$/): T[] {
  if (searchMode === 'CI') {
    searchText = searchText.toLowerCase();
  }

  let searchTextRegex: RegExp;

  switch (searchMode) {
    case 'W':
      searchTextRegex = new RegExp('\\b' + escapeRegExp(searchText) + '\\b');
      break;
    case 'WI':
      searchTextRegex = new RegExp('\\b' + escapeRegExp(searchText) + '\\b', 'i');
      break;
    case 'R':
      searchTextRegex = new RegExp(searchText);
      break;
    case 'RI':
      searchTextRegex = new RegExp(searchText, 'i');
      break;
  }

  const testVal = (val: any): boolean => {
    if (typeof val !== 'string')
      val = String(val);
    switch (searchMode) {
      case 'W':
        return searchTextRegex.test(val);
      case 'WI':
        return searchTextRegex.test(val);
      case 'C':
        return val.includes(searchText);
      case 'CI':
        return val.toLowerCase().includes(searchText);
      case 'R':
        return searchTextRegex.test(val);
      case 'RI':
        return searchTextRegex.test(val);
    }
  };

  const out: T[] = [];
  for (let item of array) {
    if (!item) {
      continue;
    }
    walkObject(item, field => {
      if (fieldFilter && !fieldFilter.test(field.basename)) {
        return;
      }
      if (testVal(field.value)) {
        out.push(item);
      }
    });
  }
  return out;
}
