import '../../loadenv';
import {Control, getControl, normText} from "../script_util";
import { pathToFileURL } from 'url';
import { loadEnglishTextMap } from '../textmap';
import util from 'util';
import { closeKnex } from '../../util/db';
import { sort } from '../../../shared/util/arrayUtil';
import { AchievementExcelConfigData, AchievementGoalExcelConfigData } from '../../../shared/types/general-types';
import { talkConfigGenerate } from '../dialogue/basic_dialogue_generator';
import { DialogueSectionResult } from '../dialogue/dialogue_util';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await loadEnglishTextMap();

  const ctrl = getControl();

  /*
  let goals: AchievementGoalExcelConfigData[] = await ctrl.readGenshinDataFile('./ExcelBinOutput/AchievementGoalExcelConfigData.json');
  sort(goals, 'OrderId');

  let achievements: AchievementExcelConfigData[] = await ctrl.readGenshinDataFile('./ExcelBinOutput/AchievementExcelConfigData.json');
  sort(achievements, 'OrderId');

  for (let achievement of achievements) {
    if (!!achievement.GoalId) {
      continue;
    }
    console.log(achievement.TitleText, achievement.DescText);
  }
  */

  const logSect = (sect: DialogueSectionResult) => {
    console.log(sect.wikitext);
    if (sect.children) {
      for (let child of sect.children) {
        logSect(child);
      }
    }
  }

  let talks = await ctrl.selectTalkExcelConfigDataByQuestId(5066);
  for (let talk of talks) {
    let sect = await talkConfigGenerate(ctrl, talk);
    logSect(sect);
    console.log('-'.repeat(100));
  }

  await closeKnex();
}