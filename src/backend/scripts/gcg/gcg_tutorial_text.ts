import { Control, normText } from '../script_util';
import { DialogueSectionResult } from '../dialogue/dialogue_util';
import { cached } from '../../util/cache';
import { getVoPrefix } from '../textmap';
import { GCGTutorialTextExcelConfigData } from '../../../shared/types/gcg-types';

export async function generateGCGTutorialDialogue(ctrl: Control): Promise<DialogueSectionResult> {
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