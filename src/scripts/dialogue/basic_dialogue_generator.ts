import '../../setup';
import { closeKnex } from '@db';
import { Control, getControl } from '@/scripts/script_util';
import { DialogExcelConfigData, NpcExcelConfigData, TalkExcelConfigData } from '@types';
import { DialogueSectionResult, MetaProp, TalkConfigAccumulator, talkConfigToDialogueSectionResult } from './quest_generator';
import { isInt } from '@functions';
import { loadTextMaps } from '../textmap';
import util from 'util';

const lc = (s: string) => s ? s.toLowerCase() : s;

const npcFilterExclude = (d: DialogExcelConfigData, npcFilter: string): boolean => {
  if (!d) {
    return true;
  }
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
      throw 'No Talk or Dialogue found or ID: ' + id;
    }
    if (npcFilterExclude(dialogue, npcFilter)) {
      return undefined;
    }
    const talkConfig = await ctrl.selectTalkExcelConfigDataByFirstDialogueId(dialogue.Id);
    if (talkConfig) {
      const talkConfigResult = await talkConfigGenerate(ctrl, talkConfig, npcFilter);
      if (talkConfigResult) {
        result.push(talkConfigResult);
      }
    } else {
      const dialogueBranch = await ctrl.selectDialogBranch(dialogue);
      const sect = new DialogueSectionResult('Dialogue_'+dialogue.Id, 'Dialogue');
      sect.metadata.push(new MetaProp('First Dialogue ID', dialogue.Id, `/branch-dialogue?q=${dialogue.Id}`));
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

export async function talkConfigGenerate(ctrl: Control, talkConfigId: number|TalkExcelConfigData, npcFilter?: string, acc?: TalkConfigAccumulator): Promise<DialogueSectionResult> {
  let initTalkConfig = typeof talkConfigId === 'number' ? await ctrl.selectTalkExcelConfigDataByQuestSubId(talkConfigId) : talkConfigId;

  if (!initTalkConfig) {
    return undefined;
  }

  if (npcFilter) npcFilter = npcFilter.trim().toLowerCase();
  if (!npcFilter) npcFilter = undefined;
  if (!acc) acc = new TalkConfigAccumulator(ctrl);

  let talkConfig: TalkExcelConfigData = await acc.handleTalkConfig(initTalkConfig);
  if (!talkConfig || npcFilterExclude(talkConfig.Dialog[0], npcFilter)) {
    return undefined;
  }
  return await talkConfigToDialogueSectionResult(ctrl, null, 'Talk Dialogue', null, talkConfig);
}

export type NpcDialogueResultMap = {[npcId: number]: NpcDialogueResult};
export class NpcDialogueResult {
  npcId: number;
  npc: NpcExcelConfigData;
  talkConfigs: TalkExcelConfigData[];
  dialogue: DialogueSectionResult[];
  orphanedDialogue: DialogueSectionResult[];
}

export async function dialogueGenerateByNpc(ctrl: Control, npcNameOrId: string|number, acc?: TalkConfigAccumulator): Promise<NpcDialogueResultMap> {
  if (!acc) acc = new TalkConfigAccumulator(ctrl);

  if (typeof npcNameOrId === 'string' && isInt(npcNameOrId)) {
    npcNameOrId = parseInt(npcNameOrId);
  }

  let npcList = [];
  if (typeof npcNameOrId === 'string') {
    npcList = await ctrl.selectNpcListByName(npcNameOrId);
  } else {
    let npc = await ctrl.getNpc(npcNameOrId);
    if (!!npc) {
      npcList.push(npc);
    }
  }

  let resultMap: NpcDialogueResultMap = {};

  for (let npc of npcList) {
    let res = new NpcDialogueResult();
    res.npcId = npc.Id;
    res.npc = npc;

    res.talkConfigs = await ctrl.selectTalkExcelConfigDataByNpcId(npc.Id);
    res.dialogue = [];
    res.orphanedDialogue = [];

    for (let talkConfig of res.talkConfigs) {
      let dres = await talkConfigGenerate(ctrl, talkConfig, null, acc);
      if (dres) {
        res.dialogue.push(dres);
      }
    }

    let dialogOrphaned: DialogExcelConfigData[] = await ctrl.selectDialogExcelConfigDataByTalkRoleId(npc.Id);
    for (let dialogue of dialogOrphaned) {
      if (ctrl.isDialogExcelConfigDataCached(dialogue))
        continue;
      ctrl.saveDialogExcelConfigDataToCache(dialogue);

      let dialogueBranch = await ctrl.selectDialogBranch(dialogue);
      const sect = new DialogueSectionResult('Dialogue_'+dialogue.Id, 'Dialogue');
      sect.metadata.push(new MetaProp('First Dialogue ID', dialogue.Id, `/branch-dialogue?q=${dialogue.Id}`));
      sect.wikitext = (await ctrl.generateDialogueWikiText(dialogueBranch)).trim();
      res.orphanedDialogue.push(sect);
    }

    resultMap[npc.Id] = res;
  }

  return resultMap;
}

if (require.main === module) {
  (async () => {
    await loadTextMaps();
    //console.log(await dialogueGenerate(`Uh, why are you two fighting?`));
    //console.log(await talkConfigGenerate(6906901));
    let res = await dialogueGenerateByNpc(getControl(), 'Arapratap');
    console.log(util.inspect(res, false, null, true));
    closeKnex();
  })();
}