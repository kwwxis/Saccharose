import '../../../loadenv.ts';
import { closeKnex } from '../../../util/db.ts';
import { GenshinControl, getGenshinControl } from '../genshinControl.ts';
import { NpcExcelConfigData } from '../../../../shared/types/genshin/general-types.ts';
import util from 'util';
import { isInt, toInt } from '../../../../shared/util/numberUtil.ts';
import {
  DialogExcelConfigData, TalkExcelConfigData,
} from '../../../../shared/types/genshin/dialogue-types.ts';
import { escapeRegExp, trim } from '../../../../shared/util/stringUtil.ts';
import {
  dialogueToQuestId,
  TalkConfigAccumulator,
  talkConfigGenerate,
  dialogTraceBack,
} from './dialogue_util.ts';
import { IMetaPropValue, MetaProp } from '../../../util/metaProp.ts';
import { pathToFileURL } from 'url';
import { Marker, MarkerPostCreateInterceptorAsync } from '../../../../shared/util/highlightMarker.ts';
import { LangCode, TextMapHash } from '../../../../shared/types/lang-types.ts';
import { reminderGenerateFromSpeakerTextMapHashes } from './reminder_generator.ts';
import { custom } from '../../../util/logger.ts';
import { CommonLineId, DialogWikitextResult } from '../../../../shared/types/common-types.ts';
import { DialogueSectionResult } from '../../../util/dialogueSectionResult.ts';
import { GameVersions } from '../../../../shared/types/game-versions.ts';

// region NPC Filtering for Single Branch Dialogue
// --------------------------------------------------------------------------------------------------------------
const lc = (s: string) => s ? s.toLowerCase() : s;

function normNpcFilterInput(ctrl: GenshinControl, npcFilterInput: string, langCode: LangCode): string {
  if (!npcFilterInput)
    return undefined;
  return lc(trim(ctrl.normText(npcFilterInput, langCode), '()').trim());
}

const npcFilterInclude = async (ctrl: GenshinControl, d: DialogExcelConfigData, npcFilter: string): Promise<boolean> => {
  if (!d) {
    return false;
  }
  if (npcFilter === 'player' || npcFilter === 'traveler') {
    return ctrl.isPlayerTalkRole(d);
  }
  if (npcFilter === 'sibling') {
    return d.TalkRole.Type === 'TALK_ROLE_MATE_AVATAR';
  }
  let npcNameOutputLang = lc(trim(ctrl.normText(d.TalkRoleNameText, ctrl.outputLangCode), '()'));
  let npcNameInputLang = lc(trim(ctrl.normText(await ctrl.getTextMapItem(ctrl.inputLangCode, d.TalkRoleNameTextMapHash), ctrl.inputLangCode), '()'));
  if (!npcFilter) {
    return true;
  }
  return npcNameOutputLang === npcFilter || npcNameInputLang === npcFilter;
};
// endregion

// region Branch Dialogue: Options & State
// --------------------------------------------------------------------------------------------------------------
export type DialogueGenerateOpts = {
  query: number|number[]|string,
  voicedOnly?: boolean;
  npcFilter?: string;
  versionFilter?: GameVersions,
}

export const DIALOGUE_GENERATE_MAX = 100;

class DialogueGenerateState {
  readonly result: DialogueSectionResult[] = [];

  readonly query: number | number[] | string;
  readonly npcFilter: string;
  readonly voicedOnly: boolean;

  readonly seenTalkConfigIds: Set<number> = new Set();
  readonly seenFirstDialogueIds: Set<number> = new Set();

  constructor(readonly ctrl: GenshinControl, opts: DialogueGenerateOpts) {
    this.query = opts.query;

    if (typeof this.query === 'string') {
      this.query = this.query.trim();
    }

    if (typeof this.query === 'string' && isInt(this.query)) {
      this.query = toInt(this.query);
    }

    this.npcFilter = normNpcFilterInput(ctrl, opts?.npcFilter, ctrl.inputLangCode);
    this.voicedOnly = opts?.voicedOnly || false;
  }
}
// endregion

