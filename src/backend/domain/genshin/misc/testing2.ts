import '../../../loadenv.ts';
import { getGenshinControl, loadGenshinVoiceItems } from '../genshinControl.ts';
import { pathToFileURL } from 'url';
import { closeKnex } from '../../../util/db.ts';
import { loadGenshinTextSupportingData } from '../genshinText.ts';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await loadGenshinVoiceItems();
  await loadGenshinTextSupportingData();

  const ctrl = getGenshinControl();

  const mats = await ctrl.selectAllMaterialExcelConfigData();

  for (let mat of mats) {
    if (!mat.NameText) {
      continue;
    }
    console.log(String(mat.Id).padEnd(10, ' '), mat.NameText.padEnd(80, ' '), (mat.TypeDescText || '').padEnd(50, ' '), mat.StackLimit || 'n/a');
  }

  await closeKnex();
}
