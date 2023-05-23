import '../../../loadenv';
import { closeKnex } from '../../../util/db';
import { GenshinControl, getGenshinControl } from '../genshinControl';
import { ol_gen_from_id } from '../../generic/basic/OLgen';
import { NpcExcelConfigData } from '../../../../shared/types/genshin/general-types';
import { arrayEmpty, arrayUnique } from '../../../../shared/util/arrayUtil';
import {
  QuestSummarizationTextExcelConfigData,
  TalkExcelConfigData,
} from '../../../../shared/types/genshin/dialogue-types';
import {
  MainQuestExcelConfigData,
  QuestExcelConfigData,
  ReputationQuestExcelConfigData,
} from '../../../../shared/types/genshin/quest-types';
import { RewardExcelConfigData } from '../../../../shared/types/genshin/material-types';
import {
  DialogueSectionResult,
  TalkConfigAccumulator,
  talkConfigToDialogueSectionResult,
} from './dialogue_util';
import { MetaProp } from '../../../util/metaProp';
import { pathToFileURL } from 'url';
import { SbOut } from '../../../../shared/util/stringUtil';
import { dialogueCompareApply, SimilarityGroups } from './dialogue_compare';
import { custom } from '../../../util/logger';
import { normGenshinText } from '../genshinText';

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
  cutscenes: {file: string, text: string}[] = [];
  similarityGroups: SimilarityGroups;

  reward?: RewardExcelConfigData;
  reputation?: ReputationQuestExcelConfigData;
  rewardInfobox?: string;
}

/**
 * Generates quest dialogue.
 *
 * @param questNameOrId The name or id of the main quest. Name must be an exact match and is case-sensitive. Leading/trailing whitespace will be trimmed.
 * @param ctrl Control object.
 * @param mainQuestIndex If multiple main quests match the name given, then this index can be used to select a specific one.
 */
