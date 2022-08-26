import '../../setup';
import {closeKnex} from '@db';
import { Control } from '@/scripts/script_util';
import { DialogExcelConfigData, TalkExcelConfigData } from '@types';
import { DialogueSectionResult, TalkConfigAccumulator, talkConfigToDialogueSectionResult } from './quest_generator';
import { isInt } from '@functions';

export async function dialogueGenerate(ctrl: Control, query: number|number[]|string): Promise<DialogueSectionResult[]> {
  let result: DialogueSectionResult[] = [];

  if (typeof query === 'string' && isInt(query)) {
    query = parseInt(query);
  }

  async function handle(id: number|DialogExcelConfigData) {
    if (typeof id === 'number') {
      const talkConfigResult = await talkConfigGenerate(ctrl, id);
      if (talkConfigResult) {
        result.push(talkConfigResult);
        return;
      }
    }

    const dialogue = typeof id === 'number' ? await ctrl.selectSingleDialogExcelConfigData(id) : id;
    const talkConfig = await ctrl.selectTalkExcelConfigByFirstDialogueId(dialogue.Id);
    if (talkConfig) {
      result.push(await talkConfigGenerate(ctrl, talkConfig));
    } else {
      const dialogueBranch = await ctrl.selectDialogBranch(dialogue);
      const sect = new DialogueSectionResult('Dialogue_'+dialogue.Id, 'Dialogue');
      sect.metatext = 'First Dialogue ID: ' + dialogue.Id;
      sect.wikitext=  '{{Dialogue start}}\n'+(await ctrl.generateDialogueWikiText(dialogueBranch)).trim()+'\n{{Dialogue end}}'
      result.push(sect);
    }
  }

  if (typeof query === 'string') {
    // string
    const matches = await ctrl.getTextMapMatches(ctrl.inputLangCode, query.trim());
    if (Object.keys(matches).length) {
      let dialogues = await Promise.all(
        Object.keys(matches).map(textMapId => parseInt(textMapId)).map(textMapId => ctrl.getDialogFromTextContentId(textMapId))
      );
      for (let dialogue of dialogues) {
        await handle(dialogue);
      }
    } else {
      throw 'Text Map record not found for: ' + query;
    }
  } else if (typeof query === 'number') {
    // number
    await handle(query);
  } else {
    // number[]
    for (let id of query) {
      await handle(id);
    }
  }

  return result;
}

export async function talkConfigGenerate(ctrl: Control, talkConfigId: number|TalkExcelConfigData): Promise<DialogueSectionResult> {
  let initTalkConfig = typeof talkConfigId === 'number' ? await ctrl.selectTalkExcelConfigDataByQuestSubId(talkConfigId) : talkConfigId;

  if (!initTalkConfig) {
    return undefined;
  }

  let talkConfig: TalkExcelConfigData =  await (new TalkConfigAccumulator(ctrl)).handleTalkConfig(initTalkConfig);
  return await talkConfigToDialogueSectionResult(ctrl, null, 'Talk Dialogue', null, talkConfig);
}

if (require.main === module) {
  (async () => {
    //console.log(await dialogueGenerate(`Uh, why are you two fighting?`));
    //console.log(await talkConfigGenerate(6906901));
    closeKnex();
  })();
}