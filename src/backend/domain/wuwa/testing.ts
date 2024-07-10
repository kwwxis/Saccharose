import { pathToFileURL } from 'url';
import { getWuwaControl } from './wuwaControl.ts';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ctrl = getWuwaControl();
  ctrl.getExcelFileNames();
}
