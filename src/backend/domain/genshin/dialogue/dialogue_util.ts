import { DialogExcelConfigData, TalkExcelConfigData } from '../../../../shared/types/genshin/dialogue-types';
import { ConfigCondition } from '../../../../shared/types/genshin/general-types';
import { GenshinControl, getGenshinControl } from '../genshinControl';
import { QuestGenerateResult } from './quest_generator';
import { MetaProp, MetaPropAcceptValue } from '../../../util/metaProp';
import { toBoolean } from '../../../../shared/util/genericUtil';
import { Marker } from '../../../../shared/util/highlightMarker';
import { SbOut } from '../../../../shared/util/stringUtil';
import { ChapterExcelConfigData, MainQuestExcelConfigData } from '../../../../shared/types/genshin/quest-types';
import { cached } from '../../../util/cache';
import toposort from 'toposort';
import { sort } from '../../../../shared/util/arrayUtil';
import { pathToFileURL } from 'url';
import { closeKnex } from '../../../util/db';
import { isInt } from '../../../../shared/util/numberUtil';
import { custom } from '../../../util/logger';

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

// "DialogueSectionResult" CLASS
// --------------------------------------------------------------------------------------------------------------
export class DialogueSectionResult {
  id: string = null;
  title: string = '';
  metadata: MetaProp[] = [];
  helptext: string = '';
  wikitext: string = '';
  wikitextMarkers: Marker[] = [];
  wikitextArray: { title?: string, wikitext: string, markers?: Marker[] }[] = [];
  children: DialogueSectionResult[] = [];
  htmlMessage: string = null;
  originalData: { talkConfig?: TalkExcelConfigData, dialogBranch?: DialogExcelConfigData[] } = {};
  showGutter: boolean = false;
  similarityGroupId: number = null;

