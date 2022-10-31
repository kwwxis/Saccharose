import '../../setup';
import {closeKnex, openKnex} from '@db';
import { arrayUnique, arrayEmpty, getControl, ControlPrefs, stringify, Control, normText } from '@/scripts/script_util';
import { ol_gen } from '@/scripts/OLgen/OLgen';
import { getTextMapItem, QuestSummary } from '../textmap';
import {
  ConfigCondition,
  MainQuestExcelConfigData, QuestExcelConfigData,
  TalkExcelConfigData,
  NpcExcelConfigData
} from '@types';

export class MetaPropValue {
  value: string;
  link?: string;
  constructor(value: string, link?: string) {
    this.value = value;
    this.link = link;
  }
}

export class MetaProp {
  label: string;
  values: MetaPropValue[] = [];

  constructor(label: string, values: string|number|string[]|number[]|MetaPropValue[], link?: string) {
    this.label = label;

    if (typeof values === 'string' || typeof values === 'number') {
      this.values.push(new MetaPropValue(String(values), link ? link.replace('{}', String(values)) : link));
    } else if (Array.isArray(values) && values.length > 0) {
      if (typeof values[0] === 'string' || typeof values[0] === 'number') {
        for (let value of values) {
          this.values.push(new MetaPropValue(String(value), link ? link.replace('{}', String(value)) : link));
        }
      } else if (values[0] instanceof MetaPropValue) {
        this.values.push(... (values as MetaPropValue[]));
      }
    }
  }
}

export class DialogueSectionResult {
  id: string = null;
  title: string = null;
  metadata: MetaProp[] = [];
  helptext: string = null;
  wikitext: string = null;
  wikitextArray: string[] = [];
  children: DialogueSectionResult[] = [];
  htmlMessage: string = null;

  constructor(id: string, title: string, helptext: string = null) {
    this.id = id;
    this.title = title;
    this.helptext = helptext;
  }

  addMetaProp(label: string, values: string|number|string[]|number[]|MetaPropValue[], link?: string) {
    if (!values || (Array.isArray(values) && !values.length)) {
      return;
    }
    this.metadata.push(new MetaProp(label, values, link));
  }

  addCondMetaProp(fieldName: string, condComb: string, condList: ConfigCondition[]) {
    let label = fieldName + (condComb ? '[Comb='+condComb+']' : '');
    let values = [];
    if (condList && condList.length) {
      for (let cond of condList) {
        let str = '('+'Type=' + cond.Type + (cond.Param ? ' Param=' + JSON.stringify(cond.Param) : '')
          + (cond.ParamStr ? ' ParamStr=' + cond.ParamStr : '')
          + (cond.Count ? ' Count=' + cond.Count : '')+')';
        values.push(str);
      }
    }
    this.addMetaProp(label, values);
  }
}

export class QuestGenerateResult {
  mainQuest: MainQuestExcelConfigData = null;
  questTitle: string;
  questId: number;
  npc: {
    names: string[],
    data: {[Id: number]: NpcExcelConfigData},
  } = {names: [], data: {}};

  stepsWikitext: string = null;
  questDescriptions: string[] = [];
  otherLanguagesWikitext: string = null;
  dialogue: DialogueSectionResult[] = [];
  travelLogSummary: string[] = [];
}

export class SbOut {
  private out = '';
  toString() {
    return this.out;
  }
  get() {
    return this.out;
  }
  append(str: string) {
    this.out += str;
  }
  line(text?: string) {
    this.out += '\n' + (text || '');
  }
  clearOut() {
    this.out = '';
  }
}

/**
 * Generates quest dialogue.
 *
 * @param questNameOrId The name or id of the main quest. Name must be an exact match and is case sensitive. Leading/trailing whitespace will be trimmed.
 * @param mainQuestIndex If multiple main quests match the name given, then this index can be used to select a specific one.
 * @param prefs Preferences for quest generation and output.
 */
