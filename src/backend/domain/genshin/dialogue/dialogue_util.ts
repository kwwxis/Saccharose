import {
  DialogExcelConfigData, DialogWikitextResult,
  TalkExcelConfigData,
} from '../../../../shared/types/genshin/dialogue-types.ts';
import { ConfigCondition } from '../../../../shared/types/genshin/general-types.ts';
import { GenshinControl, getGenshinControl } from '../genshinControl.ts';
import { QuestGenerateResult } from './quest_generator.ts';
import { MetaProp, MetaPropAcceptValue } from '../../../util/metaProp.ts';
import { toBoolean } from '../../../../shared/util/genericUtil.ts';
import { Marker } from '../../../../shared/util/highlightMarker.ts';
import { ChapterExcelConfigData, MainQuestExcelConfigData } from '../../../../shared/types/genshin/quest-types.ts';
import toposort from 'toposort';
import { sort } from '../../../../shared/util/arrayUtil.ts';
import { pathToFileURL } from 'url';
import { closeKnex } from '../../../util/db.ts';
import { isInt } from '../../../../shared/util/numberUtil.ts';
import { custom } from '../../../util/logger.ts';
import { CommonLineId } from '../../../../shared/types/common-types.ts';

// region Class: DialogBranchingCache
// --------------------------------------------------------------------------------------------------------------
export class DialogBranchingCache {
  dialogToBranch: {[id: number]: DialogExcelConfigData[]} = {};
  dialogSeenAlready: Set<number>;

  constructor(dialogToBranch: {[id: number]: DialogExcelConfigData[]}, dialogueSeenAlready: Set<number>) {
    this.dialogToBranch = dialogToBranch || {};
    this.dialogSeenAlready = !dialogueSeenAlready ? new Set<number>() : new Set<number>(dialogueSeenAlready);
  }

  static from(self: DialogBranchingCache) {
    return new DialogBranchingCache(self.dialogToBranch, self.dialogSeenAlready);
  }
}
// endregion

// region Class: DialogueSectionResult
// --------------------------------------------------------------------------------------------------------------
export class DialogueSectionResult {
  id: string = null;
  title: string = '';
  isHtmlTitle: boolean = false;
  metadata: MetaProp[] = [];
  infoTooltip: string = '';
  htmlMessage: string = null;

  private _wikitext: string = '';
  private _wikitextLineIds: CommonLineId[] = [];
  wikitextMarkers: Marker[] = [];
  wikitextArray: { title?: string, wikitext: string, markers?: Marker[] }[] = [];

  children: DialogueSectionResult[] = [];
  originalData: {
    talkConfig?: TalkExcelConfigData,
    dialogBranch?: DialogExcelConfigData[],
    questId?: number,
    questName?: string
  } = {};
  showGutter: boolean = false;
  showTextMapHash: boolean = false;
  similarityGroupId: number = null;
  copyAllSep: string = '\n';

  constructor(id: string, title: string, infoTooltip: string = null) {
    this.id = id;
    this.title = title;
    this.infoTooltip = infoTooltip;
  }

  get wikitext(): string {
    return this._wikitext;
  }

  get wikitextLineIds(): CommonLineId[] {
    return this._wikitextLineIds;
  }

  clearWikitext() {
    this._wikitext = '';
    this._wikitextLineIds = [];
  }

  setWikitext(result: DialogWikitextResult) {
    this._wikitext = result.wikitext;
    this._wikitextLineIds = result.ids;
  }

  appendEmptyLine() {
    this._wikitext += '\n';
    this._wikitextLineIds.push(null);
  }

  append(item: DialogWikitextResult) {
    if (!this._wikitext.length) {
      this._wikitext += item.wikitext;
    } else {
      this._wikitext += '\n' + item.wikitext;
    }
    this._wikitextLineIds.push(... item.ids);
  }

  prepend(item: DialogWikitextResult) {
    if (!this._wikitext.length) {
      this._wikitext = item.wikitext;
    } else {
      this._wikitext = item.wikitext + '\n' + this._wikitext;
    }
    this._wikitextLineIds.unshift(... item.ids);
  }

  prependFreeForm(text: string) {
    this._wikitext = text + this._wikitext;
    if (text && text.includes('\n')) {
      for (let _m of (text.match(/\n/g) || [])) {
        this._wikitextLineIds.unshift(null);
      }
    }
  }

