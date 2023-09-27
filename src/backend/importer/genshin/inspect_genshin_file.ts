import { pathToFileURL } from 'url';
import { getGenshinControl } from '../../domain/genshin/genshinControl';
import { closeKnex } from '../../util/db';
import { inspectDataFile, InspectOpt } from '../util/inspect_file_util';

const excel = (file: string) => `./ExcelBinOutput/${file}.json`;

const presets = {
  DialogExcelConfigData: <InspectOpt> { file: excel('DialogExcelConfigData'), inspectFieldValues: ['TalkRole.Type', 'Type'] },
  MaterialExcelConfigData: <InspectOpt> { file: excel('MaterialExcelConfigData'), inspectFieldValues: ['MaterialType', 'ItemType', 'UseTarget', 'ItemUse[#ALL].UseOp'] },
  CityConfigData: <InspectOpt> { file: excel('CityConfigData') },
  DungeonExcelConfigData: <InspectOpt> { file: excel('DungeonExcelConfigData'), inspectFieldValues: ['Type', 'SubType', 'InvolveType', 'SettleUIType', 'SettleShows[#ALL]', 'RecommendElementTypes[#ALL]', 'StateType', 'PlayType'] },
  DungeonPassExcelConfigData: <InspectOpt> { file: excel('DungeonPassExcelConfigData'), inspectFieldValues: ['Conds[#ALL].CondType', 'LogicType'] },
  DungeonLevelEntityConfigData: <InspectOpt> { file: excel('DungeonLevelEntityConfigData') },
  DungeonEntryExcelConfigData: <InspectOpt> { file: excel('DungeonEntryExcelConfigData'), inspectFieldValues: ['Type', 'CondComb', 'SatisfiedCond[#ALL].Type'] },
  DungeonElementChallengeExcelConfigData: <InspectOpt> { file: excel('DungeonElementChallengeExcelConfigData') },
  DungeonChallengeConfigData: <InspectOpt> { file: excel('DungeonChallengeConfigData'), inspectFieldValues: ['ChallengeType', 'InterruptButtonType', 'SubChallengeSortType'] },
  FettersExcelConfigData: <InspectOpt> { file: excel('FettersExcelConfigData'), inspectFieldValues: ['OpenConds[#ALL].CondType', 'FinishConds[#ALL].CondType', 'Type'] },
  FetterStoryExcelConfigData: <InspectOpt> { file: excel('FetterStoryExcelConfigData'), inspectFieldValues: ['OpenConds[#ALL].CondType', 'FinishConds[#ALL].CondType'] },
  FetterInfoExcelConfigData: <InspectOpt> { file: excel('FetterInfoExcelConfigData'), inspectFieldValues: ['AvatarAssocType', 'OpenConds[#ALL].CondType', 'FinishConds[#ALL].CondType'] },
  LocalizationExcelConfigData: <InspectOpt> { file: excel('LocalizationExcelConfigData'), inspectFieldValues: ['AssetType'] },
  TalkExcelConfigData: <InspectOpt> { file: excel('TalkExcelConfigData'), inspectFieldValues: ['BeginCond[#ALL].Type', 'FinishExec[#ALL].Type', 'HeroTalk', 'LoadType', 'TalkMarkType'] },
  QuestExcelConfigData: <InspectOpt> { file: excel('QuestExcelConfigData'), inspectFieldValues: ['AcceptCond[#ALL].Type', 'BeginExec[#ALL].Type', 'FailCond[#ALL].Type', 'FailExec[#ALL].Type', 'FinishCond[#ALL].Type', 'FinishExec[#ALL].Type',] },
  ReliquaryExcelConfigData: <InspectOpt> { file: excel('ReliquaryExcelConfigData'), inspectFieldValues: ['EquipType', 'ItemType', 'DestroyRule'] },
  WeaponExcelConfigData: <InspectOpt> { file: excel('WeaponExcelConfigData'), inspectFieldValues: ['WeaponType', 'DestroyRule', 'ItemType'] },
  AchievementExcelConfigData: <InspectOpt> { file: excel('AchievementExcelConfigData'), inspectFieldValues: ['Ttype', 'IsShow', 'ProgressShowType', 'TriggerConfig.TriggerType'] },
  AchievementGoalExcelConfigData: <InspectOpt> { file: excel('AchievementGoalExcelConfigData') },
  GCGGameExcelConfigData: <InspectOpt> { file: excel('GCGGameExcelConfigData'), inspectFieldValues: ['GameType', 'InitHand'] },
  GCGGameRewardExcelConfigData: <InspectOpt> { file: excel('GCGGameRewardExcelConfigData'), inspectFieldValues: ['GroupId'] },
  GCGChallengeExcelConfigData: <InspectOpt> { file: excel('GCGChallengeExcelConfigData'), inspectFieldValues: ['Type', 'ParamList[#ALL]'] },
  GCGTagExcelConfigData: <InspectOpt> { file: excel('GCGTagExcelConfigData'), inspectFieldValues: ['Type', 'CategoryType'] },
  WorldAreaConfigData: <InspectOpt> { file: excel('WorldAreaConfigData'), inspectFieldValues: ['ElementType', 'TerrainType', 'AreaType'] },
  NewActivityExcelConfigData: <InspectOpt> { file: excel('NewActivityExcelConfigData') },
  LoadingSituationExcelConfigData: <InspectOpt> { file: excel('LoadingSituationExcelConfigData'), inspectFieldValues: ['LoadingSituationType', 'AreaTerrainType', 'PicPath'] },

  CombineExcelConfigData: <InspectOpt> { file: excel('CombineExcelConfigData'), inspectFieldValues: ['RecipeType'] },
  CompoundExcelConfigData: <InspectOpt> { file: excel('CompoundExcelConfigData'), inspectFieldValues: ['Type'] },
  CookRecipeExcelConfigData: <InspectOpt> { file: excel('CookRecipeExcelConfigData'), inspectFieldValues: ['FoodType', 'CookMethod'] },

};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const ctrl = getGenshinControl();
    //await inspectDataFile(ctrl, presets.CookRecipeExcelConfigData);
    await inspectDataFile(ctrl, presets.GCGGameExcelConfigData);

    await closeKnex();
  })();
}