// region Branch Dialogue: Logic
// --------------------------------------------------------------------------------------------------------------

/**
 * Add highlight markers to the search result dialogue section.
 * @param ctrl The control instance.
 * @param query The original query.
 * @param npcFilter The npcFilter.
 * @param dialogue The DialogExcel of the match.
 * @param sect The section to highlight.
 */
async function addHighlightMarkers(ctrl: GenshinControl,
                             query: number|number[]|string,
                             npcFilter: string,
                             dialogue: DialogExcelConfigData,
                             sect: DialogueSectionResult) {
  let re: RegExp;
  if (typeof query === 'string' && ctrl.inputLangCode === ctrl.outputLangCode) {
    re = new RegExp(ctrl.searchModeIsRegex ? `(?<=(:'''|{{DIcon[^}]*}}) .*)` + query : escapeRegExp(ctrl.normText(query, ctrl.outputLangCode)), ctrl.searchModeReFlags);
  } else {
    re = new RegExp(escapeRegExp(ctrl.normText(dialogue.TalkContentText, ctrl.outputLangCode)), ctrl.searchModeReFlags);
  }

  const lineIds: CommonLineId[] = sect.wikitextLineIds;

  const markerInterceptor: MarkerPostCreateInterceptorAsync = npcFilter ? async (lineMarkers: Marker[], line, lineNum) => {
    const lineId = lineIds[lineNum - 1];
    let shouldSkip = false;

    if (lineMarkers.length && lineId && lineId.commonId) {
      const d = await ctrl.selectSingleDialogExcelConfigData(toInt(lineId.commonId), true);
      if (!(await npcFilterInclude(ctrl, d, npcFilter))) {
        shouldSkip = true;
      }
    }

    return {skip: shouldSkip};
  } : null;

  for (let marker of await Marker.createAsync(re, sect.wikitext, { post: markerInterceptor })) {
    sect.wikitextMarkers.push(marker);
  }

  if (sect.children && sect.children.length) {
    for (let child of sect.children) {
      await addHighlightMarkers(ctrl, query, npcFilter, dialogue, child);
    }
  }
}

