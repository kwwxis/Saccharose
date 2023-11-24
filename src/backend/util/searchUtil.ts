import { escapeRegExp } from '../../shared/util/stringUtil';

export type IdUsages = { [fileName: string]: IdUsagesItem[] };
export type IdUsagesItem = { field: string, originalField: string, lineNumber: number, refObject?: any };
export type SearchMode = 'W' | 'WI' | 'C' | 'CI' | 'R' | 'RI';
export const SEARCH_MODES: SearchMode[] = ['W', 'WI', 'C', 'CI', 'R', 'RI'];
export const DEFAULT_SEARCH_MODE: SearchMode = 'WI';

export function simpleSeqSearch<T>(array: T[], searchText: string, searchMode: SearchMode, fieldFilter: RegExp = /Text$|Id$/): T[] {
  const testVal = (val: any): boolean => {
    if (typeof val !== 'string')
      val = String(val);
    if (typeof val === 'string') {
      switch (searchMode) {
        case 'W':
          return new RegExp('\\b' + escapeRegExp(searchText) + '\\b').test(val);
        case 'WI':
          return new RegExp('\\b' + escapeRegExp(searchText) + '\\b', 'i').test(val);
        case 'C':
          return val.includes(searchText);
        case 'CI':
          return val.toLowerCase().includes(searchText.toLowerCase());
        case 'R':
          return new RegExp(searchText).test(val);
        case 'RI':
          return new RegExp(searchText, 'i').test(val);
      }
    }
    return false;
  };
  const out = [];
  for (let item of array) {
    if (!item) {
      continue;
    }
    if (typeof item !== 'object') {
      if (testVal(item)) {
        out.push(item);
      }
    } else {
      for (let [field, val] of Object.entries(item)) {
        if (fieldFilter && !fieldFilter.test(field)) {
          continue;
        }
        if (testVal(val)) {
          out.push(item);
          break;
        }
      }
    }
  }
  return out;
}