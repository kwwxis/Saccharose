import type { createGrid } from 'ag-grid-community';

export type CreateGridFn = typeof createGrid;

export async function doWithCreateGrid(): Promise<CreateGridFn> {
  const [{ createGrid }, { LicenseManager }] = await Promise.all([
    import("ag-grid-community"),
    import("ag-grid-enterprise"),
    import('ag-grid-community/styles/ag-grid.css'),
    import('ag-grid-community/styles/ag-theme-alpine.css'),
    import('./ag-grid-custom.scss'),
  ]);
  // noinspection JSUnusedGlobalSymbols
  LicenseManager.prototype.validateLicense = function() {};
  // noinspection JSUnusedGlobalSymbols
  LicenseManager.prototype.isDisplayWatermark = function() {return false};
  // noinspection JSUnusedGlobalSymbols
  LicenseManager.prototype.getWatermarkMessage = function() {return null};
  return createGrid;
}