export async function questGenerate(questNameOrId: string|number, ctrl: Control, mainQuestIndex: number = 0): Promise<QuestGenerateResult> {
  const result = new QuestGenerateResult();

  // MAIN QUEST GENERATION
  // ~~~~~~~~~~~~~~~~~~~~~

  // Find Main Quest and Quest Subs
  const mainQuests: MainQuestExcelConfigData[] = typeof questNameOrId === 'string'
      ? await ctrl.selectMainQuestsByNameOrId(questNameOrId.trim())
      : [await ctrl.selectMainQuestById(questNameOrId)];

  const mainQuest = mainQuests.length ? mainQuests[mainQuestIndex] : null;

  if (!mainQuest || !mainQuest.Id) {
    throw 'Main Quest not found.';
  }
  mainQuest.QuestExcelConfigDataList = await ctrl.selectQuestByMainQuestId(mainQuest.Id);
  mainQuest.OrphanedTalkExcelConfigDataList = [];

  // Fetch talk configs
  // ------------------

  // Fetch talk configs
  const talkConfigAcc = new TalkConfigAccumulator(ctrl);

  // Fetch Talk Configs by Main Quest Id (exact)
  for (let talkConfig of (await ctrl.selectTalkExcelConfigDataByQuestId(mainQuest.Id))) {
    await talkConfigAcc.handleTalkConfig(talkConfig);
  }

  // Find Talk Configs by Quest Sub Id
  for (let questExcelConfigData of mainQuest.QuestExcelConfigDataList) {
    if (talkConfigAcc.fetchedTalkConfigIds.includes(questExcelConfigData.SubId)) {
      continue;
    }
    let talkConfig = await ctrl.selectTalkExcelConfigDataByQuestSubId(questExcelConfigData.SubId);
    await talkConfigAcc.handleTalkConfig(talkConfig);
  }

  // Fetch Talk Configs by Main Quest Id (prefix)
  let talkConfigIdsByMainQuestIdPrefix: number[] = await ctrl.selectTalkExcelConfigDataIdsByPrefix(mainQuest.Id);
  for (let talkConfigId of talkConfigIdsByMainQuestIdPrefix) {
    if (talkConfigAcc.fetchedTalkConfigIds.includes(talkConfigId)) {
      continue;
    }
    let talkConfig = await ctrl.selectTalkExcelConfigDataById(talkConfigId);
    await talkConfigAcc.handleTalkConfig(talkConfig);
  }

  // Find orphaned dialogue
  // ----------------------

  // Add other orphaned dialogue and quest messages (after fetching talk configs)
  await ctrl.addOrphanedDialogueAndQuestMessages(mainQuest);

  // Sort Talk Configs to quest subs
  // -------------------------------

  // Talk Configs aren't always in the right section, so we have a somewhat complicated method to place them in the right place
  function pushTalkConfigToCorrespondingQuestSub(talkConfig: TalkExcelConfigData) {
    if (ctrl.getPrefs().TalkConfigDataBeginCond[talkConfig.Id]) {
      talkConfig.BeginCond = [ctrl.getPrefs().TalkConfigDataBeginCond[talkConfig.Id]];
    }

    const questExcelConfigData = mainQuest.QuestExcelConfigDataList.find(q => q.SubId === talkConfig.Id);

    if (talkConfig.BeginCond) {
      let params: {paramQuestSubId: number, paramValue: number}[] = [];
      for (let cond of talkConfig.BeginCond) {
        if (cond.Type === 'QUEST_COND_STATE_EQUAL' && cond.Param.length === 2) {
          let paramQuestSubId = typeof cond.Param[0] === 'number' ? cond.Param[0] : parseInt(cond.Param[0]);
          let paramValue = typeof cond.Param[1] === 'number' ? cond.Param[1] : parseInt(cond.Param[1]); // 2 - before the questSub, 3 - after the questSub
          params.push({ paramQuestSubId, paramValue });
        }
      }
    }
    if (questExcelConfigData) {
      if (!questExcelConfigData.TalkExcelConfigDataList)
        questExcelConfigData.TalkExcelConfigDataList = [];
      questExcelConfigData.TalkExcelConfigDataList.push(talkConfig);
      return;
    }
    mainQuest.OrphanedTalkExcelConfigDataList.push(talkConfig);
  }

  // Push Talk Configs to appropriate sections (after fetching orphaned dialogue)
  for (let talkConfig of talkConfigAcc.fetchedTopLevelTalkConfigs) {
    pushTalkConfigToCorrespondingQuestSub(talkConfig);
  }

  // Filter quest subs
  // -----------------

  // Skip quest subs without dialogue/DescTest/StepDescTest.
  let newQuestSubs: QuestExcelConfigData[] = [];
  for (let questSub of mainQuest.QuestExcelConfigDataList) {
    if (arrayEmpty(questSub.OrphanedDialog) && arrayEmpty(questSub.QuestMessages) && arrayEmpty(questSub.TalkExcelConfigDataList)) {
      if (questSub.DescText || questSub.StepDescText) {
        newQuestSubs.push(questSub);
      }
    } else {
      newQuestSubs.push(questSub);
    }
  }

  // Finalize result
  // ---------------
  mainQuest.QuestExcelConfigDataList = newQuestSubs;
  result.questId = mainQuest.Id;
  result.questTitle = mainQuest.TitleText;
  result.mainQuest = mainQuest;
  result.npc = {
    names: arrayUnique(Object.values(ctrl.getPrefs().npcCache).filter(x => !!x.BodyType).map(x => x.NameText).concat('Traveler').sort()),
    data: ctrl.getPrefs().npcCache,
  };

  // WIKI TEXT GENERATION
  // ~~~~~~~~~~~~~~~~~~~~
  let out = new SbOut();

  // Quest Steps
  // -----------
  out.clearOut();
  for (let questSub of mainQuest.QuestExcelConfigDataList) {
    if (questSub.DescText)
      out.line('# ' + normText(questSub.DescText));
  }
  result.stepsWikitext = out.toString();

  // Quest Descriptions
  // ------------------
  out.clearOut();

  result.questDescriptions.push('{{Quest Description|'+mainQuest.DescText+'}}');
  for (let questSub of mainQuest.QuestExcelConfigDataList) {
    if (!questSub.StepDescText) {
      continue;
    }
    let desc = '{{Quest Description|update|'+questSub.StepDescText+'}}';
    if (!result.questDescriptions.includes(desc)) {
      result.questDescriptions.push(desc);
    }
  }

  // Other Languages
  // ---------------
  out.clearOut();
  let olResults = await ol_gen(ctrl, mainQuest.TitleTextEN, false, false, 'EN');
  for (let olResult of olResults) {
    out.line(olResult);
  }
  result.otherLanguagesWikitext = out.toString();

  // Quest Dialogue
  // --------------
  out.clearOut();

  const orphanedHelpText = `"Orphaned" means that the script didn't find anything conclusive in the JSON associating this dialogue to the quest. The tool assumes it's associated based on the dialogue IDs.`;
  const questMessageHelpText = `These are usually black-screen transition lines. There isn't any info in the JSON to show where these lines go chronologically within the section, so you'll have to figure that out.`;

  for (let questSub of mainQuest.QuestExcelConfigDataList) {
    let sect = new DialogueSectionResult('Section_'+questSub.SubId, 'Section');

    out.clearOut();
    sect.addMetaProp('Section ID', questSub.SubId);
    sect.addMetaProp('Section Order', questSub.Order);
    sect.addMetaProp('Quest Step', questSub.DescText);
    sect.addMetaProp('Quest Desc Update', questSub.StepDescText);
    sect.addCondMetaProp('AcceptCond', questSub.AcceptCondComb, questSub.AcceptCond);
    sect.addCondMetaProp('FinishCond', questSub.FinishCondComb, questSub.FinishCond);
    sect.addCondMetaProp('FailCond', questSub.FailCondComb, questSub.FailCond);

    if (questSub.OrphanedDialog && questSub.OrphanedDialog.length) {
      for (let dialog of questSub.OrphanedDialog) {
        let subsect = new DialogueSectionResult('OrphanedDialogue_'+dialog[0].Id, 'Orphaned Dialogue', orphanedHelpText);
        subsect.metadata.push(new MetaProp('First Dialogue ID', dialog[0].Id, `/branch-dialogue?q=${dialog[0].Id}`));
        out.clearOut();
        out.append(await ctrl.generateDialogueWikiText(dialog));
        subsect.wikitext = out.toString();
        sect.children.push(subsect);
      }
    }

    if (questSub.TalkExcelConfigDataList && questSub.TalkExcelConfigDataList.length
          && questSub.TalkExcelConfigDataList.every(x => x.Dialog && x.Dialog.length)) {
      for (let talkConfig of questSub.TalkExcelConfigDataList) {
        await talkConfigToDialogueSectionResult(ctrl, sect, 'Talk Dialogue', null, talkConfig);
      }
    }

    if (questSub.QuestMessages && questSub.QuestMessages.length) {
      let subsect = new DialogueSectionResult('SectionQuestMessages_'+questSub.SubId, 'Section Quest Messages', questMessageHelpText);
      out.clearOut();
      for (let questMessage of questSub.QuestMessages) {
        if (typeof questMessage.TextMapContentText === 'string') {
          subsect.wikitextArray.push(questMessage.TextMapContentText.replace(/\\n/g, '\n').split('\n').map(line => `:'''${line}'''`).join('\n'));
        }
      }
      if (subsect.wikitextArray.length) {
        sect.children.push(subsect);
      }
    }

    result.dialogue.push(sect);
  }

  if (mainQuest.OrphanedDialog && mainQuest.OrphanedDialog.length) {
    for (let dialog of mainQuest.OrphanedDialog) {
      let sect = new DialogueSectionResult('OrphanedDialogue_'+dialog[0].Id, 'Orphaned Dialogue', orphanedHelpText);
      sect.metadata.push(new MetaProp('First Dialogue ID', dialog[0].Id, `/branch-dialogue?q=${dialog[0].Id}`));
      out.clearOut();
      out.append(await ctrl.generateDialogueWikiText(dialog));
      out.line();
      sect.wikitext = out.toString();
      result.dialogue.push(sect);
    }
  }
  if (mainQuest.OrphanedTalkExcelConfigDataList && mainQuest.OrphanedTalkExcelConfigDataList.length
      && mainQuest.OrphanedTalkExcelConfigDataList.every(x => x.Dialog && x.Dialog.length)) {
    for (let talkConfig of mainQuest.OrphanedTalkExcelConfigDataList) {
      await talkConfigToDialogueSectionResult(ctrl, result, 'Unsectioned Talk Dialogue', 'These are Talk Dialogues that are part of the quest but not part of any section.', talkConfig);
    }
  }
  if (mainQuest.QuestMessages && mainQuest.QuestMessages.length) {
    let sect = new DialogueSectionResult('MainQuestMessages', 'Quest Messages', questMessageHelpText);
    out.clearOut();
    for (let questMessage of mainQuest.QuestMessages) {
      if (typeof questMessage.TextMapContentText === 'string') {
        sect.wikitextArray.push(questMessage.TextMapContentText.replace(/\\n/g, '\n').split('\n').map(line => `:'''${line}'''`).join('\n'));
      }
    }
    if (sect.wikitextArray.length) {
      result.dialogue.push(sect);
    }
  }

  // Travel Log Summary
  // ------------------
  let summaryKeys = Object.keys(QuestSummary);
  for (let summaryKey of summaryKeys) {
    if (summaryKey.startsWith(String(mainQuest.Id))) {
      let text = normText(getTextMapItem(ctrl.outputLangCode, QuestSummary[summaryKey]));
      if (text.includes('<br')) {
        result.travelLogSummary.push('{{Cutscene Description|'+text+'}}');
      } else {
        result.travelLogSummary.push(':{{color|menu|'+text+'}}');
      }
    }
  }

  return result;
}