export async function questGenerate(questNameOrId: string|number, ctrl: GenshinControl, mainQuestIndex: number = 0): Promise<QuestGenerateResult> {
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
  mainQuest.QuestExcelConfigDataList = await ctrl.selectAllQuestExcelConfigDataByMainQuestId(mainQuest.Id);
  mainQuest.OrphanedTalkExcelConfigDataList = [];

  const debug = custom('quest:' + mainQuest.Id);
  debug('Generating MainQuest');

  // Fetch talk configs
  // ------------------

  debug('Fetching Talks (by MainQuest ID)');

  // Fetch talk configs
  const talkConfigAcc = new TalkConfigAccumulator(ctrl);

  // Fetch Talk Configs by Main Quest ID (exact)
  const talkConfigsByMainQuestId = await ctrl.selectTalkExcelConfigDataByQuestId(mainQuest.Id, 'TALK_DEFAULT');

  debug(`Fetching Talks (by MainQuest ID) - obtained ${talkConfigsByMainQuestId.length} talks, processing...`);

  for (let talkConfig of talkConfigsByMainQuestId) {
    await talkConfigAcc.handleTalkConfig(talkConfig);
  }

  debug('Fetching Talks (by SubQuest ID)');

  // Find Talk Configs by Quest Sub ID
  for (let questExcelConfigData of mainQuest.QuestExcelConfigDataList) {
    if (talkConfigAcc.fetchedTalkConfigIds.has(questExcelConfigData.SubId)) {
      continue;
    }
    let talkConfig = await ctrl.selectTalkExcelConfigDataByQuestSubId(questExcelConfigData.SubId, 'TALK_DEFAULT');
    await talkConfigAcc.handleTalkConfig(talkConfig);
  }

  debug('Fetching Talks (by MainQuest ID Prefix)');

  // Fetch Talk Configs by Main Quest ID (prefix)
  let talkConfigIdsByMainQuestIdPrefix: number[] = await ctrl.selectTalkExcelConfigDataIdsByPrefix(mainQuest.Id);
  for (let talkConfigId of talkConfigIdsByMainQuestIdPrefix) {
    if (talkConfigAcc.fetchedTalkConfigIds.has(talkConfigId)) {
      continue;
    }
    let talkConfig = await ctrl.selectTalkExcelConfigDataById(talkConfigId, 'TALK_DEFAULT');
    await talkConfigAcc.handleTalkConfig(talkConfig);
  }

  // Find orphaned dialogue
  // ----------------------

  debug('Fetching orphaned dialogue');

  // Add other orphaned dialogue and quest messages (after fetching talk configs)
  await ctrl.addOrphanedDialogueAndQuestMessages(mainQuest);

  // Sort Talk Configs to quest subs
  // -------------------------------

  debug('Sorting Talks');

  function pushTalkConfigToCorrespondingQuestSub(talkConfig: TalkExcelConfigData) {
    const questExcelConfigData = mainQuest.QuestExcelConfigDataList.find(q => q.SubId === talkConfig.Id);
    if (questExcelConfigData) {
      if (!questExcelConfigData.TalkExcelConfigDataList) {
        questExcelConfigData.TalkExcelConfigDataList = [];
      }
      questExcelConfigData.TalkExcelConfigDataList.push(talkConfig);
      return;
    }
    if (!talkConfig.QuestId || talkConfig.QuestId === mainQuest.Id) {
      mainQuest.OrphanedTalkExcelConfigDataList.push(talkConfig);
    }
  }

  // Push Talk Configs to appropriate sections (after fetching orphaned dialogue)
  for (let talkConfig of talkConfigAcc.fetchedTopLevelTalkConfigs) {
    pushTalkConfigToCorrespondingQuestSub(talkConfig);
  }

  // Filter quest subs
  // -----------------

  debug('Filtering SubQuests');

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
  debug('Preparing result');
  mainQuest.QuestExcelConfigDataList = newQuestSubs;
  result.questId = mainQuest.Id;
  result.questTitle = mainQuest.TitleText;
  result.mainQuest = mainQuest;
  result.npc = {
    names: arrayUnique(
      Object.values(ctrl.state.npcCache)
        .filter(x => !x.Invisiable && !x.JsonName?.startsWith('ReadableNPC'))
        .map(x => ctrl.normText(x.NameText, ctrl.outputLangCode))
        .concat('Traveler')
        .sort()
    ),
    data: ctrl.state.npcCache,
  };

  // WIKI TEXT GENERATION
  // ~~~~~~~~~~~~~~~~~~~~
  let out = new SbOut();

  // Quest Steps
  // -----------
  debug('Generating quest steps');

  out.clearOut();
  for (let questSub of mainQuest.QuestExcelConfigDataList) {
    if (questSub.DescText)
      out.line('# ' + ctrl.normText(questSub.DescText, ctrl.outputLangCode));
  }
  result.stepsWikitext = out.toString();

  // Quest Descriptions
  // ------------------
  debug('Generating quest descriptions');

  out.clearOut();

  if (mainQuest.DescText) {
    result.questDescriptions.push('{{Quest Description|'+ctrl.normText(mainQuest.DescText, ctrl.outputLangCode)+'}}');
  }
  for (let questSub of mainQuest.QuestExcelConfigDataList) {
    if (!questSub.StepDescText) {
      continue;
    }
    let desc = '{{Quest Description|update|'+ctrl.normText(questSub.StepDescText, ctrl.outputLangCode)+'}}';
    if (!result.questDescriptions.includes(desc)) {
      result.questDescriptions.push(desc);
    }
  }

  // Other Languages
  // ---------------
  debug('Generating OL');

  out.clearOut();
  let olResult = await ol_gen_from_id(ctrl, mainQuest.TitleTextMapHash, {
    hideTl: false,
    addDefaultHidden: false,
  });
  if (olResult) {
    out.append(olResult.result);
    result.otherLanguagesWikitext = out.toString();
  }

  // Quest Dialogue
  // --------------
  debug('Generating quest dialogue (SubQuests)');

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
        subsect.metadata.push(new MetaProp('Quest ID', {value: mainQuest.Id, tooltip: mainQuest.TitleText}, `/quests/{}`));
        out.clearOut();
        out.append(await ctrl.generateDialogueWikiText(dialog));
        subsect.wikitext = out.toString();
        sect.children.push(subsect);
      }
    }

    if (questSub.TalkExcelConfigDataList && questSub.TalkExcelConfigDataList.length
          && questSub.TalkExcelConfigDataList.every(x => x.Dialog && x.Dialog.length)) {
      for (let talkConfig of questSub.TalkExcelConfigDataList) {
        await talkConfigToDialogueSectionResult(ctrl, sect, 'Talk', null, talkConfig);
      }
    }

    if (questSub.QuestMessages && questSub.QuestMessages.length) {
      let subsect = new DialogueSectionResult('SectionQuestMessages_'+questSub.SubId, 'Section Quest Messages', questMessageHelpText);
      out.clearOut();
      for (let questMessage of questSub.QuestMessages) {
        if (typeof questMessage.TextMapContentText === 'string') {
          subsect.wikitextArray.push({
            wikitext: questMessage
              .TextMapContentText.replace(/\\n/g, '\n').split('\n').map(line => `:{{Black Screen|${line}}}`).join('\n'),
          });
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
      sect.originalData.dialogBranch = dialog;
      sect.metadata.push(new MetaProp('First Dialogue ID', dialog[0].Id, `/branch-dialogue?q=${dialog[0].Id}`));
      sect.metadata.push(new MetaProp('Quest ID', {value: mainQuest.Id, tooltip: mainQuest.TitleText}, `/quests/{}`));
      out.clearOut();
      out.append(await ctrl.generateDialogueWikiText(dialog));
      out.line();
      sect.wikitext = out.toString();
      result.dialogue.push(sect);
    }
  }

  debug('Generating quest dialogue (Orphaned Talks)');

  if (mainQuest.OrphanedTalkExcelConfigDataList && mainQuest.OrphanedTalkExcelConfigDataList.length) {
    for (let talkConfig of mainQuest.OrphanedTalkExcelConfigDataList) {
      await talkConfigToDialogueSectionResult(ctrl, result, 'Unsectioned Talk',
        'These are Talks that are part of the quest but not part of any section.', talkConfig);
    }
  }

  debug('Generating quest dialogue (Quest Messages)');

  if (mainQuest.QuestMessages && mainQuest.QuestMessages.length) {
    let sect = new DialogueSectionResult('MainQuestMessages', 'Quest Messages', questMessageHelpText);
    out.clearOut();
    for (let questMessage of mainQuest.QuestMessages) {
      if (typeof questMessage.TextMapContentText === 'string') {
        sect.wikitextArray.push({
          wikitext: questMessage
            .TextMapContentText.replace(/\\n/g, '\n').split('\n').map(line => `:'''${line}'''`).join('\n'),
        });
      }
    }
    if (sect.wikitextArray.length) {
      result.dialogue.push(sect);
    }
  }

  // Dialogue Section Similarity Groups
  // ----------------------------------
  debug('Generating quest similarity groups');
  result.similarityGroups = dialogueCompareApply(result.dialogue);

  // Travel Log Summary
  // ------------------
  debug('Generating travel log summary');

  const QuestSummaryItems: QuestSummarizationTextExcelConfigData[] = await ctrl.selectAllQuestSummary();
  for (let summaryItem of QuestSummaryItems) {

    if (String(summaryItem.Id).startsWith(String(mainQuest.Id))) {
      let text = ctrl.normText(summaryItem.DescText, ctrl.outputLangCode);
      if (text.includes('<br')) {
        result.travelLogSummary.push('{{Cutscene Description|'+text+'}}');
      } else {
        result.travelLogSummary.push(':{{color|menu|'+text+'}}');
      }
    }
  }

  // Cutscenes
  // ---------
  debug('Generating cutscenes');
  let srtData = await ctrl.loadCutsceneSubtitlesByQuestId(mainQuest.Id);
  for (let srtFile of Object.keys(srtData)) {
    result.cutscenes.push({file: srtFile, text: srtData[srtFile]});
  }

  // Rewards
  // -------
  debug('Generating rewards');
  let rewards: RewardExcelConfigData[] = await Promise.all(mainQuest.RewardIdList.map(rewardId => ctrl.selectRewardExcelConfigData(rewardId)));
  result.reward = ctrl.combineRewardExcelConfigData(... rewards);
  result.reputation = await ctrl.selectReputationQuestExcelConfigData(mainQuest.Id);

  if (result.reward) {
    result.rewardInfobox = result.reward.RewardSummary.QuestForm;
  }
  if (result.reputation) {
    if (result.reward) {
      result.rewardInfobox += '\n';
    }
    if (result.reputation.TitleText === mainQuest.TitleText) {
      result.rewardInfobox += result.reputation.QuestForm;
    } else {
      result.rewardInfobox += result.reputation.QuestFormWithTitle;
    }
  }

  debug('Returning result');
  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    let result: QuestGenerateResult = await questGenerate(`Radiant Sakura`, getGenshinControl());
    console.log(JSON.stringify(result.dialogue));
    await closeKnex();
  })();
}