  appendFreeForm(text: string) {
    this._wikitext += text;
    if (text && text.includes('\n')) {
      for (let _m of (text.match(/\n/g) || [])) {
        this._wikitextLineIds.push(null);
      }
    }
  }

  toString(includeDTemplate: boolean = false): string {
    const sep = this.copyAllSep.replace(/\\n/g, '\n');
    let str = '';

    if (this._wikitext) {
      str += this._wikitext;
    }
    if (this.wikitextArray && this.wikitextArray.length) {
      for (let wikitextArrayElement of this.wikitextArray) {
        str += sep + wikitextArrayElement.wikitext;
      }
    }

    if (this.children && this.children.length) {
      for (let child of this.children) {
        str += sep + child.toString();
      }
    }

    if (includeDTemplate) {
      str = '{{Dialogue Start}}\n' + str.trim() + '\n{{Dialogue End}}';
    }

    return str.trim();
  }

  afterConstruct(fn: (sect: this) => void): this {
    fn(this);
    return this;
  }

  addEmptyMetaProp(label: string) {
    this.metadata.push(new MetaProp(label, null));
  }

  getMetaProp(label: string): MetaProp {
    return this.metadata.find(item => item.label === label);
  }

  getOrCreateMetaProp(label: string): MetaProp {
    let existingProp = this.metadata.find(item => item.label === label);
    if (existingProp) {
      return existingProp;
    } else {
      let newProp = new MetaProp(label);
      this.metadata.push(newProp);
      return newProp;
    }
  }

  addMetaProp(label: string, values: MetaPropAcceptValue, link?: string) {
    if (!values || (Array.isArray(values) && !values.length)) {
      return;
    }
    let newProp = new MetaProp(label, values, link);
    this.metadata.push(newProp);
    return newProp;
  }

  addCondMetaProp(fieldName: string, condComb: string, condList: ConfigCondition[]) {
    let label = fieldName + (condComb ? '[Comb=' + condComb + ']' : '');
    let values = [];
    if (condList && condList.length) {
      for (let cond of condList) {
        let str = '(' + 'Type=' + cond.Type + (cond.Param ? ' Param=' + JSON.stringify(cond.Param) : '')
          + (cond.ParamStr ? ' ParamStr=' + cond.ParamStr : '')
          + (cond.Count ? ' Count=' + cond.Count : '') + ')';
        values.push(str);
      }
    }
    this.addMetaProp(label, values);
  }

  hasMetaProp(label: string) {
    return this.metadata.some(x => x.label === label);
  }
}
// endregion

// region Talk Config Utils
// --------------------------------------------------------------------------------------------------------------
export class TalkConfigAccumulator {
  readonly fetchedTalkConfigIds: Set<number> = new Set();
  readonly fetchedTopLevelTalkConfigs: TalkExcelConfigData[] = [];
  private maxDepth: number = -1;

  constructor(private ctrl: GenshinControl) {}

  setMaxDepth(maxDepth: number): this {
    this.maxDepth = maxDepth;
    return this;
  }

  getMaxDepth(): number {
    return this.maxDepth;
  }

