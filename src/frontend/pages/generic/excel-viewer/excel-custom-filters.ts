import type { IFilterOptionDef, INumberFilterParams, ITextFilterParams } from 'ag-grid-community';
import { toRegExp } from '../../../../shared/util/stringUtil.ts';

export const booleanFilter: INumberFilterParams = {
  filterOptions: [
    {
      displayKey: 'none',
      displayName: 'Either',
      predicate: (_, cellValue) => true,
      numberOfInputs: 0,
    },
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
  maxNumConditions: 1,
}
export const textFilterExtension: ITextFilterParams = {
  defaultOption: 'contains',
  filterOptions: [
    'contains',
    'notContains',
    'equals',
    'notEqual',
    'startsWith',
    'endsWith',
    'blank',
    'notBlank',
    {
      displayKey: 'regex',
      displayName: 'Matches regex (CI)',
      predicate: (filterValues: any[], cellValue: any) => {
        if (!filterValues.length) {
          return false;
        }
        return regexMatch(filterValues, cellValue, true);
      },
      numberOfInputs: 1
    },
    {
      displayKey: 'notRegex',
      displayName: 'Does not match regex (CI)',
      predicate: (filterValues: any[], cellValue: any) => {
        if (!filterValues.length) {
          return false;
        }
        return !regexMatch(filterValues, cellValue, true);
      },
      numberOfInputs: 1
    },
    {
      displayKey: 'regexCS',
      displayName: 'Matches regex (CS)',
      predicate: (filterValues: any[], cellValue: any) => {
        if (!filterValues.length) {
          return false;
        }
        return regexMatch(filterValues, cellValue, false);
      },
      numberOfInputs: 1
    },
    {
      displayKey: 'notRegexCS',
      displayName: 'Does not match regex (CS)',
      predicate: (filterValues: any[], cellValue: any) => {
        if (!filterValues.length) {
          return false;
        }
        return !regexMatch(filterValues, cellValue, false);
      },
      numberOfInputs: 1
    }
  ],
  maxNumConditions: 3
}


function regexMatch(filterValues: any[], cellValue: any, forceCaseInsensitive: boolean) {
  let regex: RegExp = toRegExp(filterValues[0]);
  if (forceCaseInsensitive && !regex.flags.includes('i')) {
    regex = new RegExp(regex.source, regex.flags + 'i');
  }
  return regex.test(cellValue);
}
