import '../../setup';
import {closeKnex, openKnex} from '@db';
import { arrayUnique, arrayEmpty, getControl, ControlPrefs, stringify, Control } from '@/scripts/script_util';
import { ol_gen } from '@/scripts/OLgen/OLgen';
import {
  ConfigCondition,
  MainQuestExcelConfigData, QuestExcelConfigData,
  TalkExcelConfigData,
  NpcExcelConfigData
} from '@types';
import config from '@/config';

export class DialogueSectionResult {
  id: string = null;
  title: string = null;
  helptext: string = null;
  metatext: string = null;
  wikitext: string = null;
  wikitextArray: string[] = [];
  children: DialogueSectionResult[] = [];
  htmlMessage: string = null;

  constructor(id: string, title: string, helptext: string = null) {
    this.id = id;
    this.title = title;
    this.helptext = helptext;
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
      ? await ctrl.selectMainQuestsByNameOrIds(questNameOrId.trim())
      : [await ctrl.selectMainQuestById(questNameOrId)];

  const mainQuest = mainQuests.length ? mainQuests[mainQuestIndex] : null;

  if (!mainQuest || !mainQuest.Id) {
    throw 'Main Quest not found.';
  }
  mainQuest.QuestExcelConfigDataList = await ctrl.selectQuestByMainQuestId(mainQuest.Id);
  mainQuest.OrphanedTalkExcelConfigDataList = [];

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

  // Fetch talk configs
  const fetchedTalkConfigIds: number[] = [];
  const fetchedTopLevelTalkConfigs: TalkExcelConfigData[] = [];

  async function handleTalkConfig(talkConfig: TalkExcelConfigData, isTopLevel: boolean = true): Promise<TalkExcelConfigData> {
    if (!talkConfig || fetchedTalkConfigIds.includes(talkConfig.Id)) {
      return null; // skip if not found or if already found
    }
    fetchedTalkConfigIds.push(talkConfig.Id);
    if (!!talkConfig.InitDialog) {
      talkConfig.Dialog = await ctrl.selectDialogBranch(await ctrl.selectSingleDialogExcelConfigData(talkConfig.InitDialog));
    }
    if (isTopLevel) {
      fetchedTopLevelTalkConfigs.push(talkConfig);
    }
    if (talkConfig.NextTalks) {
      if (!talkConfig.NextTalksDataList) {
        talkConfig.NextTalksDataList = [];
      }
      for (let nextTalkId of talkConfig.NextTalks) {
        let nextTalkConfig = await handleTalkConfig(await ctrl.selectTalkExcelConfigDataByQuestSubId(nextTalkId), false);
        if (nextTalkConfig) {
          talkConfig.NextTalksDataList.push(nextTalkConfig);
        }
      }
    }
    return talkConfig;
  }

  // Fetch Talk Configs by Main Quest Id (exact)
  for (let talkConfig of (await ctrl.selectTalkExcelConfigDataByQuestId(mainQuest.Id))) {
    await handleTalkConfig(talkConfig);
  }

  // Find Talk Configs by Quest Sub Id
  for (let questExcelConfigData of mainQuest.QuestExcelConfigDataList) {
    if (fetchedTalkConfigIds.includes(questExcelConfigData.SubId)) {
      continue;
    }
    let talkConfig = await ctrl.selectTalkExcelConfigDataByQuestSubId(questExcelConfigData.SubId);
    await handleTalkConfig(talkConfig);
  }

  // Fetch Talk Configs by Main Quest Id (prefix)
  let talkConfigIdsByMainQuestIdPrefix: number[] = await ctrl.selectTalkExcelConfigDataIdsByPrefix(mainQuest.Id);
  for (let talkConfigId of talkConfigIdsByMainQuestIdPrefix) {
    if (fetchedTalkConfigIds.includes(talkConfigId)) {
      continue;
    }
    let talkConfig = await ctrl.selectTalkExcelConfigDataById(talkConfigId);
    await handleTalkConfig(talkConfig);
  }

  // Add other orphaned dialogue and quest messages (after fetching talk configs)
  await ctrl.addOrphanedDialogueAndQuestMessages(mainQuest);

  // Push Talk Configs to appropriate sections (after fetching orphaned dialogue)
  for (let talkConfig of fetchedTopLevelTalkConfigs) {
    pushTalkConfigToCorrespondingQuestSub(talkConfig);
  }

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

  // Helper Methods
  // --------------
  let out = '';
  const line = (text?: string) => {
    out += '\n' + (text || '');
  };
  const clearOut = () => out = '';
  const lineProp = (label: string, prop: any) => {
    if (!prop)
      return;
    if (label.includes('%s')) {
      line(label.replace('%s', prop));
    } else {
      line(`${label}: ${prop}`);
    }
  }
  function printCond(fieldName: string, condComb: string, condList: ConfigCondition[]) {
    let out = '';
    if (condList && condList.length) {
      out += fieldName + (condComb ? '[Comb='+condComb+']' : '') + ': ';
      for (let i = 0; i < condList.length; i++) {
        let cond = condList[i];
        if (i !== 0) {
          out += ', ';
        }
        out += '('+'Type=' + cond.Type + (cond.Param ? ' Param=' + JSON.stringify(cond.Param) : '')
            + (cond.ParamStr ? ' ParamStr=' + cond.ParamStr : '')
            + (cond.Count ? ' Count=' + cond.Count : '')+')';
      }
    }
    if (out) {
      line(out);
    }
  }

  // Quest Steps
  // -----------
  clearOut();
  for (let questSub of mainQuest.QuestExcelConfigDataList) {
    if (questSub.DescText)
      line('# ' + questSub.DescText);
  }
  result.stepsWikitext = out;

  // Quest Descriptions
  // ------------------
  clearOut();

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
  clearOut();
  line(await ol_gen(ctrl, mainQuest.TitleText));
  result.otherLanguagesWikitext = out;

  // Quest Dialogue
  // --------------
  clearOut();

  const orphanedHelpText = `"Orphaned" means that the script didn't find anything conclusive in the JSON associating this dialogue to the quest. The tool assumes it's associated based on the dialogue IDs.`;
  const questMessageHelpText = `These are usually black-screen transition lines. There isn't any info in the JSON to show where these lines go chronologically within the section, so you'll have to figure that out.`;

  async function handleTalkDialogue(parentSect: DialogueSectionResult|QuestGenerateResult, sectName: string, sectHelptext: string, talkConfig: TalkExcelConfigData) {
    let mysect = new DialogueSectionResult('TalkDialogue_'+talkConfig.Id, sectName, sectHelptext);
    clearOut();
    lineProp('TalkConfigId', talkConfig.Id);
    //lineProp('BeginWay', talkConfig.BeginWay);
    //printCond('BeginCond', talkConfig.BeginCondComb, talkConfig.BeginCond);
    lineProp('QuestIdleTalk', talkConfig.QuestIdleTalk ? 'yes' : null);
    lineProp('NextTalks', talkConfig.NextTalks && talkConfig.NextTalks.length ? talkConfig.NextTalks.join(', ') : null);
    mysect.metatext = out;

    clearOut();
    line('{{Dialogue start}}');
    out += await ctrl.generateDialogueWikiText(talkConfig.Dialog);
    line('{{Dialogue end}}');
    mysect.wikitext = out;

    if (talkConfig.NextTalksDataList) {
      for (let nextTalkConfig of talkConfig.NextTalksDataList) {
        await handleTalkDialogue(mysect, 'Next Talk Dialogue', 'An immediate continuation from the parent talk dialogue. ' +
        'This can happen for conditional dialogues (ex. multiple talk dialogues leading to the same next talk dialogue).', nextTalkConfig);
      }
    }

    if (talkConfig.NextTalks) {
      // Get a list of next talk ids that are *not* in NextTalksDataList
      let skippedNextTalkIds = talkConfig.NextTalks.filter(myId => !talkConfig.NextTalksDataList.find(x => x.Id === myId));
      for (let nextTalkId of skippedNextTalkIds) {
        let placeholderSect = new DialogueSectionResult(null, 'Next Talk Dialogue');
        clearOut();
        lineProp('TalkConfigId', nextTalkId);
        placeholderSect.metatext = out;
        placeholderSect.htmlMessage = `<p>This section contains dialogue but wasn't shown because the section is already present on the page.
        This can happen when multiple talk dialogues lead to the same next talk dialogue.</p>
        <p><a href="#TalkDialogue_${nextTalkId}">Jump to Talk Dialogue ${nextTalkId}</a></p>`;
        mysect.children.push(placeholderSect);
      }
    }

    if (parentSect instanceof QuestGenerateResult) {
      parentSect.dialogue.push(mysect);
    } else {
      parentSect.children.push(mysect);
    }
  }

  for (let questSub of mainQuest.QuestExcelConfigDataList) {
    let sect = new DialogueSectionResult('Section_'+questSub.SubId, 'Section');

    clearOut();
    lineProp('Section Id', questSub.SubId);
    lineProp('Section Order', questSub.Order);
    lineProp('Quest Step', questSub.DescText);
    lineProp('Quest Desc Update', questSub.StepDescText);
    printCond('AcceptCond', questSub.AcceptCondComb, questSub.AcceptCond);
    printCond('FinishCond', questSub.FinishCondComb, questSub.FinishCond);
    printCond('FailCond', questSub.FailCondComb, questSub.FailCond);
    sect.metatext = out;

    if (questSub.OrphanedDialog && questSub.OrphanedDialog.length) {
      for (let dialog of questSub.OrphanedDialog) {
        let subsect = new DialogueSectionResult('OrphanedDialogue_'+dialog[0].Id, 'Orphaned Dialogue', orphanedHelpText);
        clearOut();
        line('{{Dialogue start}}');
        out += await ctrl.generateDialogueWikiText(dialog);
        line('{{Dialogue end}}');
        subsect.wikitext = out;
        sect.children.push(subsect);
      }
    }

    if (questSub.TalkExcelConfigDataList && questSub.TalkExcelConfigDataList.length
          && questSub.TalkExcelConfigDataList.every(x => x.Dialog && x.Dialog.length)) {
      for (let talkConfig of questSub.TalkExcelConfigDataList) {
        await handleTalkDialogue(sect, 'Talk Dialogue', null, talkConfig);
      }
    }

    if (questSub.QuestMessages && questSub.QuestMessages.length) {
      let subsect = new DialogueSectionResult('SectionQuestMessages_'+questSub.SubId, 'Section Quest Messages', questMessageHelpText);
      clearOut();
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
      clearOut();
      line('{{Dialogue start}}');
      out += await ctrl.generateDialogueWikiText(dialog);
      line('{{Dialogue end}}');
      line();
      sect.wikitext = out;
      result.dialogue.push(sect);
    }
  }
  if (mainQuest.OrphanedTalkExcelConfigDataList && mainQuest.OrphanedTalkExcelConfigDataList.length
      && mainQuest.OrphanedTalkExcelConfigDataList.every(x => x.Dialog && x.Dialog.length)) {
    for (let talkConfig of mainQuest.OrphanedTalkExcelConfigDataList) {
      await handleTalkDialogue(result, 'Orphaned Talk Dialogue', null, talkConfig);
    }
  }
  if (mainQuest.QuestMessages && mainQuest.QuestMessages.length) {
    let sect = new DialogueSectionResult('MainQuestMessages', 'Quest Messages', questMessageHelpText);
    clearOut();
    for (let questMessage of mainQuest.QuestMessages) {
      if (typeof questMessage.TextMapContentText === 'string') {
        sect.wikitextArray.push(questMessage.TextMapContentText.replace(/\\n/g, '\n').split('\n').map(line => `:'''${line}'''`).join('\n'));
      }
    }
    if (sect.wikitextArray.length) {
      result.dialogue.push(sect);
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