  async handleTalkConfig(talkConfig: TalkExcelConfigData, depth: number = 0): Promise<TalkExcelConfigData> {
    if (!talkConfig || this.fetchedTalkConfigIds.has(talkConfig.Id)) {
      return null; // skip if not found or if already found
    }

    const debug: debug.Debugger = custom('talk-config-acc:' + talkConfig.Id);
    this.fetchedTalkConfigIds.add(talkConfig.Id);

    // Handle self:
    // ------------
    const questId: number = (await dialogueToQuestId(this.ctrl, talkConfig))?.[0];
    const isTopLevel: boolean = depth === 0;
    debug(`Fetching dialogue branch for ${talkConfig.Id} (${isTopLevel ? 'Top Level' : 'Child'}) [Init Dialog: ${talkConfig.InitDialog}]`);
    if (!!talkConfig.InitDialog) {
      talkConfig.Dialog = await this.ctrl.selectDialogBranch(questId, await this.ctrl.selectSingleDialogExcelConfigData(talkConfig.InitDialog), null, talkConfig.Id);
    } else {
      talkConfig.Dialog = [];
    }
    if (isTopLevel) {
      this.fetchedTopLevelTalkConfigs.push(talkConfig);
    }

    const flatDialogs = await this.ctrl.selectDialogExcelConfigDataByTalkId(talkConfig.Id, true);
    //console.log('FLAT DIALOGS', flatDialogs);
    for (let dialog of flatDialogs) {
      if (this.ctrl.isInDialogIdCache(dialog.Id))
        continue;
      const dialogs = await this.ctrl.selectDialogBranch(questId, dialog);
      if (dialogs.length) {
        if (!talkConfig.OtherDialog)
          talkConfig.OtherDialog = [];
        talkConfig.OtherDialog.push(dialogs);
      }
    }

    // Handle Next Talks
    // -----------------
    debug(`Fetched dialogue branch - has ${talkConfig.NextTalks.length} Next Talks`);
    if (talkConfig.NextTalks) {
      if (this.maxDepth >= 0 && depth >= this.maxDepth) {
        talkConfig.NextTalks = [];
        talkConfig.NextTalksDataList = [];
      }
      if (!talkConfig.NextTalksDataList) {
        talkConfig.NextTalksDataList = [];
      }
      let finalNextTalks: number[] = [];
      for (let nextTalkId of talkConfig.NextTalks) {
        let nextTalkConfig = await this.handleTalkConfig(
          await this.ctrl.selectTalkExcelConfigDataById(nextTalkId),
          depth + 1
        );
        if (nextTalkConfig) {
          debug(`Adding Next Talk data for ` + nextTalkId);
          let prevTalkConfig: TalkExcelConfigData = null;
          if (talkConfig.NextTalksDataList.length) {
            prevTalkConfig = talkConfig.NextTalksDataList[talkConfig.NextTalksDataList.length - 1];
          }
          if (prevTalkConfig && prevTalkConfig.InitDialog === nextTalkConfig.InitDialog) {
            continue;
          }
          talkConfig.NextTalksDataList.push(nextTalkConfig);
        }
        finalNextTalks.push(nextTalkId);
      }
      talkConfig.NextTalks = finalNextTalks;
    }
    return talkConfig;
  }
}

