import { pathToFileURL } from 'url';
import { getGenshinControl } from '../../domain/genshin/genshinControl.ts';
import { closeKnex } from '../../util/db.ts';
import { inspectDataFile, InspectOpt } from '../util/inspect_file_util.ts';
import { LoadingTipsExcelConfigData } from '../../../shared/types/genshin/loading-types.ts';
import { HomeWorldFurnitureExcelConfigData } from '../../../shared/types/genshin/homeworld-types.ts';
import { ReminderExcelConfigData } from '../../../shared/types/genshin/dialogue-types.ts';
import { toInt } from '../../../shared/util/numberUtil.ts';
import { QuestExcelConfigData } from '../../../shared/types/genshin/quest-types.ts';
import { DocumentExcelConfigData } from '../../../shared/types/genshin/readable-types.ts';
import { NpcExcelConfigData } from '../../../shared/types/genshin/general-types.ts';

const excel = (file: string) => `./ExcelBinOutput/${file}.json`;

const presets = {
  DialogExcelConfigData: <InspectOpt> { file: excel('DialogExcelConfigData'), inspectFieldValues: ['TalkRole.Type', 'Type', 'OptionIcon'] },
  MaterialExcelConfigData: <InspectOpt> { file: excel('MaterialExcelConfigData'), inspectFieldValues: ['EffectIcon', 'MaterialType', 'ItemType', 'UseTarget', 'ItemUse[#ALL].UseOp'] },
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
  QuestExcelConfigData: <InspectOpt> { file: excel('QuestExcelConfigData'), inspectFieldValues: ['FailCond[#ALL].Type', 'FailExec[#ALL].Type', 'FinishCond[#ALL].Type', 'FinishExec[#ALL].Type',] },
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
  MaterialCodexExcelConfigData: <InspectOpt> { file: excel('MaterialCodexExcelConfigData'), inspectFieldValues: ['Type'] },
  HomeworldAnimalExcelConfigData: <InspectOpt> { file: excel('HomeworldAnimalExcelConfigData') },
  HomeWorldFurnitureExcelConfigData: <InspectOpt> { file: excel('HomeWorldFurnitureExcelConfigData'), inspectFieldValues: ['EffectIcon', 'SpecialFurnitureType', 'SurfaceType', 'GroupRecordType'] },
  AnimalCodexExcelConfigData: <InspectOpt> { file: excel('AnimalCodexExcelConfigData'), inspectFieldValues: ['Type', 'SubType', 'CountType'] },
  AnimalDescribeExcelConfigData: <InspectOpt> { file: excel('AnimalDescribeExcelConfigData') },
  LoadingTipsExcelConfigData: <InspectOpt> { file: excel('LoadingTipsExcelConfigData'), inspectFieldValues: ['PreMainQuestIds', 'PreQuestIdList', 'DisableQuestIdList'] },

  ReminderExcelConfigData: <InspectOpt> { file: excel('ReminderExcelConfigData'), inspectFieldValues: ['Style'] },
  EquipAffixExcelConfigData: <InspectOpt> { file: excel('EquipAffixExcelConfigData'), inspectFieldValues: ['AddProps[#ALL].PropType'] },
  CodexQuestExcelConfigData: <InspectOpt> { file: excel('CodexQuestExcelConfigData'), inspectFieldValues: ['SpeakerTextType', 'ContentTextType'] },

  GivingExcelConfigData: <InspectOpt> { file: excel('GivingExcelConfigData'), inspectFieldValues: ['Tab', 'GivingMethod', 'GivingType'],
  filter(record) {
      return record.GivingMethod === 'GIVING_METHOD_EXACT';
  },},
  GivingGroupExcelConfigData: <InspectOpt> { file: excel('GivingGroupExcelConfigData'), inspectFieldValues: [] },
  DocumentExcelConfigData: <InspectOpt> { file: excel('DocumentExcelConfigData'), inspectFieldValues: ['DocumentType', 'SplitType'] },
  NpcExcelConfigData: <InspectOpt> { file: excel('NpcExcelConfigData'), inspectFieldValues: ['BodyType', 'SpecialType', 'BillboardType', 'ElementName', 'ElementType']}
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const ctrl = getGenshinControl();
    await inspectDataFile(ctrl, presets.NpcExcelConfigData);
    await closeKnex();
  })();
}
