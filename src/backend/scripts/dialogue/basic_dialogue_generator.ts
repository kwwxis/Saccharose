import '../../loadenv';
import { closeKnex } from '../../util/db';
import { Control, getControl, normText } from '../script_util';
import { NpcExcelConfigData } from '../../../shared/types/general-types';
import { getTextMapItem, loadEnglishTextMap } from '../textmap';
import util from 'util';
import { isInt } from '../../../shared/util/numberUtil';
import { DialogExcelConfigData, TalkExcelConfigData } from '../../../shared/types/dialogue-types';
import { escapeRegExp, trim } from '../../../shared/util/stringUtil';
import {
  DialogueSectionResult, dialogueToQuestId,
  TalkConfigAccumulator,
  talkConfigToDialogueSectionResult,
  traceBack,
} from './dialogue_util';
import { MetaProp } from '../../util/metaProp';
import { pathToFileURL } from 'url';
import { Marker } from '../../../shared/util/highlightMarker';

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

  ctrl.state.DisableNpcCache = true;

  function addHighlightMarkers(dialogue: DialogExcelConfigData, sect: DialogueSectionResult) {
    let re: RegExp;
    let reFlags: string = ctrl.searchModeFlags.includes('i') ? 'gi' : 'g';
    if (typeof query === 'string') {
      re = new RegExp(escapeRegExp(normText(query, ctrl.outputLangCode)), reFlags);
    } else {
      re = new RegExp(escapeRegExp(normText(dialogue.TalkContentText, ctrl.outputLangCode)), reFlags);
    }
    for (let marker of Marker.create(re, sect.wikitext)) {
      sect.wikitextMarkers.push(marker);
    }
  }

  const seenTalkConfigIds: Set<number> = new Set();
  const seenFirstDialogueIds: Set<number> = new Set();

  async function handle(id: number|DialogExcelConfigData): Promise<boolean> {
    if (!id) {
      return false;
    }
    if (typeof id === 'number') {
      if (seenTalkConfigIds.has(id) || seenFirstDialogueIds.has(id)) {
        return false;
      }
      const talkConfigResult = await talkConfigGenerate(ctrl, id);
      if (talkConfigResult) {
        result.push(talkConfigResult);
        return true;
      }
    }

    const dialogue: DialogExcelConfigData = typeof id === 'number' ? await ctrl.selectSingleDialogExcelConfigData(id) : id;
    if (!dialogue) {
      throw 'No Talk or Dialogue found for ID: ' + id;
    }
    if (!npcFilterInclude(ctrl, dialogue, npcFilter)) {
      return false;
    }
    let talkConfigs: TalkExcelConfigData[] = await ctrl.selectTalkExcelConfigDataListByFirstDialogueId(dialogue.Id);
    let firstDialogs: DialogExcelConfigData[] = null;
    if (!talkConfigs.length) {
      firstDialogs = await traceBack(ctrl, dialogue);
      for (let d of firstDialogs) {
        talkConfigs.push(... await ctrl.selectTalkExcelConfigDataListByFirstDialogueId(d.Id));
      }
    }
    if (talkConfigs.length) {
      let foundTalks: boolean = false;
      for (let talkConfig of talkConfigs) {
        if (seenTalkConfigIds.has(talkConfig.Id)) {
          continue;
        } else {
          seenTalkConfigIds.add(talkConfig.Id);
        }
        const talkConfigResult = await talkConfigGenerate(ctrl, talkConfig);
        if (talkConfigResult) {
          talkConfigResult.metadata.push(new MetaProp('First Dialogue ID', talkConfig.InitDialog));
          talkConfigResult.metadata.push(new MetaProp('First Match Dialogue ID', dialogue.Id));
          addHighlightMarkers(dialogue, talkConfigResult);
          result.push(talkConfigResult);
          foundTalks = true;
        }
      }
      if (foundTalks) {
        return true;
      }
    } else {
      let foundDialogs: boolean = false;
      if (!firstDialogs) {
        firstDialogs = await traceBack(ctrl, dialogue);
      }
      for (let firstDialog of firstDialogs) {
        if (seenFirstDialogueIds.has(firstDialog.Id)) {
          continue;
        } else {
          seenFirstDialogueIds.add(firstDialog.Id);
        }
        const dialogueBranch = await ctrl.selectDialogBranch(firstDialog);
        const sect = new DialogueSectionResult('Dialogue_'+firstDialog.Id, 'Dialogue');
        sect.originalData.dialogBranch = dialogueBranch;
        sect.metadata.push(new MetaProp('First Dialogue ID', firstDialog.Id, `/branch-dialogue?q=${firstDialog.Id}`));
        sect.metadata.push(new MetaProp('First Match Dialogue ID', dialogue.Id, `/branch-dialogue?q=${dialogue.Id}`));

        let questIds = await dialogueToQuestId(ctrl, firstDialog);
        if (questIds.length) {
          sect.metadata.push(new MetaProp('Quest ID', questIds, '/quests/{}'));
        }
        sect.wikitext = (await ctrl.generateDialogueWikiText(dialogueBranch)).trim();
        addHighlightMarkers(dialogue, sect);
        result.push(sect);
      }
      if (foundDialogs) {
        return true;
      }
    }
    return false;
  }

  if (typeof query === 'string') {
    // string
    let textMapIds: number[] = [];

    await ctrl.streamTextMapMatches(ctrl.inputLangCode, query.trim(),
      (textMapId: number) => textMapIds.push(textMapId),
      ctrl.searchModeFlags
    );

    let acceptedCount = 0;
    for (let textMapId of textMapIds) {
      let dialogues = await ctrl.selectDialogsFromTextContentId(textMapId);
      let accepted: boolean = (await Promise.all(dialogues.map(d => handle(d)))).some(b => !!b);
      if (accepted) {
        acceptedCount++;
      }
      if (acceptedCount > DIALOGUE_GENERATE_MAX) {
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

export async function talkConfigGenerate(ctrl: Control, talkConfigId: number|TalkExcelConfigData, acc?: TalkConfigAccumulator): Promise<DialogueSectionResult> {
  let initTalkConfig = typeof talkConfigId === 'number' ? await ctrl.selectTalkExcelConfigDataByQuestSubId(talkConfigId) : talkConfigId;

  if (!initTalkConfig) {
    return undefined;
  }

  if (!acc) acc = new TalkConfigAccumulator(ctrl);

  let talkConfig: TalkExcelConfigData = await acc.handleTalkConfig(initTalkConfig);
  if (!talkConfig) {
    return undefined;
  }
  return await talkConfigToDialogueSectionResult(ctrl, null, 'Talk', null, talkConfig);
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
      let sect = await talkConfigGenerate(ctrl, talkConfig, acc);
      if (sect) {
        res.dialogue.push(sect);
      }
    }

    let dialogOrphaned: DialogExcelConfigData[] = await ctrl.selectDialogExcelConfigDataByTalkRoleId(npc.Id);
    for (let dialogue of dialogOrphaned) {
      if (ctrl.isInDialogIdCache(dialogue)) {
        continue;
      }
      ctrl.saveToDialogIdCache(dialogue);

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

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    await loadEnglishTextMap();
    //console.log(await dialogueGenerate(`Uh, why are you two fighting?`));
    //console.log(await talkConfigGenerate(6906901));
    let res = await dialogueGenerateByNpc(getControl(), 'Arapratap');
    console.log(util.inspect(res, false, null, true));
    await closeKnex();
  })();
}