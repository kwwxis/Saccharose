import { grepIdStartsWith } from '../../../util/shellutil.ts';
import { RAW_MANUAL_TEXTMAP_ID_PROP } from '../../../importer/genshin/genshin.schema.ts';
import { pathToFileURL } from 'url';
import { GenshinControl, getGenshinControl } from '../genshinControl.ts';
import { defaultMap } from '../../../../shared/util/genericUtil.ts';
import { ManualTextMapConfigData } from '../../../../shared/types/genshin/dialogue-types.ts';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ctrl = getGenshinControl();
  const result = await getQuestOptionalSteps(ctrl);
  console.log(result);
}

async function getQuestOptionalSteps(ctrl: GenshinControl): Promise<Record<number, ManualTextMapConfigData[]>> {
  const mtmIds: string[] = await grepIdStartsWith<string>(RAW_MANUAL_TEXTMAP_ID_PROP, 'QUEST_ProgressGuide_',
    ctrl.getDataFilePath('./ExcelBinOutput/ManualTextMapConfigData.json'));

  const mtms: Record<string, ManualTextMapConfigData> = await ctrl.selectAllManualTextMapConfigDataByIds(mtmIds);

  const mapping: Record<number, ManualTextMapConfigData[]> = defaultMap('Array');

  for (let mtm of Object.values(mtms)) {
    let match = /^QUEST_ProgressGuide_(\d+)[a-zA-Z]*/.exec(mtm.TextMapId);
    if (match && match[1]) {
      const qid = match[1];
      mapping[qid].push(mtm);
    }
  }

  return mapping;
}