async function handle(state: DialogueGenerateState, id: number|DialogExcelConfigData): Promise<boolean> {
  const generalDebug = custom('branch-dialogue');
  if (!id) {
    generalDebug('Early exit: no ID');
    return false;
  }

  generalDebug('Handle: for ' + (typeof id === 'number' ? 'number - ' + id : 'dialog - ' + id.Id));

  const {
    result,
    ctrl,

    seenFirstDialogueIds,
    seenTalkConfigIds,

    query,
    voicedOnly,
    npcFilter,
  } = state;

  // Fast case: if ID is a Talk ID
  // --------------------------------------------------------------------------------------------------------------
  if (typeof id === 'number') {
    const debug = custom('branch-dialogue:' + id);
    if (seenTalkConfigIds.has(id) || seenFirstDialogueIds.has(id)) {
      debug('Fast case: already seen, exit');
      return false;
    }
    const talkConfigResult = await talkConfigGenerate(ctrl, id);
    if (talkConfigResult) {
      debug('Fast case: talk config result - ' + talkConfigResult.id);
      result.push(talkConfigResult);
      return true;
    }
  }

  // Find Dialog Excel
  // --------------------------------------------------------------------------------------------------------------

  // Look for dialog excel:
  const dialog: DialogExcelConfigData = typeof id === 'number' ? await ctrl.selectSingleDialogExcelConfigData(id, true) : id;

  // If no dialog, then there's nothing we can do:
  if (!dialog) {
    const debug = custom('branch-dialogue:' + id);
    debug('No Talk or Dialogue found');
    throw 'No Talk or Dialogue found for ID: ' + id;
  }

  // Filters
  // --------------------------------------------------------------------------------------------------------------
  const debug = custom('branch-dialogue:' + dialog.Id);

  // If voicedOnly=true and the dialog is not voiced, then do not accept:
  if (voicedOnly && !ctrl.voice.hasVoiceItems('Dialog', dialog.Id)) {
    return false;
  }

  // If input options has an NPC filter and this dialogue is not of that NPC, then do not accept:
  if (!(await npcFilterInclude(ctrl, dialog, npcFilter))) {
    debug('Excluded via NPC filter');
    return false;
  }

  // Find Talks
  // --------------------------------------------------------------------------------------------------------------

  // Find Talks (part 1):
  const talkConfigs: TalkExcelConfigData[] = await ctrl.selectTalkExcelConfigDataListByFirstDialogueId(dialog.Id);
  const foundTalkIds: Set<number> = new Set<number>(talkConfigs.map(t => t.Id));

  // Find Talks (part 2):
  const firstDialogs: DialogExcelConfigData[] = await dialogTraceBack(ctrl, dialog);
  for (let d of firstDialogs) {
    const dTalks: TalkExcelConfigData[] = await ctrl.selectTalkExcelConfigDataListByFirstDialogueId(d.Id);
    for (let dTalk of dTalks) {
      if (!foundTalkIds.has(dTalk.Id)) {
        talkConfigs.push(dTalk);
        foundTalkIds.add(dTalk.Id);
      }
    }
  }

  // Find Talks (part 3):
  for (let d of [dialog, ...firstDialogs]) {
    if (isInt(d.TalkId) && !foundTalkIds.has(d.TalkId)) {
      const dTalk = await ctrl.selectTalkExcelConfigDataById(d.TalkId);
      if (dTalk) {
        talkConfigs.push(dTalk);
        foundTalkIds.add(dTalk.Id);
      }
    }
  }

  // Talk Case
  // --------------------------------------------------------------------------------------------------------------
  if (talkConfigs.length) {
    debug('Talk case:', talkConfigs.length);
    let foundTalks: boolean = false;
    for (let talkConfig of talkConfigs) {
      if (seenTalkConfigIds.has(talkConfig.Id)) {
        continue;
      } else {
        seenTalkConfigIds.add(talkConfig.Id);
      }

      const talkConfigResult = await talkConfigGenerate(ctrl, talkConfig);
      if (!talkConfigResult)
        continue;

      talkConfigResult.headerProps.push(new MetaProp('First Match Dialogue ID', [
        dialog.Id,
        <IMetaPropValue> {
          value: 'OL',
          link: '/genshin/OL?q=' + dialog.TalkContentTextMapHash
        }
      ]));
      await addHighlightMarkers(ctrl, query, npcFilter, dialog, talkConfigResult);
      result.push(talkConfigResult);
      foundTalks = true;
    }
    return foundTalks;
  }

  // Non-Talk Case
  // --------------------------------------------------------------------------------------------------------------
  else {
    debug('Non-Talk case:', firstDialogs.length);
    let foundDialogs: boolean = false;
    for (let firstDialog of firstDialogs) {
      if (seenFirstDialogueIds.has(firstDialog.Id)) {
        continue;
      } else {
        seenFirstDialogueIds.add(firstDialog.Id);
      }

      const questIds: number[] = await dialogueToQuestId(ctrl, firstDialog);
      const dialogueBranch = await ctrl.selectDialogBranch(questIds?.[0], firstDialog);
      const sect = new DialogueSectionResult('Dialogue_'+firstDialog.Id, 'Dialogue');
      sect.originalData.dialogBranch = dialogueBranch;
      sect.headerProps.push(new MetaProp('First Dialogue ID', firstDialog.Id, `/genshin/branch-dialogue?q=${firstDialog.Id}`));
      if (dialog.TalkType) {
        sect.headerProps.push(new MetaProp('First Dialogue Talk Type', dialog.TalkType));
      }
      sect.headerProps.push(new MetaProp('First Match Dialogue ID', [
        <IMetaPropValue> {
          value: dialog.Id,
          link: `/genshin/branch-dialogue?q=${dialog.Id}`,
        },
        <IMetaPropValue> {
          value: 'OL',
          link: '/genshin/OL?q=' + dialog.TalkContentTextMapHash
        }
      ]));

      if (questIds.length) {
        sect.headerProps.push(new MetaProp('Quest ID', await questIds.asyncMap(async id => ({
          value: id,
          tooltip: await ctrl.selectMainQuestName(id)
        })), '/quests/{}'));
        sect.originalData.questId = questIds[0];
        sect.originalData.questName = await ctrl.selectMainQuestName(questIds[0]);
      }

      const dialogWikitextRet: DialogWikitextResult = await ctrl.generateDialogueWikitext(dialogueBranch);
      sect.setWikitext(dialogWikitextRet);

      await addHighlightMarkers(ctrl, query, npcFilter, dialog, sect);
      result.push(sect);
    }
    return foundDialogs;
  }
}

