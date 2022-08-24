import '../../setup';
import {closeKnex, openKnex} from '@db';
import { getControl } from '@/scripts/script_util';
import { getTextMapMatches } from '@/scripts/textMapFinder/text_map_finder';

export async function dialogueGenerate(firstDialogueId: number|number[]|string): Promise<{[id: number]: string}> {
  const knex = openKnex();
  const ctrl = getControl(knex);

  let result: {[id: number]: string} = {};

  if (typeof firstDialogueId === 'string') {
    const matches = await getTextMapMatches(firstDialogueId.trim());
    if (Object.keys(matches).length) {
      let dialogue = await ctrl.getDialogFromTextContentId(parseInt(Object.keys(matches)[0]));
      firstDialogueId = dialogue.Id;
    } else {
      throw 'Text Map record not found for: ' + firstDialogueId;
    }
  }

  if (typeof firstDialogueId === 'number') {
    const dialogue = await ctrl.selectDialogBranch(await ctrl.selectSingleDialogExcelConfigData(firstDialogueId));
    result[firstDialogueId] = '{{Dialogue start}}\n'+(await ctrl.generateDialogueWikiText(dialogue)).trim()+'\n{{Dialogue end}}';
  } else {
    for (let id of firstDialogueId) {
      const dialogue = await ctrl.selectDialogBranch(await ctrl.selectSingleDialogExcelConfigData(id));
      result[id] = '{{Dialogue start}}\n'+(await ctrl.generateDialogueWikiText(dialogue)).trim()+'\n{{Dialogue end}}';
    }
  }
  return result;
}

if (require.main === module) {
  (async () => {
    console.log(await dialogueGenerate(`Uh, why are you two fighting?`));
    closeKnex();
  })();
}