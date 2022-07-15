import '../../setup';
import {openKnex, closeKnex} from '@db';
import fs from 'fs';
import { arrayUnique, arrayEmpty, normText, getControl, normalizeCharName, OverridePrefs, stringify } from '@/scripts/script_util';
import { ol_gen } from '@/scripts/OLgen/other_languages_generator';
import {
  TextMapItem, NpcExcelConfigData, ManualTextMapConfigData, ConfigCondition,
  MainQuestExcelConfigData, QuestExcelConfigData,
  DialogExcelConfigData, TalkExcelConfigData, TalkRole
} from '@types';

async function questGenerate(questNameOrId: string|number, mainQuestIndex: number = 0, prefs?: OverridePrefs) {
  console.log('Started');
  console.time('Quest Generation');
  try {
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

    console.log('Got '+mainQuests.length+' main quest matches:', mainQuests.map(q => q.Id).join(', '));
    if (!mainQuest || !mainQuest.Id)
      throw 'Main Quest not found.';
    console.log('Selected Main Quest:', mainQuest.Id);
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
        if (prefs.AttemptQuestSubReorder && params.length) {
          // Prefer "3"-value (after) params before "2"-value (before)
          let preferredParam = params.find(p => p.paramValue === 3) || params.find(p => p.paramValue === 2);
          let prevQuestSubs: QuestExcelConfigData[] = []; // in order from most recently visited to least
          for (let questSub of mainQuest.QuestExcelConfigDataList) {
            if (preferredParam && preferredParam.paramQuestSubId === questSub.SubId) {
              if (preferredParam.paramValue === 2) {
                // before
                if (questExcelConfigData && questExcelConfigData.SubId < preferredParam.paramQuestSubId) {
                  if (!questExcelConfigData.TalkExcelConfigDataList)
                    questExcelConfigData.TalkExcelConfigDataList = [];
                  questExcelConfigData.TalkExcelConfigDataList.push(talkConfig);
                } else if (prevQuestSubs.length) {
                  let prevQuestSub: QuestExcelConfigData = prevQuestSubs[0];
                  if (talkConfig.QuestIdleTalk && prevQuestSubs.length > 1 && !ctrl.doesQuestSubHaveNpc(prevQuestSub, talkConfig.NpcNameList)) {
                    for (let i = 1; i < prevQuestSubs.length; i++) {
                      if (ctrl.doesQuestSubHaveNpc(prevQuestSubs[i], talkConfig.NpcNameList)) {
                        prevQuestSub = prevQuestSubs[i - 1];
                        break;
                      }
                    }
                  }
                  if (!prevQuestSub.TalkExcelConfigDataList)
                    prevQuestSub.TalkExcelConfigDataList = [];
                  prevQuestSub.TalkExcelConfigDataList.push(talkConfig);
                } else {
                  if (!questSub.TalkExcelConfigDataList)
                    questSub.TalkExcelConfigDataList = [];
                  questSub.TalkExcelConfigDataList.unshift(talkConfig);
                }
              } else if (preferredParam.paramValue === 3) {
                // after
                if (!questSub.TalkExcelConfigDataList)
                  questSub.TalkExcelConfigDataList = [];
                questSub.TalkExcelConfigDataList.push(talkConfig);
              } else {
                throw 'Unknown BeginCond param value: ' + preferredParam.paramQuestSubId + ' ' + preferredParam.paramValue;
              }
              return;
            }
            prevQuestSubs.unshift(questSub); // put most recent visited quest sub at front
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
        //console.warn('Talk Config without InitDialog', talkConfig);
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
        //console.warn('Talk Config without InitDialog', talkConfig);
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
        //console.warn('Talk Config without InitDialog', talkConfig);
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

    // Write results to files
    fs.writeFileSync('C:/Shared/git/localweb/genshin-data-explorer/script-io/dist/quest_gen.json', stringify(mainQuest));
    fs.writeFileSync('C:/Shared/git/localweb/genshin-data-explorer/script-io/dist/quest_gen_npc.json', stringify({
      names: Object.values(ctrl.npcCache).map(x => x.NameText),
      data: ctrl.npcCache,
    }));
    console.timeEnd('Quest Generation');

    // WIKI TEXT GENERATION
    // ~~~~~~~~~~~~~~~~~~~~

    console.time('Wiki Text Generation');
    let out = '';
    const line = (text?: string) => {
      out += '\n' + (text || '');
    };
    const lineProp = (label: string, prop: any) => {
      if (!prop)
        return;
      if (label.includes('%s')) {
        line(label.replace('%s', prop));
      } else {
        line(`${label}: ${prop}`);
      }
    }

    // Quest Steps File
    // ----------------
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
        line(';(' + questSub.DescText.replaceAll('(', '<nowiki>(').replaceAll(')', ')</nowiki>') + ')');
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
    line('{{Change History|2.8}}');
    fs.writeFileSync('C:/Shared/git/localweb/genshin-data-explorer/script-io/dist/quest_gen_steps.txt', out);
    out = '';

    // Quest Info / Dialogue
    // ---------------------
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

    lineProp('Quest Id', mainQuest.Id);
    lineProp('Quest Title', mainQuest.TitleText || 'n/a');
    lineProp('{{Quest Description|%s}}', mainQuest.DescText);
    for (let questSub of mainQuest.QuestExcelConfigDataList) {
      lineProp('{{Quest Description|update|%s}}', questSub.StepDescText);
    }
    lineProp('Quest NPCs', arrayUnique(Object.values(ctrl.npcCache).filter(x => !!x.BodyType).map(x => x.NameText).concat('Traveler').sort()).join('; '));
    line();
    line('==Steps==');
    for (let questSub of mainQuest.QuestExcelConfigDataList) {
      if (questSub.DescText)
        line('# ' + questSub.DescText);
    }
    line();
    line(await ol_gen(mainQuest.TitleText));
    line();
    for (let questSub of mainQuest.QuestExcelConfigDataList) {
      line();
      line('-'.repeat(100));
      line();
      lineProp('Section Id', questSub.SubId);
      lineProp('Section Order', questSub.Order);
      lineProp('Quest Step', questSub.DescText);
      lineProp('Quest Desc Update', questSub.StepDescText);
      printCond('AcceptCond', questSub.AcceptCondComb, questSub.AcceptCond);
      printCond('FinishCond', questSub.FinishCondComb, questSub.FinishCond);
      printCond('FailCond', questSub.FailCondComb, questSub.FailCond);
      if (questSub.OrphanedDialog && questSub.OrphanedDialog.length) {
        line();
        line('Orphaned Dialog:');
        line();
        for (let dialog of questSub.OrphanedDialog) {
          line('{{Dialogue start}}');
          out += await ctrl.generateDialogueWikiText(dialog);
          line('{{Dialogue end}}');
          line();
        }
      }
      if (questSub.TalkExcelConfigDataList && questSub.TalkExcelConfigDataList.length
            && questSub.TalkExcelConfigDataList.every(x => x.Dialog && x.Dialog.length)) {
        line();
        line('Talk Config Dialog:');
        line();
        for (let talkConfig of questSub.TalkExcelConfigDataList) {
          lineProp('TalkConfigId', talkConfig.Id);
          lineProp('BeginWay', talkConfig.BeginWay);
          printCond('BeginCond', talkConfig.BeginCondComb, talkConfig.BeginCond);
          lineProp('QuestIdleTalk', talkConfig.QuestIdleTalk ? 'yes' : null);
          line('{{Dialogue start}}');
          if (talkConfig.QuestIdleTalk) {
            line(`;(Talk to ${talkConfig.NpcNameList.join(', ')} again)`);
          }
          out += await ctrl.generateDialogueWikiText(talkConfig.Dialog);
          line('{{Dialogue end}}');
          line();
        }
      }
      if (questSub.QuestMessages && questSub.QuestMessages.length) {
        line();
        line('Quest Messages:');
        line();
        for (let questMessage of questSub.QuestMessages) {
          line(questMessage.TextMapContentText);
        }
      }
    }

    line();
    line('-'.repeat(100));
    line();

    if (mainQuest.OrphanedDialog && mainQuest.OrphanedDialog.length) {
      line();
      line('Orphaned Dialog:');
      line();
      for (let dialog of mainQuest.OrphanedDialog) {
        line('{{Dialogue start}}');
        out += await ctrl.generateDialogueWikiText(dialog);
        line('{{Dialogue end}}');
        line();
      }
    }
    if (mainQuest.OrphanedTalkExcelConfigDataList && mainQuest.OrphanedTalkExcelConfigDataList.length
        && mainQuest.OrphanedTalkExcelConfigDataList.every(x => x.Dialog && x.Dialog.length)) {
      line();
      line('Orphaned Talk Dialog:');
      line();
      for (let talkConfig of mainQuest.OrphanedTalkExcelConfigDataList) {
        lineProp('TalkConfigId', talkConfig.Id);
        lineProp('BeginWay', talkConfig.BeginWay);
        printCond('BeginCond', talkConfig.BeginCondComb, talkConfig.BeginCond);
        lineProp('QuestIdleTalk', talkConfig.QuestIdleTalk ? 'yes' : null);
        line('{{Dialogue start}}');
        if (talkConfig.QuestIdleTalk) {
          line(`;(Talk to ${talkConfig.NpcNameList.join(', ')} again)`);
        }
        out += await ctrl.generateDialogueWikiText(talkConfig.Dialog);
        line('{{Dialogue end}}');
        line();
      }
    }
    if (mainQuest.QuestMessages && mainQuest.QuestMessages.length) {
      line();
      line('Quest Messages:');
      line();
      for (let questMessage of mainQuest.QuestMessages) {
        line(questMessage.TextMapContentText);
      }
    }

    let outFileName = 'quest_gen_wikitext';
    if (prefs.OutputFileNameAsQuest) {
      outFileName = mainQuest.TitleText.replace(/[/\\?%*:|"<>]/g, '-');
    }
    if (prefs.OutputFileNameAppendId) {
      outFileName += ' ' + mainQuest.Id;
    }
    outFileName += '.txt';
    if (prefs.OutputFileLocation && !prefs.OutputFileLocation.endsWith('/')) {
      prefs.OutputFileLocation += '/';
    }
    fs.writeFileSync((prefs.OutputFileLocation || 'C:/Shared/git/localweb/genshin-data-explorer/script-io/dist/') + outFileName, out);
    console.timeEnd('Wiki Text Generation');

    console.log('Done');
  } catch (e) {
    console.error(e);
  } finally {
    closeKnex();
  }
}

if (require.main === module) {
  (async () => {
    let prefs = new OverridePrefs();
    prefs.AttemptQuestSubReorder = false; // this doesn't really work

    //prefs.OutputFileLocation = 'C:/Users/Matthew/Downloads/Generated Dialogue/More/';
    //prefs.OutputFileNameAsQuest = true;
    //prefs.OutputFileNameAppendId = true;

    await questGenerate(`"Outlander Brigade!"`, 0, prefs);
    //await questGenerate(`Memories of Inteyvat`, 0, prefs);
    //await questGenerate(`Radiant Sakura`, 0, prefs);
  })();
}