  constructor(id: string, title: string, helptext: string = null) {
    this.id = id;
    this.title = title;
    this.helptext = helptext;
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

// TALK EXCEL CONFIG DATA STUFF
// --------------------------------------------------------------------------------------------------------------
export class TalkConfigAccumulator {
  readonly fetchedTalkConfigIds: Set<number> = new Set();
  readonly fetchedTopLevelTalkConfigs: TalkExcelConfigData[] = [];

  constructor(private ctrl: GenshinControl) {}

  async handleTalkConfig(talkConfig: TalkExcelConfigData, isTopLevel: boolean = true): Promise<TalkExcelConfigData> {
    if (!talkConfig || this.fetchedTalkConfigIds.has(talkConfig.Id)) {
      return null; // skip if not found or if already found
    }

    const debug: debug.Debugger = custom('talk-config-acc:' + talkConfig.Id);
    this.fetchedTalkConfigIds.add(talkConfig.Id);

    // Handle self:
    // ------------
    debug(`Fetching dialogue branch for ${talkConfig.Id} (${isTopLevel ? 'Top Level' : 'Child'}) [Init Dialog: ${talkConfig.InitDialog}]`);
    if (!!talkConfig.InitDialog) {
      talkConfig.Dialog = await this.ctrl.selectDialogBranch(await this.ctrl.selectSingleDialogExcelConfigData(talkConfig.InitDialog), null, talkConfig.Id);
    } else {
      talkConfig.Dialog = [];
    }
    if (isTopLevel) {
      this.fetchedTopLevelTalkConfigs.push(talkConfig);
    }

    const flatDialogs = await this.ctrl.selectDialogExcelConfigDataByTalkId(talkConfig.Id);
    for (let dialog of flatDialogs) {
      if (this.ctrl.state.dialogueIdCache.has(dialog.Id))
        continue;
      let dialogs = await this.ctrl.selectDialogBranch(dialog);
      if (!talkConfig.OtherDialog) {
        talkConfig.OtherDialog = [];
      }
      talkConfig.OtherDialog.push(dialogs);
    }

    // Handle Next Talks
    // -----------------
    debug(`Fetched dialogue branch - has ${talkConfig.NextTalks.length} Next Talks`);
    if (talkConfig.NextTalks) {
      if (!talkConfig.NextTalksDataList) {
        talkConfig.NextTalksDataList = [];
      }
      let finalNextTalks: number[] = [];
      for (let nextTalkId of talkConfig.NextTalks) {
        let nextTalkConfig = await this.handleTalkConfig(await this.ctrl.selectTalkExcelConfigDataByQuestSubId(nextTalkId), false);
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

export async function talkConfigGenerate(ctrl: GenshinControl, talkConfigId: number | TalkExcelConfigData, acc?: TalkConfigAccumulator): Promise<DialogueSectionResult> {
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

export async function talkConfigToDialogueSectionResult(ctrl: GenshinControl, parentSect: DialogueSectionResult | QuestGenerateResult,
                                                        sectName: string, sectHelptext: string, talkConfig: TalkExcelConfigData, dialogueDepth: number = 1): Promise<DialogueSectionResult> {
  let mysect = new DialogueSectionResult('Talk_' + talkConfig.Id, sectName, sectHelptext);
  mysect.originalData.talkConfig = talkConfig;

  mysect.addMetaProp('Talk ID', talkConfig.Id, '/branch-dialogue?q={}');
  mysect.addMetaProp('First Dialogue ID', talkConfig.InitDialog, '/branch-dialogue?q={}');
  if (talkConfig.QuestId) {
    if (talkConfig.LoadType === 'TALK_ACTIVITY') {
      mysect.addMetaProp('Activity ID', {value: talkConfig.QuestId, tooltip: await ctrl.selectNewActivityName(talkConfig.QuestId)});
    } else {
      mysect.addMetaProp('Quest ID', {value: talkConfig.QuestId, tooltip: await ctrl.selectMainQuestName(talkConfig.QuestId)}, '/quests/{}');
    }
  } else {
    let questIds = await dialogueToQuestId(ctrl, talkConfig);
    if (questIds.length) {
      mysect.addMetaProp('Quest ID', await questIds.asyncMap(async id => ({
        value: id,
        tooltip: await ctrl.selectMainQuestName(id)
      })), '/quests/{}');
    }
  }
  mysect.addMetaProp('Quest Idle Talk', talkConfig.QuestIdleTalk ? 'yes' : null);
  mysect.addMetaProp('NPC ID', talkConfig.NpcDataList?.map(npc => ({value: npc.Id, tooltip: npc.NameText})), '/npc-dialogue?q={}');
  mysect.addMetaProp('Next Talk IDs', talkConfig.NextTalks, '/branch-dialogue?q={}');

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
    } else
    if (beginCond.Type.startsWith('QUEST_COND_STATE_')) {
      let questExcel = await ctrl.selectQuestExcelConfigData(beginCond.Param[0]);
      let questName = questExcel ? await ctrl.selectMainQuestName(questExcel.MainId) : null;

      mysect.addMetaProp('Quest State Cond', [
        beginCond.Type.slice(17),
        {value: beginCond.Param[0], tooltip: questName, link: questExcel ? '/quests/' + questExcel.MainId : null},
        ... beginCond.Param.slice(1)
      ]);
    }
  }

  if (talkConfig.Dialog.length && ctrl.isPlayerDialogueOption(talkConfig.Dialog[0])) {
    dialogueDepth += 1;
  }

  let out = new SbOut();
  out.append(await ctrl.generateDialogueWikiText(talkConfig.Dialog, dialogueDepth));
  mysect.wikitext = out.toString();

  if (talkConfig.OtherDialog && talkConfig.OtherDialog.length) {
    for (let dialog of talkConfig.OtherDialog) {
      let otherSect = new DialogueSectionResult('OtherDialogue_'+dialog[0].Id, 'Other Dialogue');
      otherSect.originalData.dialogBranch = dialog;
      otherSect.metadata.push(new MetaProp('First Dialogue ID', dialog[0].Id, `/branch-dialogue?q=${dialog[0].Id}`));
      if (dialog[0].TalkType) {
        otherSect.metadata.push(new MetaProp('First Dialogue Talk Type', dialog[0].TalkType));
      }
      out.clearOut();
      out.append(await ctrl.generateDialogueWikiText(dialog));
      out.line();
      otherSect.wikitext = out.toString();
      mysect.children.push(otherSect);
    }
  }

  if (talkConfig.NextTalksDataList) {
    for (let nextTalkConfig of talkConfig.NextTalksDataList) {
      await talkConfigToDialogueSectionResult(ctrl, mysect, 'Next Talk', 'An immediate (but possibly conditional) continuation from the parent talk.<br>' +
        'This can happen for conditional dialogues and branching.<br><br>' +
        'Example 1: multiple talks leading to the same next talk.<br>' +
        'Example 2: a branch that might lead to one of the next talks depending on some condition.', nextTalkConfig, dialogueDepth);
    }
  }

  if (talkConfig.NextTalks) {
    // Get a list of next talk ids that are *not* in NextTalksDataList
    let skippedNextTalkIds = talkConfig.NextTalks.filter(myId => !talkConfig.NextTalksDataList.find(x => x.Id === myId));
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

// TRACE BACK AND REVERSE QUEST
// --------------------------------------------------------------------------------------------------------------

/**
 * Trace a dialog back to the first dialog of its section.
 *
 * There can be multiple results if there are multiple first dialogs that lead to the same dialog.
 */
export async function traceBack(ctrl: GenshinControl, dialog: DialogExcelConfigData): Promise<DialogExcelConfigData[]> {
  if (!dialog) {
    return undefined;
  }
  let stack: DialogExcelConfigData[] = [dialog];
  let ret: DialogExcelConfigData[] = [];
  let seenIds: Set<number> = new Set();

  while (true) {
    let nextStack = [];
    for (let d of stack) {
      let prevs: DialogExcelConfigData[] = await ctrl.selectPreviousDialogs(d.Id);
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
  return ret;
}

export async function guessQuestFromDialogueId(ctrl: GenshinControl, id: number | string): Promise<number> {
  if (typeof id === 'string') {
    if (isInt(id)) {
      id = parseInt(id);
    } else {
      return undefined;
    }
  }
  if (!id || id < 100) {
    return undefined; // minimum quest id is 3 digits
  }

  let strId = id.toString().padStart(9, '0');

  // Most dialogue IDs are in the format of xxxxx|yy|zz (9 digits)
  //  xxxxx - quest ID
  //  yy - step id
  //  zz - line id (sometimes can be 3 digits as "zzz")
  // when the dialogue ID is less than 9 digits, it should be '0'-padded to the left

  // largest quest ID has 5 digits
  // smallest quest ID has 3
  for (let n of [3, 4, 5]) {
    let sub = parseInt(strId.slice(0, n));
    if (await ctrl.doesQuestExist(sub)) {
      return sub;
    }
  }
  return undefined;
}

/**
 *
 * @param ctrl Control
 * @param query Either dialogue text, dialogue/talk id, or instance.
 */
export async function dialogueToQuestId(ctrl: GenshinControl, query: string | number | DialogExcelConfigData | TalkExcelConfigData): Promise<number[]> {
  let talk: TalkExcelConfigData;
  let dialog: DialogExcelConfigData;

  if (typeof query === 'string' && isInt(query)) {
    query = parseInt(query);
  }
  if (typeof query === 'string') {
    let textmapHashes = (await ctrl.getTextMapMatches(ctrl.inputLangCode, query, '-m 1')).map(x => x.hash); // only get one match
    if (!textmapHashes.length) {
      return [];
    }
    dialog = (await ctrl.selectDialogsFromTextContentId(textmapHashes[0]))[0];
  }
  if (typeof query === 'number') {
    talk = await ctrl.selectTalkExcelConfigDataById(query);
    dialog = await ctrl.selectSingleDialogExcelConfigData(query);
  }
  if (typeof query === 'object') {
    if (query.hasOwnProperty('QuestId') || query.hasOwnProperty('InitDialog')) {
      talk = query as TalkExcelConfigData;
    }
    if (query.hasOwnProperty('TalkContentTextMapHash')) {
      dialog = query as DialogExcelConfigData;
    }
  }
  if (talk && talk.QuestId) {
    return [talk.QuestId];
  }
  if (!dialog) {
    return [];
  }
  let ret = [];
  let firstDialogs = await traceBack(ctrl, dialog);
  for (let d of firstDialogs) {
    let talks = await ctrl.selectTalkExcelConfigDataListByFirstDialogueId(d.Id);
    for (let t of talks) {
      if (t && t.QuestId) {
        ret.push(t.QuestId);
      }
    }
  }
  if (ret.length) {
    return ret;
  }
  for (let d of firstDialogs) {
    let qId = await guessQuestFromDialogueId(ctrl, d.Id);
    if (qId) {
      ret.push(qId);
    }
  }
  return ret;
}

// QUEST ORDERING
// --------------------------------------------------------------------------------------------------------------
export interface QuestOrderItem {
  quest: MainQuestExcelConfigData;
  subquests?: QuestOrderItem[];
}

export async function orderChapterQuests(ctrl: GenshinControl, chapter: ChapterExcelConfigData): Promise<QuestOrderItem[]> {
  if (!chapter) {
    return [];
  }
  const globalVarIds: number[] = await cached('GlobalVars', async () => {
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

// CLI TESTING
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