export async function dialogueGenerate(ctrl: GenshinControl, opts: DialogueGenerateOpts): Promise<DialogueSectionResult[]> {
  const state: DialogueGenerateState = new DialogueGenerateState(ctrl, opts);
  ctrl.state.DisableNpcCache = true;

  const debug = custom('branch-dialogue');
  debug('Generating branch dialogue for opts:', opts, '/ query:', state.query);

  if (typeof state.query === 'string') {
    debug('Path 1: string');
    let acceptedCount = 0;
    for await (let textMapHash of ctrl.generateTextMapMatches({
      searchText: state.query.trim(),
      inputLangCode: ctrl.inputLangCode,
      outputLangCode: ctrl.outputLangCode,
      flags: ctrl.searchModeFlags,
      versionFilter: opts.versionFilter,
    })) {
      const dialogues: DialogExcelConfigData[] = await ctrl.selectDialogsFromTextMapHash(textMapHash, true);
      const didAccept: boolean = (await dialogues.asyncMap(d => handle(state, d))).some(b => !!b);
      if (didAccept) {
        acceptedCount++;
      }
      if (acceptedCount > DIALOGUE_GENERATE_MAX) {
        break;
      }
    }
  } else if (typeof state.query === 'number') {
    debug('Path 2: number'); // The number could be a textmap hash, dialog id, or talk id

    // Try textmap hash:
    const dialogs = await ctrl.selectDialogsFromTextMapHash(state.query, true);
    if (dialogs.length) {
      await dialogs.asyncMap(d => handle(state, d));
    } else {
      // Try dialog id / talk id:
      await handle(state, state.query);
    }
  } else {
    debug('Path 3: number[]');
    await state.query.asyncMap(id => handle(state, id));
  }

  return state.result;
}
// endregion

// region NPC Dialogue
// --------------------------------------------------------------------------------------------------------------
export class NpcDialogueResultSet {
  resultMap: {[npcId: number]: NpcDialogueResult} = {};
  reminders: DialogueSectionResult[] = [];
}

export class NpcDialogueResult {
  npcId: number;
  npc: NpcExcelConfigData;

  questDialogue: DialogueSectionResult[] = [];
  nonQuestDialogue: DialogueSectionResult[] = [];

  constructor(npc: NpcExcelConfigData) {
    this.npc = npc;
    this.npcId = npc.Id;
  }
}

async function npcListFromInput(ctrl: GenshinControl, npcNameOrId: string|number): Promise<NpcExcelConfigData[]> {
  if (typeof npcNameOrId === 'string' && isInt(npcNameOrId)) {
    npcNameOrId = toInt(npcNameOrId);
  }

  let npcList: NpcExcelConfigData[] = [];
  if (typeof npcNameOrId === 'string') {
    npcList = await ctrl.selectNpcListByName(npcNameOrId);
  } else {
    let npc = await ctrl.getNpc(npcNameOrId);
    if (!!npc) {
      npcList.push(npc);
    }
  }
  return npcList;
}

