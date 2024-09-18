import { GenshinControl } from '../genshinControl.ts';
import { GCGTutorialTextExcelConfigData } from '../../../../shared/types/genshin/gcg-types.ts';
import { DialogueSectionResult } from '../../../util/dialogueSectionResult.ts';

export async function generateGCGTutorialDialogue(ctrl: GenshinControl): Promise<DialogueSectionResult> {
  return ctrl.cached('GCG:TutorialText:' + ctrl.outputLangCode, 'memory', async () => {
    let json: GCGTutorialTextExcelConfigData[] = await ctrl.readDataFile('./ExcelBinOutput/GCGTutorialTextExcelConfigData.json');

    let sect = new DialogueSectionResult(null, 'TCG Tutorial Text');
    sect.showGutter = true;

    for (let row of json) {
      let voPrefix = ctrl.voice.getVoPrefix('Card', row.TutorialTextId, null, null, false);
      sect.append({
        wikitext: `${voPrefix}${ctrl.normText(row.TutorialText, ctrl.outputLangCode)}`,
        ids: [
          {
            commonId: row.TutorialTextId,
            textMapHash: row.TutorialTextMapHash,
          }
        ]
      });
    }
    return sect;
  });
}
