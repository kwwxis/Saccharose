import { getStarRailDataFilePath } from '../../loadenv.ts';
import fs from 'fs';
import { importNormalize } from '../util/import_file_util.ts';

export async function starRailNormalize() {
  const textMapCN = getStarRailDataFilePath('./TextMap/TextMapCN.json');
  if (fs.existsSync(textMapCN)) {
    fs.renameSync(textMapCN, getStarRailDataFilePath('./TextMap/TextMapCHS.json'));
    console.log('Moved TextMapCN.json to TextMapCHS.json');
  }
  await importNormalize(getStarRailDataFilePath('./ExcelOutput'), [], 'hsr');
}