export async function dialogueGenerateByNpc(ctrl: GenshinControl,
                                            npcNameOrId: string|number,
                                            acc?: TalkConfigAccumulator,
                                            skipNonIdSpecific: boolean = false): Promise<NpcDialogueResultSet> {
  if (!acc) {
    acc = new TalkConfigAccumulator(ctrl);
  }

  const npcList: NpcExcelConfigData[] = await npcListFromInput(ctrl, npcNameOrId);
  const resultSet: NpcDialogueResultSet = new NpcDialogueResultSet();

  for (let npc of npcList) {
    const res: NpcDialogueResult = new NpcDialogueResult(npc);
    const questIdToSection: {[questId: number]: DialogueSectionResult} = {};

    const getQuestSection = (questId: number, questName: string): DialogueSectionResult => {
      if (questIdToSection[questId]) {
        return questIdToSection[questId];
      }
      const sect = new DialogueSectionResult('Quest_'+questId, questId + ': ' + (questName || '(No title)'));
      sect.originalData.questId = questId;
      sect.originalData.questName = questName;
      questIdToSection[questId] = sect;
      res.questDialogue.push(sect);
      return sect;
    };

    for (let talkConfig of await ctrl.selectTalkExcelConfigDataByNpcId(npc.Id)) {
      const sect = await talkConfigGenerate(ctrl, talkConfig, acc);
      if (sect && sect.originalData.questId) {
        getQuestSection(sect.originalData.questId, sect.originalData.questName).children.push(sect);
      } else if (sect) {
        res.nonQuestDialogue.push(sect);
      }
    }

    for (let dialogue of await ctrl.selectDialogExcelConfigDataByTalkRoleId(npc.Id, true)) {
      if (ctrl.isInDialogIdCache(dialogue)) {
        continue;
      } else {
        ctrl.saveToDialogIdCache(dialogue);
      }

      const questId: number = (await dialogueToQuestId(ctrl, dialogue))?.[0];
      const dialogueBranch = await ctrl.selectDialogBranch(questId, dialogue);
      const sect = new DialogueSectionResult('Dialogue_'+dialogue.Id, 'Dialogue');
      sect.originalData.dialogBranch = dialogueBranch;
      sect.headerProps.push(new MetaProp('First Dialogue ID', dialogue.Id, `/genshin/branch-dialogue?q=${dialogue.Id}`));
      if (dialogue.TalkType) {
        sect.headerProps.push(new MetaProp('First Dialogue Talk Type', dialogue.TalkType));
      }

      const dialogWikitextRet: DialogWikitextResult = await ctrl.generateDialogueWikitext(dialogueBranch);
      sect.setWikitext(dialogWikitextRet);

      if (questId) {
        const questName = await ctrl.selectMainQuestName(questId);
        sect.addHeaderProp('Quest ID', {value: questId, tooltip: questName}, '/genshin/quests/{}');
        sect.originalData.questId = questId;
        sect.originalData.questName = questName;
        getQuestSection(sect.originalData.questId, sect.originalData.questName).children.push(sect);
      } else {
        res.nonQuestDialogue.push(sect);
      }
    }

    resultSet.resultMap[npc.Id] = res;
  }

  if (!skipNonIdSpecific) {
    const nameHashes: TextMapHash[] = (await Promise.all(npcList.map(npc => ctrl.findTextMapHashesByExactName(npc.NameText)))).flat();
    resultSet.reminders = await reminderGenerateFromSpeakerTextMapHashes(ctrl, nameHashes);
  }

  return resultSet;
}
// endregion

// region CLI Testing
// --------------------------------------------------------------------------------------------------------------
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    //console.log(await dialogueGenerate(`Uh, why are you two fighting?`));
    //console.log(await talkConfigGenerate(6906901));
    let res = await dialogueGenerateByNpc(getGenshinControl(), 'Arapratap');
    console.log(util.inspect(res, false, null, true));
    await closeKnex();
  })();
}
// endregion
