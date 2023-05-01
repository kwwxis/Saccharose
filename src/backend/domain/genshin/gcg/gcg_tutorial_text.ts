import { GenshinControl } from '../genshinControl';
import { DialogueSectionResult } from '../dialogue/dialogue_util';
import { cached } from '../../../util/cache';
import { getVoPrefix } from '../genshinVoiceItems';
import { GCGTutorialTextExcelConfigData } from '../../../../shared/types/genshin/gcg-types';
import { normText } from '../genshinNormalizers';

export async function generateGCGTutorialDialogue(ctrl: GenshinControl): Promise<DialogueSectionResult> {
  return cached('GCGTutorialText_' + ctrl.outputLangCode, async () => {
    let json: GCGTutorialTextExcelConfigData[] = await ctrl.readGenshinDataFile('./ExcelBinOutput/GCGTutorialTextExcelConfigData.json');

    let sect = new DialogueSectionResult(null, 'TCG Tutorial Text');
    sect.showGutter = true;

    for (let row of json) {
      let voPrefix = getVoPrefix('Card', row.TutorialTextId, null, null, false);
      sect.wikitext += `${voPrefix}${normText(row.TutorialText, ctrl.outputLangCode)}\n`;
    }

    sect.wikitext = sect.wikitext.trim();

    return sect;
  });
}