export async function talkConfigGenerate(ctrl: GenshinControl,
                                         talkConfigId: number | TalkExcelConfigData,
                                         acc?: TalkConfigAccumulator): Promise<DialogueSectionResult> {
  const initTalkConfig = typeof talkConfigId === 'number'
    ? await ctrl.selectTalkExcelConfigDataById(talkConfigId)
    : talkConfigId;

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

export async function talkConfigToDialogueSectionResult(ctrl: GenshinControl,
                                                        parentSect: DialogueSectionResult | QuestGenerateResult,
                                                        sectName: string,
                                                        sectHelptext: string,
                                                        talkConfig: TalkExcelConfigData,
                                                        dialogueDepth: number = 1): Promise<DialogueSectionResult> {
  const mysect = new DialogueSectionResult('Talk_' + talkConfig.Id, sectName, sectHelptext);
  mysect.originalData.talkConfig = talkConfig;

  mysect.addMetaProp('Talk ID', talkConfig.Id, '/genshin/branch-dialogue?q={}');
  mysect.addMetaProp('First Dialogue ID', talkConfig.InitDialog, '/genshin/branch-dialogue?q={}');
  if (talkConfig.Dialog?.[0]?.TalkType) {
    mysect.addMetaProp('First Dialogue Talk Type', talkConfig.Dialog[0].TalkType);
  }
  if (talkConfig.Dialog?.[0]?.TalkBinType) {
    const values: (string|number)[] = [talkConfig.Dialog[0].TalkBinType];
    if (talkConfig.Dialog[0].TalkBinType === 'NpcOther') {
      values.push('Idle Quote');
    }
    mysect.addMetaProp('First Dialogue Talk Bin Type', values);
  }
  if (talkConfig.LoadType && talkConfig.LoadType !== 'TALK_DEFAULT') {
    mysect.addMetaProp('Load Type', talkConfig.LoadType);
  }
  if (talkConfig.QuestId) {
    if (talkConfig.LoadType === 'TALK_ACTIVITY') {
      mysect.addMetaProp('Activity ID', {value: talkConfig.QuestId, tooltip: await ctrl.selectNewActivityName(talkConfig.QuestId)});
    } else {
      const questName = await ctrl.selectMainQuestName(talkConfig.QuestId);
      mysect.addMetaProp('Quest ID', {value: talkConfig.QuestId, tooltip: questName}, '/genshin/quests/{}');
      mysect.originalData.questId = talkConfig.QuestId;
      mysect.originalData.questName = questName;
    }
  } else {
    let questIds = await dialogueToQuestId(ctrl, talkConfig);
    if (questIds.length) {
      mysect.addMetaProp('Quest ID', await questIds.asyncMap(async id => ({
        value: id,
        tooltip: await ctrl.selectMainQuestName(id)
      })), '/quests/{}');
      mysect.originalData.questId = questIds[0];
      mysect.originalData.questName = await ctrl.selectMainQuestName(questIds[0]);
    }
  }
  mysect.addMetaProp('Quest Idle Talk', talkConfig.QuestIdleTalk ? 'yes' : null);
  mysect.addMetaProp('NPC ID', talkConfig.NpcDataList?.map(npc => ({value: npc.Id, tooltip: npc.NameText})), '/genshin/npc-dialogue?q={}');
  mysect.addMetaProp('Next Talk IDs', talkConfig.NextTalks, '/genshin/branch-dialogue?q={}');

  if (talkConfig.LoadType === 'TALK_BLOSSOM') {
    mysect.addEmptyMetaProp('Magical Crystal Ore Vein Talk');
  }

  for (let beginCond of (talkConfig.BeginCond || [])) {
    switch (beginCond.Type) {
      case 'QUEST_COND_AVATAR_FETTER_GT':
        mysect.addMetaProp('Friendship', ['greater than', beginCond.Param[1]]);
        break;
      case 'QUEST_COND_AVATAR_FETTER_LT':
        mysect.addMetaProp('Friendship', ['less than', beginCond.Param[1]]);
        break;
      case 'QUEST_COND_AVATAR_FETTER_EQ':
        mysect.addMetaProp('Friendship', ['equals', beginCond.Param[1]]);
        break;
      case 'QUEST_COND_IS_DAYTIME':
        if (toBoolean(beginCond.Param[0])) {
          mysect.addEmptyMetaProp('Daytime Only');
        } else {
          mysect.addEmptyMetaProp('Nighttime Only');
        }
        break;
    }
    if (beginCond.Type.startsWith('QUEST_COND_QUEST_')) {
      mysect.addMetaProp('Quest Cond', [
        beginCond.Type.slice(17),
        ... beginCond.Param
      ]);
    } else
    if (beginCond.Type.startsWith('QUEST_COND_SCENE_')) {
      mysect.addMetaProp('Quest Scene Cond', [
        beginCond.Type.slice(17),
        ... beginCond.Param
      ]);
    } else if (beginCond.Type.startsWith('QUEST_COND_STATE_')) {
      let questExcel = await ctrl.selectQuestExcelConfigData(beginCond.Param[0]);
      let questName = questExcel ? await ctrl.selectMainQuestName(questExcel.MainId) : null;

      mysect.addMetaProp('Quest State Cond', [
        beginCond.Type.slice(17),
        {value: beginCond.Param[0], tooltip: questName, link: questExcel ? '/genshin/quests/' + questExcel.MainId : null},
        ... beginCond.Param.slice(1)
      ]);
    }
  }

  if (talkConfig.InterActionFile) {
    mysect.addMetaProp('Perform', talkConfig.InterActionFile.replace(/;/g, '/').replace('.json', ''));
  }

  if (talkConfig.Dialog.length && ctrl.isPlayerTalkRole(talkConfig.Dialog[0])) {
    dialogueDepth += 1;
  }

  const talkWikitextRet: DialogWikitextResult = await ctrl.generateDialogueWikitext(talkConfig.Dialog, dialogueDepth);
  mysect.setWikitext(talkWikitextRet);

  if (talkConfig.OtherDialog && talkConfig.OtherDialog.length) {
    for (let dialogs of talkConfig.OtherDialog) {
      if (!dialogs.length) {
        continue;
      }
      let otherSect = new DialogueSectionResult('OtherDialogue_'+dialogs[0].Id, 'Other Dialogue');
      otherSect.originalData.dialogBranch = dialogs;
      otherSect.metadata.push(new MetaProp('First Dialogue ID', dialogs[0].Id, `/branch-dialogue?q=${dialogs[0].Id}`));
      if (dialogs[0].TalkType) {
        otherSect.metadata.push(new MetaProp('First Dialogue Talk Type', dialogs[0].TalkType));
      }
      const otherWikitextRet: DialogWikitextResult = await ctrl.generateDialogueWikitext(dialogs);
      otherSect.setWikitext(otherWikitextRet);
      mysect.children.push(otherSect);
    }
  }

  if (talkConfig.NextTalksDataList) {
    for (let nextTalkConfig of talkConfig.NextTalksDataList) {
      await talkConfigToDialogueSectionResult(ctrl, mysect, 'Next Talk',
        'An immediate (but possibly conditional) continuation from the parent talk.<br>' +
        'This can happen for conditional dialogues and branching.<br><br>' +
        'Example 1: multiple talks leading to the same next talk.<br>' +
        'Example 2: a branch that might lead to one of the next talks depending on some condition.', nextTalkConfig, dialogueDepth);
    }
  }

  if (talkConfig.NextTalks && talkConfig.NextTalksDataList) {
    // Get a list of next talk ids that are *not* in NextTalksDataList
    const skippedNextTalkIds = talkConfig.NextTalks
      .filter(myId => !talkConfig.NextTalksDataList.find(x => x.Id === myId));

    for (let nextTalkId of skippedNextTalkIds) {
      let placeholderSect = new DialogueSectionResult(null, 'Next Talk');
      placeholderSect.metadata.push(new MetaProp('Talk ID', nextTalkId, `/branch-dialogue?q=${nextTalkId}`));
      placeholderSect.htmlMessage = `<p>This section contains dialogue but wasn't shown because the section is already present on the page.
      This can happen when multiple talks lead to the same next talk.</p>
      <p><a href="#Talk_${nextTalkId}">Jump to Talk ${nextTalkId}</a></p>`;
      mysect.children.push(placeholderSect);
    }
  }

  if (parentSect) {
    if (parentSect instanceof QuestGenerateResult) {
      parentSect.dialogue.push(mysect);
    } else {
      parentSect.children.push(mysect);
    }
  }
  return mysect;
}
// endregion

// region Trace-Back and Reverse Quest
// --------------------------------------------------------------------------------------------------------------

/**
 * Trace a dialog back to the first dialog of its section.
 *
 * There can be multiple results if there are multiple first dialogs that lead to the same dialog.
 */
export async function dialogTraceBack(ctrl: GenshinControl, dialog: DialogExcelConfigData): Promise<DialogExcelConfigData[]> {
  if (!dialog) {
    return undefined;
  }
  let stack: DialogExcelConfigData[] = [dialog];
  let ret: DialogExcelConfigData[] = [];
  let seenIds: Set<number> = new Set();

  //console.log(`START: ${dialog.Id}: ${dialog.TalkRoleNameText}: ${dialog.TalkContentText}`)

  while (true) {
    let nextStack = [];
    for (let d of stack) {
      let prevs: DialogExcelConfigData[] = await ctrl.selectPreviousDialogs(d.Id, true);
      // if (!prevs.length) {
      //   console.log('PREVS: none');
      // } else {
      //   console.log('PREVS:\n' + prevs.map(p => `  ${p.Id}: ${p.TalkRoleNameText}: ${p.TalkContentText}`).join(`\n`));
      // }
      if (!prevs.length) {
        if (!ret.some(r => r.Id === d.Id)) {
          ret.push(d);
        }
      } else {
        for (let prev of prevs) {
          if (!seenIds.has(prev.Id)) {
            nextStack.push(prev);
            seenIds.add(prev.Id);
          }
        }
      }
    }
    if (nextStack.length) {
      stack = nextStack;
    } else {
      break;
    }
  }
  if (!ret.length && seenIds.size) {
    const dId = Math.min(... Array.from(seenIds));
    return [await ctrl.selectSingleDialogExcelConfigData(dId, true)];
  }
  return ret;
}

/**
 * @param ctrl Control
 * @param query Either dialogue text, dialogue/talk id, or instance.
 */
export async function dialogueToQuestId(ctrl: GenshinControl,
                                        query: string | number | DialogExcelConfigData | TalkExcelConfigData): Promise<number[]> {
  let talk: TalkExcelConfigData;
  let dialog: DialogExcelConfigData;

  // Step 1: Normalize input query
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  // If the query is a string that's integer-like, then convert it to an int
  if (typeof query === 'string' && isInt(query)) {
    query = parseInt(query);
  }

  // If the query is a string then consider it as dialog text, and find the corresponding textmap hash and dialog
  if (typeof query === 'string') {
    let textmapHashes = (await ctrl.getTextMapMatches({
      inputLangCode: ctrl.inputLangCode,
      outputLangCode: ctrl.outputLangCode,
      searchText: query,
      flags: '-m 1' // only get one match
    })).map(x => x.hash);
    if (!textmapHashes.length) {
      return []; // if no textmap results, then no results overall
    }
    dialog = (await ctrl.selectDialogsFromTextMapHash(textmapHashes[0], true))[0]; // if multiple results, then get first only
  }

  // If the query is a number, then it might be a dialog or talk id
  if (typeof query === 'number') {
    talk = await ctrl.selectTalkExcelConfigDataById(query);
    dialog = await ctrl.selectSingleDialogExcelConfigData(query, true);
  }

  // If the query is an object, then figure out if it's a Talk or Dialog
  if (typeof query === 'object') {
    if (query.hasOwnProperty('InitDialog')) {
      talk = query as TalkExcelConfigData;
    }
    if (query.hasOwnProperty('TalkContentTextMapHash')) {
      dialog = query as DialogExcelConfigData;
    }
  }

  // Step 2: Find Quest ID
  // ~~~~~~~~~~~~~~~~~~~~~

  // If we found a talk and the talk has a quest ID, then we're done
  if (talk && talk.QuestId) {
    return [talk.QuestId];
  }

  // If no dialog, then nothing else we can do
  if (!dialog) {
    return [];
  }

  // If dialog has a TalkId, try fetching that
  if (dialog.TalkId) {
    talk = await ctrl.selectTalkExcelConfigDataById(dialog.TalkId);
    if (talk && talk.QuestId) {
      return [talk.QuestId];
    }
  }

  // Check if unparented main quest dialog
  {
    let unparented = await ctrl.selectDialogUnparentedByDialogId(dialog.Id);
    if (unparented) {
      return [unparented.MainQuestId];
    }
  }

  // Step 3: Find Quest ID (continued)
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  const questIds: Set<number> = new Set();
  const firstDialogs = await dialogTraceBack(ctrl, dialog);

  // Trace the dialog back to the first dialog
  for (let d of firstDialogs) {
    let unparented = await ctrl.selectDialogUnparentedByDialogId(d.Id);
    if (unparented) {
      questIds.add(unparented.MainQuestId);
    } else if (d.TalkId) {
      let t = await ctrl.selectTalkExcelConfigDataById(d.TalkId);
      if (t && t.QuestId) {
        questIds.add(t.QuestId);
      }
    } else {
      for (let t of await ctrl.selectTalkExcelConfigDataListByFirstDialogueId(d.Id)) {
        if (t && t.QuestId) {
          questIds.add(t.QuestId);
        }
      }
    }
  }

  return Array.from(questIds);
}
// endregion

// region Quest Ordering
// --------------------------------------------------------------------------------------------------------------
export interface QuestOrderItem {
  quest: MainQuestExcelConfigData;
  subquests?: QuestOrderItem[];
}

export async function orderChapterQuests(ctrl: GenshinControl, chapter: ChapterExcelConfigData): Promise<QuestOrderItem[]> {
  if (!chapter) {
    return [];
  }
  const globalVarIds: number[] = await ctrl.cached('QuestGlobalVarConfigData', 'json', async () => {
    const globalVar: any[] = await ctrl.readDataFile('./ExcelBinOutput/QuestGlobalVarConfigData.json');
    return globalVar.map(x => x.Id);
  });

  let questsInChapter: MainQuestExcelConfigData[] = (await ctrl.selectMainQuestsByChapterId(chapter.Id)).filter(q => !!q.TitleText);
  let directingQuests = questsInChapter.filter(q => !!q.SuggestTrackMainQuestList);

  let graph: [number, number][] = [];
  let subquests: { [parentQuestId: number]: MainQuestExcelConfigData[] } = {};
  let subquestIds: number[] = [];

  //console.log('Chapter:', chapter.Type, chapter.Id, chapter.ChapterTitleText, 'First:', chapter.BeginQuestId, 'Last:', chapter.EndQuestId);

  for (let quest of directingQuests) {
    quest.__globalVarPos = globalVarIds.indexOf(quest.Id);
    //console.log(quest.Type, quest.Id, quest.TitleText, quest.SuggestTrackMainQuestList, quest.__globalVarPos, quest.SuggestTrackOutOfOrder);

    let parentQuestId: number = null;

    // if (quest.SuggestTrackMainQuestList.some(id => id < quest.Id) && quest.Id !== chapter.BeginQuestId) {
    //   parentQuestId = Math.min(... quest.SuggestTrackMainQuestList);
    //   console.info(`Parent of ${quest.Id} is ${parentQuestId}`);
    // }

    if (quest.SuggestTrackMainQuestList.length > 1) {
      let siblings = directingQuests.filter(q => q.SuggestTrackMainQuestList.includes(quest.Id));
      let siblingIdsCombined: Set<number> = new Set([quest.Id, quest.SuggestTrackMainQuestList, siblings.map(q => q.SuggestTrackMainQuestList)].flat(Infinity) as number[]);
      siblingIdsCombined.delete(quest.Id);
      siblings.forEach(q => siblingIdsCombined.delete(q.Id));
      if (siblingIdsCombined.size === 1) {
        parentQuestId = Array.from(siblingIdsCombined)[0];
        //console.info(`Parent of ${quest.Id} is ${parentQuestId}`);
      } else if (siblingIdsCombined.size > 1) {
        parentQuestId = Array.from(siblingIdsCombined)[0];
      } else {
        continue;
      }
    }

    if (!!parentQuestId) {
      if (!subquests[parentQuestId])
        subquests[parentQuestId] = [];
      subquests[parentQuestId].push(quest);
      subquestIds.push(quest.Id);
      continue;
    }

    for (let directedTo of quest.SuggestTrackMainQuestList) {
      graph.push([quest.Id, directedTo]);
    }
  }

  let directedQuests: MainQuestExcelConfigData[] = [];
  try {
    for (let id of toposort(graph)) {
      let quest = questsInChapter.find(q => q.Id === id);
      if (!quest) {
        quest = await ctrl.selectMainQuestById(id);
        if (!!quest.ChapterId && quest.ChapterId !== chapter.Id) {
          let otherChapter = await ctrl.selectChapterById(quest.ChapterId);
          if (otherChapter.ChapterNumText !== chapter.ChapterNumText) {
            continue;
          }
        }
      }
      directedQuests.push(quest);
    }
  } catch (ignore) {
    // cyclic dependency, e.g. [ [ 74194, 74196 ], [ 74202, 74206 ], [ 74206, 74202 ] ]
  }

  let undirectedQuests = questsInChapter.filter(q => !directedQuests.some(q2 => q2.Id === q.Id) && !subquestIds.includes(q.Id));
  sort(undirectedQuests, '__globalVarPos', 'Id');

  let combinedOrder: MainQuestExcelConfigData[] = [].concat(...undirectedQuests, ...directedQuests);

  function convertToOrderItem(quests: MainQuestExcelConfigData[]): QuestOrderItem[] {
    let orderItems: QuestOrderItem[] = [];
    for (let quest of quests) {
      let item: QuestOrderItem = { quest };
      if (subquests[quest.Id]) {
        item.subquests = convertToOrderItem(subquests[quest.Id]);
      }
      orderItems.push(item);
    }
    return orderItems;
  }

  return convertToOrderItem(combinedOrder);
}
// endregion

// region CLI Testing
// --------------------------------------------------------------------------------------------------------------
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    let ctrl: GenshinControl = getGenshinControl();

    // 3001  - Further Observation
    // 71043 - Perils in the Dark
    // 72242 - The Entrance to Tokoyo
    // 3007 - The Coming of the Sabzeruz Festival
    // 3016 - Like a Triumphant Hero
    // 3019 - The Missing Village Keepers
    // 3024 - Through the Predawn Night

    let mainQuest: MainQuestExcelConfigData = await ctrl.selectMainQuestById(3024);

    if (mainQuest.ChapterId) {
      let chapter = await ctrl.selectChapterById(mainQuest.ChapterId);

      console.log(await orderChapterQuests(ctrl, chapter));
    }

    await closeKnex();
  })();
}
// endregion
