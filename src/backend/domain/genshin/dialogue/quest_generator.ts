import '../../../loadenv.ts';
import { closeKnex } from '../../../util/db.ts';
import { GenshinControl, getGenshinControl } from '../genshinControl.ts';
import { ol_gen_from_id } from '../../abstract/basic/OLgen.ts';
import { arrayUnique } from '../../../../shared/util/arrayUtil.ts';
import {
  DialogUnparented,
  TalkExcelConfigData,
} from '../../../../shared/types/genshin/dialogue-types.ts';
import {
  MainQuestExcelConfigData,
  QuestExcelConfigData,
  ReputationQuestExcelConfigData,
} from '../../../../shared/types/genshin/quest-types.ts';
import { RewardExcelConfigData } from '../../../../shared/types/genshin/material-types.ts';
import {
  TalkConfigAccumulator,
  talkConfigToDialogueSectionResult,
} from './dialogue_util.ts';
import { MetaProp } from '../../../util/metaProp.ts';
import { pathToFileURL } from 'url';
import { SbOut } from '../../../../shared/util/stringUtil.ts';
import { dialogueCompareApply, SimilarityGroups } from './dialogue_compare.ts';
import { custom } from '../../../util/logger.ts';
import { grepIdStartsWith } from '../../../util/shellutil.ts';
import { RAW_MANUAL_TEXTMAP_ID_PROP } from '../../../importer/genshin/genshin.schema.ts';
import { isInt, toInt } from '../../../../shared/util/numberUtil.ts';
import { Readable } from '../../../../shared/types/genshin/readable-types.ts';
import { DialogueSectionResult } from '../../../util/dialogueSectionResult.ts';
import { defaultMap } from '../../../../shared/util/genericUtil.ts';
import { ImageIndexEntity } from '../../../../shared/types/image-index-types.ts';
import { GameVersion, GameVersions } from '../../../../shared/types/game-versions.ts';
import { addMetaProps_questExcel } from './quest_prop_helpers.ts';
import { NpcExcelConfigData } from '../../../../shared/types/genshin/npc-types.ts';

export class QuestGenerateResult {
  mainQuest: MainQuestExcelConfigData = null;
  questTitle: string;
  questId: number;
  versionAdded?: GameVersion;
  npc: QuestGenerateResultNpcInfo = {names: [], data: {}};

  stepsWikitext: string = null;
  questDescriptions: string[] = [];
  otherLanguagesWikitext: string = null;
  dialogue: DialogueSectionResult[] = [];
  cutscenes: {file: string, text: string}[] = [];
  similarityGroups: SimilarityGroups;

  rewards?: RewardExcelConfigData[];
  reputation?: ReputationQuestExcelConfigData;
  rewardInfoboxList?: string[];
  rewardTriggers?: Record<number, number[]>;
  reputationInfobox?: string;
  questStills?: {imageName: string, wikiName: string}[];
  inDialogueReadables?: Readable[];
  questItemPictureCandidates?: ImageIndexEntity[];
}

export type QuestGenerateResultNpcInfo = {
  names: string[],
  data: {[Id: number]: NpcExcelConfigData},
};

