import '../../loadenv';
import { closeKnex } from '../../util/db';
import { Control, getControl, normText } from '../script_util';
import { NpcExcelConfigData } from '../../../shared/types/general-types';
import { getTextMapItem, loadEnglishTextMap } from '../textmap';
import util from 'util';
import { isInt } from '../../../shared/util/numberUtil';
import { DialogExcelConfigData, TalkExcelConfigData } from '../../../shared/types/dialogue-types';
import { trim } from '../../../shared/util/stringUtil';
import { DialogueSectionResult, TalkConfigAccumulator, talkConfigToDialogueSectionResult } from './dialogue_util';
import { MetaProp } from '../../util/metaProp';

const lc = (s: string) => s ? s.toLowerCase() : s;

function normNpcFilterInput(npcFilterInput: string): string {
  if (!npcFilterInput)
    return undefined;
  return lc(trim(normText(npcFilterInput), '()').trim());
}

const npcFilterInclude = (ctrl: Control, d: DialogExcelConfigData, npcFilter: string): boolean => {
  if (!d) {
    return false;
  }
  if (npcFilter === 'player' || npcFilter === 'traveler') {
    return d.TalkRole.Type === 'TALK_ROLE_PLAYER';
  }
  if (npcFilter === 'sibling') {
    return d.TalkRole.Type === 'TALK_ROLE_MATE_AVATAR';
  }
  let npcNameOutputLang = lc(trim(normText(d.TalkRoleNameText), '()'));
  let npcNameInputLang = lc(trim(normText(getTextMapItem(ctrl.inputLangCode, d.TalkRoleNameTextMapHash)), '()'));
  if (!npcFilter) {
    return true;
  }
  return npcNameOutputLang === npcFilter || npcNameInputLang === npcFilter;
};

export const DIALOGUE_GENERATE_MAX = 100;

export async function dialogueGenerate(ctrl: Control, query: number|number[]|string, npcFilter?: string): Promise<DialogueSectionResult[]> {
  let result: DialogueSectionResult[] = [];
  npcFilter = normNpcFilterInput(npcFilter);

  if (typeof query === 'string' && isInt(query)) {
    query = parseInt(query);
  }

  async function handle(id: number|DialogExcelConfigData): Promise<boolean> {
    if (!id) {
      return false;
    }
    if (typeof id === 'number') {
      const talkConfigResult = await talkConfigGenerate(ctrl, id, npcFilter);
      if (talkConfigResult) {
        result.push(talkConfigResult);
        return true;
      }
    }

    const dialogue = typeof id === 'number' ? await ctrl.selectSingleDialogExcelConfigData(id) : id;
    if (!dialogue) {
      throw 'No Talk or Dialogue found for ID: ' + id;
    }
    if (!npcFilterInclude(ctrl, dialogue, npcFilter)) {
      return false;
    }
    const talkConfig = await ctrl.selectTalkExcelConfigDataByFirstDialogueId(dialogue.Id);
    if (talkConfig) {
      const talkConfigResult = await talkConfigGenerate(ctrl, talkConfig, npcFilter);
      if (talkConfigResult) {
        result.push(talkConfigResult);
        return true;
      }
    } else {
      const dialogueBranch = await ctrl.selectDialogBranch(dialogue);
      const sect = new DialogueSectionResult('Dialogue_'+dialogue.Id, 'Dialogue');
      sect.originalData.dialogBranch = dialogueBranch;
      sect.metadata.push(new MetaProp('First Dialogue ID', dialogue.Id, `/branch-dialogue?q=${dialogue.Id}`));
      sect.wikitext = (await ctrl.generateDialogueWikiText(dialogueBranch)).trim();
      result.push(sect);
      return true;
    }
    return false;
  }

  if (typeof query === 'string') {
    // string
    let unexecutedPromises: (() => Promise<boolean>)[] = [];

    await ctrl.streamTextMapMatches(ctrl.inputLangCode, query.trim(), (textMapId: number, _text: string) => {
      unexecutedPromises.push(async () => {
        let dialogue = await ctrl.getDialogFromTextContentId(textMapId);
        return await handle(dialogue);
      });
    });

    let count = 0;
    for (let unexecutedPromise of unexecutedPromises) {
      let ret = await unexecutedPromise();
      if (ret) {
        count++;
      }
      if (count > DIALOGUE_GENERATE_MAX) {
        break;
      }
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

  npcFilter = normNpcFilterInput(npcFilter);
  if (!acc) acc = new TalkConfigAccumulator(ctrl);

  let talkConfig: TalkExcelConfigData = await acc.handleTalkConfig(initTalkConfig);
  if (!talkConfig || !npcFilterInclude(ctrl, talkConfig.Dialog[0], npcFilter)) {
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
      let sect = await talkConfigGenerate(ctrl, talkConfig, null, acc);
      if (sect) {
        res.dialogue.push(sect);
      }
    }

    let dialogOrphaned: DialogExcelConfigData[] = await ctrl.selectDialogExcelConfigDataByTalkRoleId(npc.Id);
    for (let dialogue of dialogOrphaned) {
      if (ctrl.isDialogExcelConfigDataCached(dialogue)) {
        continue;
      }
      ctrl.saveDialogExcelConfigDataToCache(dialogue);

      let dialogueBranch = await ctrl.selectDialogBranch(dialogue);
      const sect = new DialogueSectionResult('Dialogue_'+dialogue.Id, 'Dialogue');
      sect.originalData.dialogBranch = dialogueBranch;
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
    await loadEnglishTextMap();
    //console.log(await dialogueGenerate(`Uh, why are you two fighting?`));
    //console.log(await talkConfigGenerate(6906901));
    let res = await dialogueGenerateByNpc(getControl(), 'Arapratap');
    console.log(util.inspect(res, false, null, true));
    await closeKnex();
  })();
}