if (require.main === module) {
  (async () => {
    let result: QuestGenerateResult = await questGenerate(`Radiant Sakura`, getControl());
    console.log(stringify(result.dialogue));
    closeKnex();
  })();
}

export class TalkConfigAccumulator {
  readonly fetchedTalkConfigIds: number[] = [];
  readonly fetchedTopLevelTalkConfigs: TalkExcelConfigData[] = [];

  constructor(private ctrl: Control) {}

  async handleTalkConfig(talkConfig: TalkExcelConfigData, isTopLevel: boolean = true): Promise<TalkExcelConfigData> {
    if (!talkConfig || this.fetchedTalkConfigIds.includes(talkConfig.Id)) {
      return null; // skip if not found or if already found
    }
    this.fetchedTalkConfigIds.push(talkConfig.Id);
    if (!!talkConfig.InitDialog) {
      talkConfig.Dialog = await this.ctrl.selectDialogBranch(await this.ctrl.selectSingleDialogExcelConfigData(talkConfig.InitDialog));
    } else {
      talkConfig.Dialog = [];
    }
    if (isTopLevel) {
      this.fetchedTopLevelTalkConfigs.push(talkConfig);
    }
    if (talkConfig.NextTalks) {
      if (!talkConfig.NextTalksDataList) {
        talkConfig.NextTalksDataList = [];
      }
      let finalNextTalks: number[] = [];
      for (let nextTalkId of talkConfig.NextTalks) {
        let nextTalkConfig = await this.handleTalkConfig(await this.ctrl.selectTalkExcelConfigDataByQuestSubId(nextTalkId), false);
        if (nextTalkConfig) {
          let prevTalkConfig: TalkExcelConfigData = null;
          if (talkConfig.NextTalksDataList.length) {
            prevTalkConfig = talkConfig.NextTalksDataList[talkConfig.NextTalksDataList.length - 1];
          }
          if (prevTalkConfig && this.ctrl.equivDialog(prevTalkConfig.Dialog[0], nextTalkConfig.Dialog[0])) {
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


export async function talkConfigToDialogueSectionResult(ctrl: Control, parentSect: DialogueSectionResult|QuestGenerateResult,
    sectName: string, sectHelptext: string, talkConfig: TalkExcelConfigData, dialogueDepth: number = 1): Promise<DialogueSectionResult> {
  let mysect = new DialogueSectionResult('TalkDialogue_'+talkConfig.Id, sectName, sectHelptext);

  mysect.addMetaProp('Talk ID', talkConfig.Id, '/branch-dialogue?q={}');
  mysect.addMetaProp('Quest ID', talkConfig.QuestId, '/quests/{}');
  mysect.addMetaProp('Quest Idle Talk', talkConfig.QuestIdleTalk ? 'yes' : null);
  mysect.addMetaProp('NPC ID', talkConfig.NpcId, '/npc-dialogue?q={}');
  mysect.addMetaProp('Next Talk IDs', talkConfig.NextTalks, '/branch-dialogue?q={}');

  if (talkConfig.Dialog.length && ctrl.isPlayerDialogueOption(talkConfig.Dialog[0])) {
    dialogueDepth += 1;
  }

  let out = new SbOut();
  out.append(await ctrl.generateDialogueWikiText(talkConfig.Dialog, dialogueDepth));
  mysect.wikitext = out.toString();

  if (talkConfig.NextTalksDataList) {
    for (let nextTalkConfig of talkConfig.NextTalksDataList) {
      await talkConfigToDialogueSectionResult(ctrl, mysect, 'Next Talk Dialogue', 'An immediate (but possibly conditional) continuation from the parent talk dialogue.<br>' +
      'This can happen for conditional dialogues and branching.<br><br>'+
      'Example 1: multiple talk dialogues leading to the same next talk dialogue.<br>'+
      'Example 2: a branch that might lead to one of the next talk dialogues depending on some condition.', nextTalkConfig, dialogueDepth);
    }
  }

  if (talkConfig.NextTalks) {
    // Get a list of next talk ids that are *not* in NextTalksDataList
    let skippedNextTalkIds = talkConfig.NextTalks.filter(myId => !talkConfig.NextTalksDataList.find(x => x.Id === myId));
    for (let nextTalkId of skippedNextTalkIds) {
      let placeholderSect = new DialogueSectionResult(null, 'Next Talk Dialogue');
      placeholderSect.metadata.push(new MetaProp('Talk ID', nextTalkId, `/branch-dialogue?q=${nextTalkId}`));
      placeholderSect.htmlMessage = `<p>This section contains dialogue but wasn't shown because the section is already present on the page.
      This can happen when multiple talk dialogues lead to the same next talk dialogue.</p>
      <p><a href="#TalkDialogue_${nextTalkId}">Jump to Talk Dialogue ${nextTalkId}</a></p>`;
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