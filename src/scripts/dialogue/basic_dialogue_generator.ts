import '../../setup';
import { closeKnex } from '@db';
import { Control } from '@/scripts/script_util';
import { DialogExcelConfigData, TalkExcelConfigData } from '@types';
import { DialogueSectionResult, TalkConfigAccumulator, talkConfigToDialogueSectionResult } from './quest_generator';
import { isInt } from '@functions';

const lc = (s: string) => s ? s.toLowerCase() : s;

const npcFilterExclude = (d: DialogExcelConfigData, npcFilter: string) => {
  if (npcFilter === 'player' || npcFilter === 'traveler') {
    return d.TalkRole.Type !== 'TALK_ROLE_PLAYER';
  }
  if (npcFilter === 'sibling') {
    return d.TalkRole.Type !== 'TALK_ROLE_MATE_AVATAR';
  }
  return npcFilter && !(lc(d.TalkRoleNameText) === npcFilter || lc(d.TalkRole.NameText) === npcFilter);
};

export async function dialogueGenerate(ctrl: Control, query: number|number[]|string, npcFilter?: string): Promise<DialogueSectionResult[]> {
  let result: DialogueSectionResult[] = [];

  if (npcFilter) npcFilter = npcFilter.trim().toLowerCase();
  if (!npcFilter) npcFilter = undefined;

  if (typeof query === 'string' && isInt(query)) {
    query = parseInt(query);
  }

  async function handle(id: number|DialogExcelConfigData) {
    if (typeof id === 'number') {
      const talkConfigResult = await talkConfigGenerate(ctrl, id, npcFilter);
      if (talkConfigResult) {
        result.push(talkConfigResult);
        return;
      }
    }

    const dialogue = typeof id === 'number' ? await ctrl.selectSingleDialogExcelConfigData(id) : id;
    if (!dialogue) {
      throw 'Dialogue not found for ID: ' + id;
    }
    if (npcFilterExclude(dialogue, npcFilter)) {
      return undefined;
    }
    const talkConfig = await ctrl.selectTalkExcelConfigByFirstDialogueId(dialogue.Id);
    if (talkConfig) {
      const talkConfigResult = await talkConfigGenerate(ctrl, talkConfig, npcFilter);
      if (talkConfigResult) {
        result.push(talkConfigResult);
      }
    } else {
      const dialogueBranch = await ctrl.selectDialogBranch(dialogue);
      const sect = new DialogueSectionResult('Dialogue_'+dialogue.Id, 'Dialogue');
      sect.metatext = 'First Dialogue ID: ' + dialogue.Id;
      sect.wikitext = (await ctrl.generateDialogueWikiText(dialogueBranch)).trim();
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
        if (!dialogue)
          continue;
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

export async function talkConfigGenerate(ctrl: Control, talkConfigId: number|TalkExcelConfigData, npcFilter?: string): Promise<DialogueSectionResult> {
  let initTalkConfig = typeof talkConfigId === 'number' ? await ctrl.selectTalkExcelConfigDataByQuestSubId(talkConfigId) : talkConfigId;

  if (!initTalkConfig) {
    return undefined;
  }

  if (npcFilter) npcFilter = npcFilter.trim().toLowerCase();
  if (!npcFilter) npcFilter = undefined;

  let talkConfig: TalkExcelConfigData =  await (new TalkConfigAccumulator(ctrl)).handleTalkConfig(initTalkConfig);
  if (npcFilterExclude(talkConfig.Dialog[0], npcFilter)) {
    return undefined;
  }
  return await talkConfigToDialogueSectionResult(ctrl, null, 'Talk Dialogue', null, talkConfig);
}

if (require.main === module) {
  (async () => {
    //console.log(await dialogueGenerate(`Uh, why are you two fighting?`));
    //console.log(await talkConfigGenerate(6906901));
    closeKnex();
  })();
}