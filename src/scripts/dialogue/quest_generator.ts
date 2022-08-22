import '../../setup';
import {closeKnex, openKnex} from '@db';
import { arrayUnique, arrayEmpty, getControl, OverridePrefs, stringify } from '@/scripts/script_util';
import { ol_gen } from '@/scripts/OLgen/OLgen';
import {
  ConfigCondition,
  MainQuestExcelConfigData, QuestExcelConfigData,
  TalkExcelConfigData,
  NpcExcelConfigData
} from '@types';
import config from '@/config';

export class DialogueSectionResult {
  title: string = null;
  helptext: string = null;
  metatext: string = null;
  wikitext: string = null;
  wikitextArray: string[] = [];
  children: DialogueSectionResult[] = [];

  constructor(title: string, helptext: string = null) {
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

  templateWikitext: string = null;
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
export async function questGenerate(questNameOrId: string|number, mainQuestIndex: number = 0, prefs?: OverridePrefs): Promise<QuestGenerateResult> {
  const result = new QuestGenerateResult();

  if (!prefs) {
    prefs = new OverridePrefs();
  }

  const knex = openKnex();
  const ctrl = getControl(knex, prefs);

  // MAIN QUEST GENERATION
  // ~~~~~~~~~~~~~~~~~~~~~

  // Find Main Quest and Quest Subs
  const mainQuests: MainQuestExcelConfigData[] = typeof questNameOrId === 'string'
      ? await ctrl.selectMainQuestsByName(questNameOrId.trim())
      : [await ctrl.selectMainQuestById(questNameOrId)];

  const mainQuest = mainQuests.length ? mainQuests[mainQuestIndex] : null;

  if (!mainQuest || !mainQuest.Id) {
    throw 'Main Quest not found.';
  }
  mainQuest.QuestExcelConfigDataList = await ctrl.selectQuestByMainQuestId(mainQuest.Id);
  mainQuest.OrphanedTalkExcelConfigDataList = [];

  // Talk Configs aren't always in the right section, so we have a somewhat complicated method to place them in the right place
  function pushTalkConfigToCorrespondingQuestSub(talkConfig: TalkExcelConfigData) {
    if (prefs.TalkConfigDataBeginCond[talkConfig.Id]) {
      talkConfig.BeginCond = [prefs.TalkConfigDataBeginCond[talkConfig.Id]];
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
  const fetchedTalkConfigs: TalkExcelConfigData[] = [];

  // Fetch Talk Config by Main Quest Id
  for (let talkConfig of (await ctrl.selectTalkExcelConfigDataByQuestId(mainQuest.Id))) {
    if (!talkConfig.InitDialog) {
      console.warn('Talk Config without InitDialog', talkConfig);
      continue;
    }
    talkConfig.Dialog = await ctrl.selectDialogBranch(await ctrl.selectSingleDialogExcelConfigData(talkConfig.InitDialog));
    fetchedTalkConfigIds.push(talkConfig.Id);
    fetchedTalkConfigs.push(talkConfig);
  }

  // Find Talk Config by Quest Sub Id
  for (let questExcelConfigData of mainQuest.QuestExcelConfigDataList) {
    let talkConfig = await ctrl.selectTalkExcelConfigDataByQuestSubId(questExcelConfigData.SubId);
    if (talkConfig && !talkConfig.InitDialog) {
      console.warn('Talk Config without InitDialog', talkConfig);
      continue;
    }
    if (!talkConfig || fetchedTalkConfigIds.includes(talkConfig.Id)) {
      continue; // skip if not found or if already found
    }
    talkConfig.Dialog = await ctrl.selectDialogBranch(await ctrl.selectSingleDialogExcelConfigData(talkConfig.InitDialog));
    fetchedTalkConfigIds.push(talkConfig.Id);
    fetchedTalkConfigs.push(talkConfig);
  }

  let talkConfigIdsByMainQuestIdPrefix = await ctrl.selectTalkExcelConfigDataIdsByPrefix(mainQuest.Id);
  for (let talkConfigId of talkConfigIdsByMainQuestIdPrefix) {
    if (fetchedTalkConfigIds.includes(talkConfigId)) {
      continue;
    }
    let talkConfig = await ctrl.selectTalkExcelConfigDataById(talkConfigId);
    if (!talkConfig) {
      continue;
    }
    if (!talkConfig.InitDialog) {
      console.warn('Talk Config without InitDialog', talkConfig);
      continue;
    }
    talkConfig.Dialog = await ctrl.selectDialogBranch(await ctrl.selectSingleDialogExcelConfigData(talkConfig.InitDialog));
    fetchedTalkConfigIds.push(talkConfig.Id);
    fetchedTalkConfigs.push(talkConfig);
  }

  // Add other orphaned dialogue and quest messages (after fetching talk configs)
  await ctrl.addOrphanedDialogueAndQuestMessages(mainQuest);

  // Push Talk Configs to appropriate sections (after fetching orphaned dialogue)
  for (let talkConfig of fetchedTalkConfigs) {
    pushTalkConfigToCorrespondingQuestSub(talkConfig);
  }

  // Delete quest subs without dialogue.
  // If empty dialogue quest subs have non-empty DescText or StepDescText, then move those to the previous quest sub
  let newQuestSubs: QuestExcelConfigData[] = [];
  for (let questSub of mainQuest.QuestExcelConfigDataList) {
    if (arrayEmpty(questSub.OrphanedDialog) && arrayEmpty(questSub.QuestMessages) && arrayEmpty(questSub.TalkExcelConfigDataList)) {
      if (questSub.DescText || questSub.StepDescText) {
        if (!newQuestSubs.length) {
          newQuestSubs.push(questSub); // If no previous quest sub, then keep empty section
          continue;
        }

        let prev = newQuestSubs[newQuestSubs.length - 1];
        if (!prev.DescText) { // only move to previous if previous doesn't have DescText already
          prev.DescText = questSub.DescText;
          delete questSub.DescText;
        }
        if (!prev.StepDescText) { // only move to previous if previous doesn't have StepDescText already
          prev.StepDescText = questSub.StepDescText;
          delete questSub.StepDescText;
        }

        if (questSub.DescText || questSub.StepDescText) {
          newQuestSubs.push(questSub); // push if failed to move DescText/StepDescText properties to previous
        }
        // If properties moved, then don't push (delete)
      }
      // If quest sub doesn't have DescText/StepDescText, then don't push (delete)
    } else {
      newQuestSubs.push(questSub);
    }
  }

  mainQuest.QuestExcelConfigDataList = newQuestSubs;

  result.questId = mainQuest.Id;
  result.questTitle = mainQuest.TitleText;
  result.mainQuest = mainQuest;
  result.npc = {
    names: arrayUnique(Object.values(ctrl.getPref().npcCache).filter(x => !!x.BodyType).map(x => x.NameText).concat('Traveler').sort()),
    data: ctrl.getPref().npcCache,
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
    if (condList && condList.length) {
      line(fieldName + (condComb ? ' [Comb='+condComb+']' : '') + ':')
      for (let cond of condList) {
        if (cond.Type === 'QUEST_COND_STATE_EQUAL') {
          if (cond.Param[1] === '2') {
            line('  Condition: before section ' + cond.Param[0]);
          } else if (cond.Param[1] === '3') {
            line('  Condition: after section ' + cond.Param[0]);
          } else {
            line('  Condition: ' + JSON.stringify(cond.Param));
          }
        } else {
          line('  Condition: Type=' + cond.Type + (cond.Param ? ' Param=' + JSON.stringify(cond.Param) : '')
              + (cond.ParamStr ? ' ParamStr=' + cond.ParamStr : '')
              + (cond.Count ? ' Count=' + cond.Count : ''));
        }
      }
    }
  }

  // Quest Page Template
  // -------------------
  clearOut();

  line('==Steps==');
  for (let questSub of mainQuest.QuestExcelConfigDataList) {
    if (questSub.DescText)
      line('# ' + questSub.DescText);
  }
  line();
  line('==Dialogue==');
  line('{{Quest Description|'+mainQuest.DescText+'}}');
  line('{{Dialogue start}}');
  for (let i = 0; i < mainQuest.QuestExcelConfigDataList.length; i++) {
    let questSub = mainQuest.QuestExcelConfigDataList[i];
    if (questSub.DescText) {
      if (i !== 0) {
        line();
      }
      line(';(' + questSub.DescText.replaceAll('(', '<nowiki>(').replaceAll(')', ')</nowiki>').replaceAll(':', '<nowiki>:</nowiki>') + ')');
      line();
      if (i !== mainQuest.QuestExcelConfigDataList.length - 1) {
        line('----');
      }
    }
  }
  line('{{Dialogue end}}');
  line();
  line(await ol_gen(mainQuest.TitleText));
  line();
  line('==Change History==');
  line('{{Change History|'+config.currentGenshinVersion+'}}');
  result.templateWikitext = out;

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
  line(await ol_gen(mainQuest.TitleText));
  result.otherLanguagesWikitext = out;

  // Quest Dialogue
  // --------------
  clearOut();

  const orphanedHelpText = `"Orphaned" means that the script didn't find anything conclusive in the JSON associating this dialogue to the quest. The tool assumes it's associated based on the dialogue IDs.`;
  const questMessageHelpText = `These are usually black-screen transition lines. There isn't any info in the JSON to show where these lines go chronologically within the section, so you'll have to figure that out.`;

  for (let questSub of mainQuest.QuestExcelConfigDataList) {
    let sect = new DialogueSectionResult('Section');

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
        let subsect = new DialogueSectionResult('Orphaned Dialogue', orphanedHelpText);
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
        let subsect = new DialogueSectionResult('Talk Dialogue');
        clearOut();
        lineProp('TalkConfigId', talkConfig.Id);
        lineProp('BeginWay', talkConfig.BeginWay);
        printCond('BeginCond', talkConfig.BeginCondComb, talkConfig.BeginCond);
        lineProp('QuestIdleTalk', talkConfig.QuestIdleTalk ? 'yes' : null);
        subsect.metatext = out;

        clearOut();
        line('{{Dialogue start}}');
        if (talkConfig.QuestIdleTalk) {
          line(`;(Talk to ${talkConfig.NpcNameList.join(', ')} again)`);
        }
        out += await ctrl.generateDialogueWikiText(talkConfig.Dialog);
        line('{{Dialogue end}}');
        subsect.wikitext = out;
        sect.children.push(subsect);
      }
    }

    if (questSub.QuestMessages && questSub.QuestMessages.length) {
      let subsect = new DialogueSectionResult('Section Quest Messages', questMessageHelpText);
      clearOut();
      for (let questMessage of questSub.QuestMessages) {
        subsect.wikitextArray.push(questMessage.TextMapContentText.replace(/\\n/g, '\n').split('\n').map(line => `:'''${line}'''`).join('\n'));
      }
      sect.children.push(subsect);
    }

    result.dialogue.push(sect);
  }

  if (mainQuest.OrphanedDialog && mainQuest.OrphanedDialog.length) {
    for (let dialog of mainQuest.OrphanedDialog) {
      let sect = new DialogueSectionResult('Orphaned Dialogue', orphanedHelpText);
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
      let sect = new DialogueSectionResult('Orphaned Talk Dialogue', orphanedHelpText);
      clearOut();
      lineProp('TalkConfigId', talkConfig.Id);
      lineProp('BeginWay', talkConfig.BeginWay);
      printCond('BeginCond', talkConfig.BeginCondComb, talkConfig.BeginCond);
      lineProp('QuestIdleTalk', talkConfig.QuestIdleTalk ? 'yes' : null);
      sect.metatext = out;

      clearOut();
      line('{{Dialogue start}}');
      if (talkConfig.QuestIdleTalk) {
        line(`;(Talk to ${talkConfig.NpcNameList.join(', ')} again)`);
      }
      out += await ctrl.generateDialogueWikiText(talkConfig.Dialog);
      line('{{Dialogue end}}');
      sect.wikitext = out;
      result.dialogue.push(sect);
    }
  }
  if (mainQuest.QuestMessages && mainQuest.QuestMessages.length) {
    let sect = new DialogueSectionResult('Quest Messages', questMessageHelpText);
    clearOut();
    for (let questMessage of mainQuest.QuestMessages) {
      sect.wikitextArray.push(questMessage.TextMapContentText.replace(/\\n/g, '\n').split('\n').map(line => `:'''${line}'''`).join('\n'));
    }
    result.dialogue.push(sect);
  }

  return result;
}

if (require.main === module) {
  (async () => {
    let prefs = new OverridePrefs();
    let result: QuestGenerateResult = await questGenerate(`Radiant Sakura`, 0, prefs);
    console.log(stringify(result.dialogue));
    closeKnex();
  })();
}