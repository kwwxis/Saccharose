import type { IFilterOptionDef, INumberFilterParams } from 'ag-grid-community';

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