async function findMainQuest(ctrl: GenshinControl, questNameOrId: string|number, questIndex: number) {
  const mainQuests: MainQuestExcelConfigData[] = typeof questNameOrId === 'string'
    ? await ctrl.searchMainQuests(questNameOrId.trim())
    : [await ctrl.selectMainQuestById(questNameOrId)];

  return mainQuests.length ? mainQuests[questIndex] : null;
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

  // ==============================================================================================================
  // MAIN QUEST GENERATION
  // ==============================================================================================================

  // Find Main Quest and Quest Subs
  // --------------------------------------------------------------------------------------------------------------
  const mainQuest = await findMainQuest(ctrl, questNameOrId, mainQuestIndex);
  if (!mainQuest || !mainQuest.Id) {
    throw 'Main Quest not found.';
  }
  result.versionAdded = (await ctrl.excelChangelog.selectChangeRefAddedAt(mainQuest.Id, 'MainQuestExcelConfigData'))?.version;

  mainQuest.QuestExcelConfigDataList = await ctrl.selectAllQuestExcelConfigDataByMainQuestId(mainQuest.Id);
  mainQuest.UnsectionedTalks = [];

  const debug = custom('quest:' + mainQuest.Id);
  debug('Generating MainQuest');

  const chapter = mainQuest.ChapterId ? await ctrl.selectChapterById(mainQuest.ChapterId, false) : null;

  const isHangout: boolean = mainQuest.Type === 'SQ'
    && chapter && chapter.ChapterNumTextMapHash
    && (await ctrl.getTextMapItem('EN', chapter.ChapterNumTextMapHash))?.includes('Hangout');
  debug('Is Hangout: ' + (isHangout ? 'Yes' : 'No'));

  // Fetch talk configs (By MainQuest ID)
  // --------------------------------------------------------------------------------------------------------------

  debug('Fetching Talks (by MainQuest ID)');

  // Fetch talk configs
  const acc: TalkConfigAccumulator = new TalkConfigAccumulator(ctrl);

  // Fetch Talk Configs by Main Quest ID (exact)
  const talkConfigsByMainQuestId: TalkExcelConfigData[] = await ctrl.selectTalkExcelConfigDataByQuestId(mainQuest.Id, 'TALK_NORMAL_QUEST');
  debug(`Fetching Talks (by MainQuest ID) - obtained ${talkConfigsByMainQuestId.length} talks, processing...`);

  for (let talkConfig of talkConfigsByMainQuestId) {
    await acc.handleTalkConfig(talkConfig);
  }

  // Fetch talk configs (By SubQuest ID)
  // --------------------------------------------------------------------------------------------------------------
  debug('Fetching Talks (by SubQuest ID)');

  // Find Talk Configs by Quest Sub ID
  for (let questExcelConfigData of mainQuest.QuestExcelConfigDataList) {
    if (acc.fetchedTalkConfigIds.has(questExcelConfigData.SubId)) {
      continue;
    }
    let talkConfig = await ctrl.selectTalkExcelConfigDataByQuestSubId(questExcelConfigData.SubId, 'TALK_NORMAL_QUEST');
    await acc.handleTalkConfig(talkConfig);

    if (!talkConfig) {
      const dialogs = await ctrl.selectDialogExcelConfigDataByTalkId(questExcelConfigData.SubId, true);
      for (let dialog of dialogs) {
        if (ctrl.isInDialogIdCache(dialog.Id))
          continue;
        const dialogs = await ctrl.selectDialogBranch(mainQuest.Id, dialog);
        if (dialogs.length) {
          if (!questExcelConfigData.NonTalkDialog)
            questExcelConfigData.NonTalkDialog = [];
          questExcelConfigData.NonTalkDialog.push(dialogs);
        }
      }
    }
  }

  // Find unparented dialogue
  // --------------------------------------------------------------------------------------------------------------

  if (isHangout) {
    debug('Adding orphaned dialog');
    await addOrphanedDialogue(ctrl, mainQuest);
  }

  debug('Fetching unparented dialogue');
  await addUnparentedDialogue(ctrl, mainQuest);

  debug('Fetching quest messages');
  await addQuestMessages(ctrl, mainQuest);

  // Sort Talk Configs to quest subs
  // --------------------------------------------------------------------------------------------------------------

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
      mainQuest.UnsectionedTalks.push(talkConfig);
    }
  }

  // Push Talk Configs to appropriate sections (after fetching unparented dialogue)
  for (let talkConfig of acc.fetchedTopLevelTalkConfigs) {
    pushTalkConfigToCorrespondingQuestSub(talkConfig);
  }

  // Apply to result object
  // --------------------------------------------------------------------------------------------------------------
  debug('Preparing result');
  result.questId = mainQuest.Id;
  result.questTitle = mainQuest.TitleText;
  result.mainQuest = mainQuest;
  result.npc = createQuestGenerateResultNpcInfo(ctrl);

  // ==============================================================================================================
  // WIKI TEXT GENERATION
  // ==============================================================================================================

  // Quest Steps
  // --------------------------------------------------------------------------------------------------------------
  debug('Generating quest steps');

  result.stepsWikitext = mainQuest.QuestExcelConfigDataList
    .filter(q => !!q.DescText)
    .map(q => {
      let stepText = '# ' + ctrl.normText(q.DescText, ctrl.outputLangCode);

      const multiProgressCond = q.FinishCond
        ?.find(cond => cond.Type === 'QUEST_CONTENT_ADD_QUEST_PROGRESS' && toInt(cond.Count) >= 2);

      if (multiProgressCond) {
        stepText += ` (0/${multiProgressCond.Count})`;
      }
      return stepText;
    })
    .join('\n');

  // Quest Descriptions
  // --------------------------------------------------------------------------------------------------------------
  debug('Generating quest descriptions');

  if (mainQuest.DescText) {
    result.questDescriptions.push('{{Quest Description|'+ctrl.normText(mainQuest.DescText, ctrl.outputLangCode)+'}}');
  }
  for (let questSub of mainQuest.QuestExcelConfigDataList.filter(q => !!q.StepDescText)) {
    let desc = '{{Quest Description|update|'+ctrl.normText(questSub.StepDescText, ctrl.outputLangCode)+'}}';
    if (!result.questDescriptions.includes(desc)) {
      result.questDescriptions.push(desc);
    }
  }

  // Other Languages
  // --------------------------------------------------------------------------------------------------------------
  debug('Generating OL');
  result.otherLanguagesWikitext = (await ol_gen_from_id(ctrl, mainQuest.TitleTextMapHash, {
    hideTl: false,
    addDefaultHidden: false,
  }))?.result;

  // Quest Dialogue (SubQuests)
  // --------------------------------------------------------------------------------------------------------------
  debug('Generating quest dialogue (SubQuests)');

  const nonTalkDialogHelpMessage = `Dialogues that are not part of a Talk.`;
  const questMessageHelpText = `These are usually black-screen transition lines. There isn't any info in the JSON to show where these lines go chronologically within the section, so you'll have to figure that out.`;

  for (let questSub of mainQuest.QuestExcelConfigDataList) {
    let sect = new DialogueSectionResult('Section_'+questSub.SubId, 'Section');

    sect.addHeaderProp('Section ID', questSub.SubId);
    sect.addHeaderProp('Section Order', questSub.Order);

    if (questSub.FinishExec) {
      const rewardSetIndexExec = questSub.FinishExec.find(f => f.Type === 'QUEST_EXEC_UPDATE_PARENT_QUEST_REWARD_INDEX');
      if (rewardSetIndexExec && rewardSetIndexExec.Param.length && isInt(rewardSetIndexExec.Param[0])) {
        const rewardIndex = toInt(rewardSetIndexExec.Param[0]);
        sect.addFinishExecProp('Trigger Reward Index', String(rewardIndex));
      }
    }

    await addMetaProps_questExcel(ctrl, sect, questSub);

    if (questSub.DescText) {
      sect.wikitextArray.push({
        title: 'Step',
        wikitext: ctrl.normText(questSub.DescText, ctrl.outputLangCode),
      });
    }

    if (questSub.StepDescText) {
      sect.wikitextArray.push({
        title: 'Description Update',
        wikitext: ctrl.normText(questSub.StepDescText, ctrl.outputLangCode),
      });
    }

    if (questSub.GuideTipsText) {
      sect.wikitextArray.push({
        title: 'Guide Tip',
        wikitext: ctrl.normText(questSub.GuideTipsText, ctrl.outputLangCode),
      });
    }

    if (questSub.NonTalkDialog && questSub.NonTalkDialog.length) {
      for (let dialog of questSub.NonTalkDialog) {
        let subsect = new DialogueSectionResult('NonTalkDialogue_'+dialog[0].Id, 'Non-Talk Dialogue', nonTalkDialogHelpMessage);
        subsect.headerProps.push(new MetaProp('First Dialogue ID', dialog[0].Id, `/genshin/branch-dialogue?q=${dialog[0].Id}`));
        subsect.headerProps.push(new MetaProp('Quest ID', {value: mainQuest.Id, tooltip: mainQuest.TitleText}, `/genshin/quests/{}`));
        subsect.originalData.questId = mainQuest.Id;
        subsect.originalData.questName = mainQuest.TitleText;
        const dialogWikitextRet = await ctrl.generateDialogueWikitext(dialog);
        subsect.setWikitext(dialogWikitextRet);
        sect.children.push(subsect);
      }
    }

    if (questSub.TalkExcelConfigDataList && questSub.TalkExcelConfigDataList.length
          && questSub.TalkExcelConfigDataList.every(x => !!x.Dialog?.length || !!x.OtherDialog?.length)) {
      for (let talkConfig of questSub.TalkExcelConfigDataList) {
        await talkConfigToDialogueSectionResult(ctrl, sect, 'Talk', null, talkConfig);
      }
    }

    if (questSub.QuestMessages && questSub.QuestMessages.length) {
      let subsect = new DialogueSectionResult('SectionQuestMessages_'+questSub.SubId, 'Section Quest Messages', questMessageHelpText);
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

  // Quest Dialogue (Main Quest Non-Talks)
  // --------------------------------------------------------------------------------------------------------------
  if (mainQuest.NonTalkDialog && mainQuest.NonTalkDialog.length) {
    for (let dialog of mainQuest.NonTalkDialog) {
      let sect = new DialogueSectionResult('NonTalkDialogue_'+dialog[0].Id, 'Non-Talk Dialogue', nonTalkDialogHelpMessage);
      sect.originalData.dialogBranch = dialog;
      sect.headerProps.push(new MetaProp('First Dialogue ID', dialog[0].Id, `/genshin/branch-dialogue?q=${dialog[0].Id}`));
      sect.headerProps.push(new MetaProp('Quest ID', {value: mainQuest.Id, tooltip: mainQuest.TitleText}, `/genshin/quests/{}`));
      sect.originalData.questId = mainQuest.Id;
      sect.originalData.questName = mainQuest.TitleText;
      const dialogWikitextRet = await ctrl.generateDialogueWikitext(dialog);
      sect.setWikitext(dialogWikitextRet);
      result.dialogue.push(sect);
    }
  }

  // Quest Dialogue (Unsectioned Talks)
  // --------------------------------------------------------------------------------------------------------------
  debug('Generating quest dialogue (Unsectioned Talks)');

  if (mainQuest.UnsectionedTalks && mainQuest.UnsectionedTalks.length) {
    for (let talkConfig of mainQuest.UnsectionedTalks) {
      await talkConfigToDialogueSectionResult(ctrl, result, 'Unsectioned Talk',
        'These are Talks that are part of the quest but not part of any section.', talkConfig);
    }
  }

  // Quest Messages
  // --------------------------------------------------------------------------------------------------------------
  debug('Generating Quest Messages');

  if (mainQuest.QuestMessages && mainQuest.QuestMessages.length) {
    let sect = new DialogueSectionResult('MainQuestMessages', 'Quest Messages', questMessageHelpText);
    for (let questMessage of mainQuest.QuestMessages) {
      if (typeof questMessage.TextMapContentText === 'string') {
        sect.wikitextArray.push({
          wikitext: questMessage
            .TextMapContentText.replace(/\\n/g, '\n').split('\n').map(line => `:{{Black Screen|${line}}}`).join('\n'),
        });
      }
    }
    if (sect.wikitextArray.length) {
      result.dialogue.push(sect);
    }
  }

  // Dialogue Section Similarity Groups
  // --------------------------------------------------------------------------------------------------------------
  debug('Generating quest similarity groups');
  result.similarityGroups = dialogueCompareApply(result.dialogue);

  // Cutscene Subtitles
  // --------------------------------------------------------------------------------------------------------------
  debug('Generating cutscenes');
  let srtData = await ctrl.loadCutsceneSubtitlesByQuestId(mainQuest.Id);
  for (let srtFile of Object.keys(srtData)) {
    result.cutscenes.push({file: srtFile, text: srtData[srtFile]});
  }

  // Rewards & Reputation
  // --------------------------------------------------------------------------------------------------------------
  debug('Generating rewards');
  const rewards: RewardExcelConfigData[] = await (mainQuest.RewardIdList || [])
    .asyncMap(rewardId => ctrl.selectRewardExcelConfigData(rewardId), false);
  result.rewards = rewards;
  result.rewardInfoboxList = [];
  result.rewardTriggers = defaultMap('Array');

  for (let reward of rewards) {
    let sbReward = new SbOut();
    sbReward.setPropPad(14);
    if (reward) {
      sbReward.prop('rewards', reward.RewardSummary.CombinedStrings);
    } else {
      sbReward.append('(No reward)');
    }
    result.rewardInfoboxList.push(sbReward.toString());
  }

  for (let questSub of mainQuest.QuestExcelConfigDataList) {
    if (questSub.FinishExec) {
      const rewardSetIndexExec = questSub.FinishExec.find(f => f.Type === 'QUEST_EXEC_UPDATE_PARENT_QUEST_REWARD_INDEX');
      if (rewardSetIndexExec && rewardSetIndexExec.Param.length && isInt(rewardSetIndexExec.Param[0])) {
        const rewardIndex = toInt(rewardSetIndexExec.Param[0]);
        result.rewardTriggers[rewardIndex].push(questSub.SubId);
      }
    }
  }

  result.reputation = await ctrl.selectReputationQuestExcelConfigData(mainQuest.Id);

  if (result.reputation) {
    let sbRep = new SbOut();
    sbRep.setPropPad(14);

    sbRep.prop('rep', result.reputation.CityName);
    sbRep.prop('repAmt', result.reputation.Reward.RewardItemList[0].ItemCount);
    sbRep.prop('repOrder', result.reputation.Order);

    if (result.reputation.TitleText !== mainQuest.TitleText) {
      sbRep.prop('repTitle', result.reputation.TitleText);
    }

    result.reputationInfobox = sbRep.toString();
  }

  // Quest Stills, Pictures, In-Dialogue Readables
  // --------------------------------------------------------------------------------------------------------------
  result.questStills = ctrl.state.questStills?.[mainQuest.Id] || [];
  result.inDialogueReadables = ctrl.state.inDialogueReadables?.[mainQuest.Id] || [];

  if (result.versionAdded && ctrl.state.questHasQuestItemPictures[mainQuest.Id]) {
    const questPictures = await ctrl.searchImageIndex({
      query: `^UI_QuestPicture`,
      versionFilter: new GameVersions([result.versionAdded]),
      searchMode: 'RI',
      limit: 1000
    });
    result.questItemPictureCandidates = questPictures.results;
  }

  // Return result
  // --------------------------------------------------------------------------------------------------------------
  debug('Returning result');
  return result;
}

async function addOrphanedDialogue(ctrl: GenshinControl, mainQuest: MainQuestExcelConfigData) {
  const allDialogueIds = await grepIdStartsWith('id', mainQuest.Id,
    ctrl.getDataFilePath('./ExcelBinOutput/DialogExcelConfigData.json'));

  const handleOrphanedDialog = async (quest: MainQuestExcelConfigData|QuestExcelConfigData, id: number) => {
    if (ctrl.isInDialogIdCache(id))
      return;
    let dialog = await ctrl.selectSingleDialogExcelConfigData(id as number);
    if (dialog) {
      if (!quest.NonTalkDialog)
        quest.NonTalkDialog = [];
      let dialogs = await ctrl.selectDialogBranch(mainQuest.Id, dialog);
      quest.NonTalkDialog.push(dialogs);
    }
  }
  for (let quest of mainQuest.QuestExcelConfigDataList) {
    for (let id of allDialogueIds) {
      if (!id.toString().startsWith(quest.SubId.toString()))
        continue;
      await handleOrphanedDialog(quest, id as number);
    }
  }
  for (let id of allDialogueIds) {
    await handleOrphanedDialog(mainQuest, id as number);
  }
}

async function addUnparentedDialogue(ctrl: GenshinControl, mainQuest: MainQuestExcelConfigData) {
  const allDialogueIds: number[] = [];

  const unparented: DialogUnparented[] = await ctrl.selectDialogUnparentedByMainQuestId(mainQuest.Id);
  for (let item of unparented) {
    allDialogueIds.push(item.DialogId);
  }

  const handleUnparentedDialog = async (quest: MainQuestExcelConfigData|QuestExcelConfigData, id: number) => {
    if (ctrl.isInDialogIdCache(id))
      return;
    let dialog = await ctrl.selectSingleDialogExcelConfigData(id as number);
    if (dialog) {
      if (!quest.NonTalkDialog)
        quest.NonTalkDialog = [];
      let dialogs = await ctrl.selectDialogBranch(mainQuest.Id, dialog);
      quest.NonTalkDialog.push(dialogs);
    }
  }

  for (let quest of mainQuest.QuestExcelConfigDataList) {
    for (let id of allDialogueIds) {
      if (!id.toString().startsWith(quest.SubId.toString()))
        continue;
      await handleUnparentedDialog(quest, id);
    }
  }
  for (let id of allDialogueIds) {
    await handleUnparentedDialog(mainQuest, id);
  }
}

async function addQuestMessages(ctrl: GenshinControl, mainQuest: MainQuestExcelConfigData) {
  const allQuestMessageIds: string[] = [];

  allQuestMessageIds.push(... await grepIdStartsWith<string>(RAW_MANUAL_TEXTMAP_ID_PROP, 'QUEST_Message_Q' + mainQuest.Id,
    ctrl.getDataFilePath('./ExcelBinOutput/ManualTextMapConfigData.json')));

  for (let quest of mainQuest.QuestExcelConfigDataList) {
    if (allQuestMessageIds && allQuestMessageIds.length) {
      quest.QuestMessages = [];
      for (let id of allQuestMessageIds) {
        if (id === 'QUEST_Message_Q' + quest.SubId.toString() || id.startsWith('QUEST_Message_Q' + quest.SubId.toString() + '_'))
          quest.QuestMessages.push(await ctrl.selectManualTextMapConfigDataById(id));
      }
    }
  }
  if (allQuestMessageIds && allQuestMessageIds.length) {
    mainQuest.QuestMessages = [];
    for (let id of allQuestMessageIds) {
      if (id === 'QUEST_Message_Q' + mainQuest.Id.toString() || id.startsWith('QUEST_Message_Q' + mainQuest.Id.toString() + '_'))
        mainQuest.QuestMessages.push(await ctrl.selectManualTextMapConfigDataById(id));
    }
  }
}

function createQuestGenerateResultNpcInfo(ctrl: GenshinControl): QuestGenerateResultNpcInfo {
  return {
    names: arrayUnique(
      Object.values(ctrl.state.npcCache)
        .filter(x => !x.Invisiable && !x.JsonName?.startsWith('ReadableNPC'))
        .map(x => ctrl.normText(x.NameText, ctrl.outputLangCode, {
          customOpts: {
            wandererPlaceholderPlainForm: true,
            littleOnePlaceholderPlainForm: true,
          }
        }))
        .concat(ctrl.travelerPageName)
        .sort()
    ),
    data: ctrl.state.npcCache,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    let result: QuestGenerateResult = await questGenerate(`Radiant Sakura`, getGenshinControl());
    console.log(JSON.stringify(result.dialogue));
    await closeKnex();
  })();
}
