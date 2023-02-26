import { Control, getControl } from '../script_util';
import { sort } from '../../../shared/util/arrayUtil';
import { defaultMap, isset } from '../../../shared/util/genericUtil';
import { pathToFileURL } from 'url';
import { getTextMapItem, loadEnglishTextMap } from '../textmap';
import util from 'util';
import { closeKnex } from '../../util/db';
import {
  AchievementExcelConfigData,
  AchievementGoalExcelConfigData,
  AchievementsByGoals,
} from '../../../shared/types/achievement-types';
import { toInt } from '../../../shared/util/numberUtil';

export async function selectAchievementGoals(ctrl: Control): Promise<AchievementGoalExcelConfigData[]> {
  let goals: AchievementGoalExcelConfigData[] = await ctrl.readGenshinDataFile('./ExcelBinOutput/AchievementGoalExcelConfigData.json');
  sort(goals, 'OrderId');
  for (let goal of goals) {
    if (!goal.Id) {
      goal.Id = 0;
    }
    if (goal.FinishRewardId) {
      goal.FinishReward = await ctrl.selectRewardExcelConfigData(goal.FinishRewardId);
    }
    goal.NameTextEN = getTextMapItem('EN', goal.NameTextMapHash);
  }
  return goals;
}

export async function selectAchievements(ctrl: Control, goalIdConstraint?: number): Promise<AchievementsByGoals> {
  let goals: AchievementGoalExcelConfigData[] = await selectAchievementGoals(ctrl);

  let achievements: AchievementExcelConfigData[] = await ctrl.readGenshinDataFile('./ExcelBinOutput/AchievementExcelConfigData.json');
  sort(achievements, 'OrderId');

  let ret: AchievementsByGoals = defaultMap((goalId: number) => ({
    Goal: goals.find(g => g.Id === toInt(goalId)),
    Achievements: []
  }));

  for (let achievement of achievements) {
    if (!achievement.GoalId) {
      achievement.GoalId = 0;
    }
    if (isset(goalIdConstraint) && achievement.GoalId !== goalIdConstraint) {
      continue;
    }
    if (!achievement.TitleText) {
      continue;
    }
    if (achievement.FinishRewardId) {
      achievement.FinishReward = await ctrl.selectRewardExcelConfigData(achievement.FinishRewardId);
    }
    if (achievement.IsShow === 'SHOWTYPE_HIDE') {
      achievement.IsHidden = true;
    }
    if (achievement.TriggerConfig) {
      achievement.TriggerConfig.ParamList = achievement.TriggerConfig.ParamList.filter(s => s !== '');
      achievement.TriggerConfig.TriggerQuests = [];
      if (achievement.TriggerConfig.TriggerType === 'TRIGGER_FINISH_PARENT_QUEST_AND' || achievement.TriggerConfig.TriggerType == 'TRIGGER_FINISH_PARENT_QUEST_OR') {
        for (let qid of achievement.TriggerConfig.ParamList.flatMap(p => p.split(','))) {
          let mainQuest = await ctrl.selectMainQuestById(toInt(qid));
          if (mainQuest) {
            achievement.TriggerConfig.TriggerQuests.push(mainQuest);
          }
        }
      }
      if (achievement.TriggerConfig.TriggerType === 'TRIGGER_FINISH_QUEST_AND' || achievement.TriggerConfig.TriggerType == 'TRIGGER_FINISH_QUEST_OR') {
        for (let qid of achievement.TriggerConfig.ParamList.flatMap(p => p.split(','))) {
          let quest = await ctrl.selectQuestExcelConfigData(toInt(qid));
          if (quest) {
            let mainQuest = await ctrl.selectMainQuestById(quest.MainId);
            if (mainQuest) {
              achievement.TriggerConfig.TriggerQuests.push(mainQuest);
            }
          }
        }
      }
      if (achievement.TriggerConfig.TriggerType.startsWith('TRIGGER_CITY')) {
        achievement.TriggerConfig.CityNameText = await ctrl.selectCityNameById(toInt(achievement.TriggerConfig.ParamList[0]));
      }
    }
    ret[achievement.GoalId].Achievements.push(achievement);
  }

  return ret;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await loadEnglishTextMap();

  const ctrl = getControl();
  const ret = await selectAchievements(ctrl);
  console.log(util.inspect(ret, false, null, true));

  await closeKnex();
}