import { Control, getControl } from '../script_util';
import { AchievementExcelConfigData, AchievementGoalExcelConfigData } from '../../../shared/types/general-types';
import { sort } from '../../../shared/util/arrayUtil';
import { defaultMap } from '../../../shared/util/genericUtil';
import { pathToFileURL } from 'url';
import { loadEnglishTextMap } from '../textmap';
import util from 'util';
import { closeKnex } from '../../util/db';

export type AchievementsByGoals = {[goalId: number]: { Goal: AchievementGoalExcelConfigData, Achievements: AchievementExcelConfigData[] }}

export async function selectAchievements(ctrl: Control): Promise<AchievementsByGoals> {
  let goals: AchievementGoalExcelConfigData[] = await ctrl.readGenshinDataFile('./ExcelBinOutput/AchievementGoalExcelConfigData.json');
  sort(goals, 'OrderId');
  goals.forEach(g => !g.Id ? g.Id = 0 : null);

  let achievements: AchievementExcelConfigData[] = await ctrl.readGenshinDataFile('./ExcelBinOutput/AchievementExcelConfigData.json');
  sort(achievements, 'OrderId');

  let ret: AchievementsByGoals = defaultMap((goalId: number) => ({Goal: goals.find(g => g.Id === goalId), Achievements: []}));

  for (let achievement of achievements) {
    if (!achievement.GoalId) {
      achievement.GoalId = 0;
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