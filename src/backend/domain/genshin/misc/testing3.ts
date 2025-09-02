import { pathToFileURL } from 'url';
import fs from 'fs';
import path from 'path';
import { getGenshinControl } from '../genshinControl.ts';
import { genshinSchema } from '../../../importer/genshin/genshin.schema.ts';
import { TalkExcelConfigData } from '../../../../shared/types/genshin/dialogue-types.ts';
import { GenshinVersions } from '../../../../shared/types/game-versions.ts';
import { getGenshinDataFilePath } from '../../../loadenv.ts';
import { closeKnex } from '../../../util/db.ts';
import { loadGenshinTextSupportingData } from '../genshinText.ts';

function* walkSync(dir: string): Generator<string> {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      yield* walkSync(path.join(dir, file.name));
    } else {
      yield path.join(dir, file.name);
    }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await loadGenshinTextSupportingData();
  const ctrl = getGenshinControl();


  // const file = await ctrl.loadInterActionFile(705210129);
  // console.log(file.Name);
  //
  // console.log(file.findDialog(705210129).prev());
  // console.log(file.findDialog(705210126).prev());
  // console.log(file.findDialog(705210128).prev());

  // const file = await ctrl.loadInterActionFile(1900301201);
  // console.log(file.findDialog(1900301201).prev());

  // let refs = await ctrl.selectChangeRecord(362316, 'HomeWorldFurnitureExcelConfigData');
  // console.log(refs);
  //
  // console.log('F');
  //
  // refs = await ctrl.selectChangeRecord(362316, 'HomeWorldFurnitureExcelConfigData');
  // console.log(refs);

  // console.log(Object.keys(genshinSchema).filter(k => !k.startsWith('Relation_') && !k.startsWith('TextMap') && !k.startsWith('PlainLineMap')).join('\n'))

  // const talks: TalkExcelConfigData[] = await ctrl.readExcelDataFile('TalkExcelConfigData.json');
  // const d2f = await ctrl.fetchInterActionD2F();
  //
  // console.log('All Count:', talks.length);
  // console.log('Perform Count:', talks.filter(t => !!t.PerformCfg).length);
  // console.log(talks.filter(t => !!t.PerformCfg && !t.PerformCfg.startsWith('QuestDialogue')));

  let textmapChangelog = await ctrl.textMapChangelog.selectFullChangelog('5.8');

  for (let key of Object.keys(textmapChangelog['EN'].added)) {
    textmapChangelog['EN'].added[key] = ctrl.normText(textmapChangelog['EN'].added[key], 'EN');
  }
  for (let key of Object.keys(textmapChangelog['EN'].updated)) {
    textmapChangelog['EN'].updated[key].newValue = ctrl.normText(textmapChangelog['EN'].updated[key].newValue, 'EN');
    textmapChangelog['EN'].updated[key].oldValue = ctrl.normText(textmapChangelog['EN'].updated[key].oldValue, 'EN');
  }
  for (let key of Object.keys(textmapChangelog['EN'].removed)) {
    textmapChangelog['EN'].removed[key] = ctrl.normText(textmapChangelog['EN'].removed[key], 'EN');
  }

  fs.writeFileSync(getGenshinDataFilePath(`./TextMapEN_Added.json`),
    JSON.stringify(textmapChangelog['EN'].added, null, 2), 'utf8');

  fs.writeFileSync(getGenshinDataFilePath(`./TextMapEN_Updated.json`),
    JSON.stringify(textmapChangelog['EN'].updated, null, 2), 'utf8');

  fs.writeFileSync(getGenshinDataFilePath(`./TextMapEN_Removed.json`),
    JSON.stringify(textmapChangelog['EN'].removed, null, 2), 'utf8');

  await closeKnex();
}
