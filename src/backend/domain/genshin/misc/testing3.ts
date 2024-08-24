import { pathToFileURL } from 'url';
import fs from 'fs';
import path from 'path';
import { getGenshinControl } from '../genshinControl.ts';
import { genshinSchema } from '../../../importer/genshin/genshin.schema.ts';
import { TalkExcelConfigData } from '../../../../shared/types/genshin/dialogue-types.ts';

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

  const talks: TalkExcelConfigData[] = await ctrl.readExcelDataFile('TalkExcelConfigData.json');
  const d2f = await ctrl.fetchInterActionD2F();

  console.log('All Count:', talks.length);
  console.log('Perform Count:', talks.filter(t => !!t.PerformCfg).length);
  console.log(talks.filter(t => !!t.PerformCfg && !t.PerformCfg.startsWith('QuestDialogue')));
}
