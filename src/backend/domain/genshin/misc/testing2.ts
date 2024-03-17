import '../../../loadenv.ts';
import { getGenshinControl, loadGenshinVoiceItems } from '../genshinControl.ts';
import { pathToFileURL } from 'url';
import { closeKnex } from '../../../util/db.ts';
import { loadGenshinTextSupportingData } from '../genshinText.ts';
import { sort } from '../../../../shared/util/arrayUtil.ts';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await loadGenshinVoiceItems();
  await loadGenshinTextSupportingData();

  const ctrl = getGenshinControl();

  const mats = await ctrl.selectAllMaterialExcelConfigData();
  const typesSet: Set<string> = new Set();

  for (let mat of mats) {
    if (!mat.NameText) {
      continue;
    }
    if (mat.TypeDescText)
      typesSet.add(mat.TypeDescText);
    //console.log(String(mat.Id).padEnd(10, ' '), mat.NameText.padEnd(80, ' '), (mat.TypeDescText || '').padEnd(50, ' '), mat.StackLimit || 'n/a');
  }

  const types: string[] = Array.from(typesSet);
  sort(types);

  for (let type of types) {
    console.log(`  '${type}': `.padEnd(50) + '' + `'${type}',`)
  }

  await closeKnex();
}
