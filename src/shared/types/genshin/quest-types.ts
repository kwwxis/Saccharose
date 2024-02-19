import { DialogExcelConfigData, ManualTextMapConfigData, TalkExcelConfigData } from './dialogue-types.ts';
import { ConfigCondition } from './general-types.ts';
import { RewardExcelConfigData } from './material-types.ts';
import { QuestOrderItem } from '../../../backend/domain/genshin/dialogue/dialogue_util.ts';

export type QuestType = 'AQ' | 'SQ' | 'EQ' | 'WQ';
export type MapByQuestType<T> = {
  AQ: T,
  SQ: T,
  EQ: T,
  WQ: T
};

export interface ChapterCollection {
  AQ: {[chapterName: string]: {[subChapterName: string]: ChapterExcelConfigData[]}},
  SQ: {[chapterName: string]: {[subChapterName: string]: ChapterExcelConfigData[]}},
  EQ: {[chapterName: string]: ChapterExcelConfigData[]},
  WQ: {[chapterName: string]: ChapterExcelConfigData[]},
}

export interface MainQuestExcelConfigData {
  Id: number,
  Series: number,
  ChapterId?: number,
  Type?: QuestType,
  ActiveMode: string,
  TitleText?: string,
  TitleTextMapHash: number,
  DescText?: string,
  DescTextMapHash: number,
  LuaPath: string,
  SuggestTrackOutOfOrder?: boolean,
  SuggestTrackMainQuestList?: number[],
  RewardIdList: number[],
  ShowType: string,

  QuestExcelConfigDataList?: QuestExcelConfigData[],
  UnsectionedTalks?: TalkExcelConfigData[],
  NonTalkDialog?: DialogExcelConfigData[][],
  QuestMessages?: ManualTextMapConfigData[],
  __globalVarPos?: number,
}

export type QuestExcelConfigDataFailCondType =
  'QUEST_CONTENT_ACHIEVEMENT_ISACHIEVED'          |
  'QUEST_CONTENT_ACTIVITY_TRIGGER_FAILED'         |
  'QUEST_CONTENT_ADD_QUEST_PROGRESS'              |
  'QUEST_CONTENT_BARGAIN_FAIL'                    |
  'QUEST_CONTENT_COMPLETE_TALK'                   |
  'QUEST_CONTENT_ENTER_DUNGEON'                   |
  'QUEST_CONTENT_ENTER_MY_WORLD'                  |
  'QUEST_CONTENT_ENTER_ROOM'                      |
  'QUEST_CONTENT_FAIL_DUNGEON'                    |
  'QUEST_CONTENT_FINISH_ITEM_GIVING'              |
  'QUEST_CONTENT_FINISH_PLOT'                     |
  'QUEST_CONTENT_GADGET_STATE_CHANGE'             |
  'QUEST_CONTENT_GAME_TIME_TICK'                  |
  'QUEST_CONTENT_GCG_LEVEL_WIN'                   |
  'QUEST_CONTENT_INTERACT_GADGET'                 |
  'QUEST_CONTENT_ITEM_LESS_THAN'                  |
  'QUEST_CONTENT_ITEM_LESS_THAN_BARGAIN'          |
  'QUEST_CONTENT_LEAVE_SCENE'                     |
  'QUEST_CONTENT_LEAVE_SCENE_RANGE'               |
  'QUEST_CONTENT_LEAVE_SCENE_RANGE_AND_ROOM'      |
  'QUEST_CONTENT_MAIN_COOP_ENTER_ANY_SAVE_POINT'  |
  'QUEST_CONTENT_MAIN_COOP_ENTER_SAVE_POINT'      |
  'QUEST_CONTENT_NOT_FINISH_PLOT'                 |
  'QUEST_CONTENT_OBTAIN_ITEM'                     |
  'QUEST_CONTENT_QUEST_GLOBAL_VAR_EQUAL'          |
  'QUEST_CONTENT_QUEST_GLOBAL_VAR_GREATER'        |
  'QUEST_CONTENT_QUEST_STATE_EQUAL'               |
  'QUEST_CONTENT_QUEST_STATE_NOT_EQUAL'           |
  'QUEST_CONTENT_QUEST_VAR_EQUAL'                 |
  'QUEST_CONTENT_QUEST_VAR_GREATER'               |
  'QUEST_CONTENT_QUEST_VAR_LESS'                  |
  'QUEST_CONTENT_SCENE_LEVEL_TAG_EQ'              |
  'QUEST_CONTENT_UNLOCK_TRANS_POINT'              ;
export type QuestExcelConfigDataFailExecType =
  'QUEST_EXEC_ADD_QUEST_PROGRESS'         |
  'QUEST_EXEC_ADD_SCENE_TAG'              |
  'QUEST_EXEC_CHANGE_SKILL_DEPOT'         |
  'QUEST_EXEC_DEACTIVE_ITEM_GIVING'       |
  'QUEST_EXEC_DEC_QUEST_VAR'              |
  'QUEST_EXEC_DEL_ALL_SPECIFIC_PACK_ITEM' |
  'QUEST_EXEC_DEL_PACK_ITEM'              |
  'QUEST_EXEC_DEL_SCENE_TAG'              |
  'QUEST_EXEC_INC_QUEST_GLOBAL_VAR'       |
  'QUEST_EXEC_INC_QUEST_VAR'              |
  'QUEST_EXEC_LOCK_POINT'                 |
  'QUEST_EXEC_MODIFY_WEATHER_AREA'        |
  'QUEST_EXEC_NOTIFY_GROUP_LUA'           |
  'QUEST_EXEC_REFRESH_GROUP_SUITE'        |
  'QUEST_EXEC_REGISTER_DYNAMIC_GROUP'     |
  'QUEST_EXEC_REMOVE_TRIAL_AVATAR'        |
  'QUEST_EXEC_ROLLBACK_PARENT_QUEST'      |
  'QUEST_EXEC_ROLLBACK_QUEST'             |
  'QUEST_EXEC_SET_IS_GAME_TIME_LOCKED'    |
  'QUEST_EXEC_SET_IS_GAME_TIME_LOCKED_V2' |
  'QUEST_EXEC_SET_QUEST_GLOBAL_VAR'       |
  'QUEST_EXEC_SET_QUEST_VAR'              |
  'QUEST_EXEC_SET_WEATHER_GADGET'         |
  'QUEST_EXEC_STOP_BARGAIN'               |
  'QUEST_EXEC_UNLOCK_AVATAR_TEAM'         |
  'QUEST_EXEC_UNLOCK_AVATAR_TEAM_V2'      |
  'QUEST_EXEC_UNLOCK_MIRROR_AVATAR_TEAM'  |
  'QUEST_EXEC_UNLOCK_POINT'               |
  'QUEST_EXEC_UNREGISTER_DYNAMIC_GROUP'   ;
export type QuestExcelConfigDataFinishCondType =
  'QUEST_CONTENT_ACHIEVEMENT_STATE_EQUAL'             |
  'QUEST_CONTENT_ACTIVITY_TRIGGER_UPDATE'             |
  'QUEST_CONTENT_ADD_QUEST_PROGRESS'                  |
  'QUEST_CONTENT_AVATAR_RENAME_COMPLETE'              |
  'QUEST_CONTENT_BARGAIN_FAIL'                        |
  'QUEST_CONTENT_BARGAIN_SUCC'                        |
  'QUEST_CONTENT_CAPTURE_USE_MATERIAL_LIST'           |
  'QUEST_CONTENT_CITY_LEVEL_UP'                       |
  'QUEST_CONTENT_CLEAR_GROUP_MONSTER'                 |
  'QUEST_CONTENT_COMPLETE_TALK'                       |
  'QUEST_CONTENT_DESTROY_GADGET'                      |
  'QUEST_CONTENT_ENTER_DUNGEON'                       |
  'QUEST_CONTENT_ENTER_MY_WORLD'                      |
  'QUEST_CONTENT_ENTER_MY_WORLD_SCENE'                |
  'QUEST_CONTENT_ENTER_ROGUE_DUNGEON'                 |
  'QUEST_CONTENT_ENTER_ROOM'                          |
  'QUEST_CONTENT_ENTER_VEHICLE'                       |
  'QUEST_CONTENT_EVENTS_ITEM_STATUS'                  |
  'QUEST_CONTENT_EXHIBITION_ACCUMULATE_GT_EQ'         |
  'QUEST_CONTENT_FAIL_DUNGEON'                        |
  'QUEST_CONTENT_FINISH_DUNGEON'                      |
  'QUEST_CONTENT_FINISH_ITEM_GIVING'                  |
  'QUEST_CONTENT_FINISH_PLOT'                         |
  'QUEST_CONTENT_FISHING_SUCC'                        |
  'QUEST_CONTENT_GADGET_STATE_CHANGE'                 |
  'QUEST_CONTENT_GAME_TIME_TICK'                      |
  'QUEST_CONTENT_GCG_GUIDE_PROGRESS'                  |
  'QUEST_CONTENT_GCG_LEVEL_WIN'                       |
  'QUEST_CONTENT_INTERACT_GADGET'                     |
  'QUEST_CONTENT_IRODORI_FINISH_FLOWER_COMBINATION'   |
  'QUEST_CONTENT_IRODORI_POETRY_FINISH_FILL_POETRY'   |
  'QUEST_CONTENT_IRODORI_POETRY_REACH_MIN_PROGRESS'   |
  'QUEST_CONTENT_ITEM_LESS_THAN'                      |
  'QUEST_CONTENT_ITEM_NUM_EQUAL'                      |
  'QUEST_CONTENT_ITEM_NUM_GREATER'                    |
  'QUEST_CONTENT_ITEM_NUM_LESS'                       |
  'QUEST_CONTENT_LEAVE_SCENE'                         |
  'QUEST_CONTENT_LEAVE_SCENE_RANGE'                   |
  'QUEST_CONTENT_LEAVE_SCENE_RANGE_AND_ROOM'          |
  'QUEST_CONTENT_LUA_NOTIFY'                          |
  'QUEST_CONTENT_MAIN_COOP_ENTER_ANY_SAVE_POINT'      |
  'QUEST_CONTENT_MAIN_COOP_ENTER_SAVE_POINT'          |
  'QUEST_CONTENT_MONSTER_DIE'                         |
  'QUEST_CONTENT_OBTAIN_ITEM'                         |
  'QUEST_CONTENT_OBTAIN_MATERIAL_WITH_SUBTYPE'        |
  'QUEST_CONTENT_QUEST_GLOBAL_VAR_EQUAL'              |
  'QUEST_CONTENT_QUEST_GLOBAL_VAR_GREATER'            |
  'QUEST_CONTENT_QUEST_GLOBAL_VAR_LESS'               |
  'QUEST_CONTENT_QUEST_GLOBAL_VAR_NOT_EQUAL'          |
  'QUEST_CONTENT_QUEST_STATE_EQUAL'                   |
  'QUEST_CONTENT_QUEST_STATE_NOT_EQUAL'               |
  'QUEST_CONTENT_QUEST_VAR_EQUAL'                     |
  'QUEST_CONTENT_QUEST_VAR_GREATER'                   |
  'QUEST_CONTENT_QUEST_VAR_LESS'                      |
  'QUEST_CONTENT_QUEST_VAR_NOT_EQUAL'                 |
  'QUEST_CONTENT_SCENE_LEVEL_TAG_EQ'                  |
  'QUEST_CONTENT_SHOP_SELL_OUT'                       |
  'QUEST_CONTENT_SKILL'                               |
  'QUEST_CONTENT_TIME_VAR_GT_EQ'                      |
  'QUEST_CONTENT_TIME_VAR_PASS_DAY'                   |
  'QUEST_CONTENT_TRIGGER_FIRE'                        |
  'QUEST_CONTENT_UNLOCK_ANY_TRANS_POINT'              |
  'QUEST_CONTENT_UNLOCK_TRANS_POINT'                  |
  'QUEST_CONTENT_USE_ITEM'                            |
  'QUEST_CONTENT_USE_WIDGET'                          ;
export type QuestExcelConfigDataFinishExecType =
  'QUEST_EXEC_ACTIVE_ACTIVITY_COND_STATE'                 |
  'QUEST_EXEC_ACTIVE_ITEM_GIVING'                         |
  'QUEST_EXEC_ADD_CUR_AVATAR_ENERGY'                      |
  'QUEST_EXEC_ADD_QUEST_PROGRESS'                         |
  'QUEST_EXEC_ADD_SCENE_TAG'                              |
  'QUEST_EXEC_CHANGE_AVATAR_ELEMET'                       |
  'QUEST_EXEC_CHANGE_MAP_AREA_STATE'                      |
  'QUEST_EXEC_CHANGE_SCENE_LEVEL_TAG'                     |
  'QUEST_EXEC_CHANGE_SKILL_DEPOT'                         |
  'QUEST_EXEC_CLEAR_TIME_VAR'                             |
  'QUEST_EXEC_DEACTIVE_ITEM_GIVING'                       |
  'QUEST_EXEC_DEL_ALL_SPECIFIC_PACK_ITEM'                 |
  'QUEST_EXEC_DEL_PACK_ITEM'                              |
  'QUEST_EXEC_DEL_PACK_ITEM_BATCH'                        |
  'QUEST_EXEC_DEL_SCENE_TAG'                              |
  'QUEST_EXEC_GRANT_TRIAL_AVATAR'                         |
  'QUEST_EXEC_GRANT_TRIAL_AVATAR_AND_LOCK_TEAM'           |
  'QUEST_EXEC_GRANT_TRIAL_AVATAR_AND_LOCK_TEAM_V2'        |
  'QUEST_EXEC_GRANT_TRIAL_AVATAR_BATCH_AND_LOCK_TEAM_V2'  |
  'QUEST_EXEC_HIDE_SCENE_POINT'                           |
  'QUEST_EXEC_INACTIVE_ACTIVITY_COND_STATE'               |
  'QUEST_EXEC_INC_DAILY_TASK_VAR'                         |
  'QUEST_EXEC_INC_QUEST_GLOBAL_VAR'                       |
  'QUEST_EXEC_INC_QUEST_VAR'                              |
  'QUEST_EXEC_INIT_TIME_VAR'                              |
  'QUEST_EXEC_LOCK_AVATAR_TEAM'                           |
  'QUEST_EXEC_LOCK_AVATAR_TEAM_V2'                        |
  'QUEST_EXEC_LOCK_POINT'                                 |
  'QUEST_EXEC_MODIFY_ARANARA_COLLECTION_STATE'            |
  'QUEST_EXEC_MODIFY_CLIMATE_AREA'                        |
  'QUEST_EXEC_MODIFY_WEATHER_AREA'                        |
  'QUEST_EXEC_NOTIFY_DAILY_TASK'                          |
  'QUEST_EXEC_NOTIFY_GROUP_LUA'                           |
  'QUEST_EXEC_OPTIONAL_REVIVAL_TEAM'                      |
  'QUEST_EXEC_RANDOM_CLOSED_QUEST_VAR'                    |
  'QUEST_EXEC_RANDOM_QUEST_VAR'                           |
  'QUEST_EXEC_REFRESH_GROUP_MONSTER'                      |
  'QUEST_EXEC_REFRESH_GROUP_SUITE'                        |
  'QUEST_EXEC_REFRESH_GROUP_SUITE_RANDOM'                 |
  'QUEST_EXEC_REFRESH_WORLD_QUEST_FLOW_GROUP_SUITE'       |
  'QUEST_EXEC_REGISTER_DYNAMIC_GROUP'                     |
  'QUEST_EXEC_REGISTER_DYNAMIC_GROUP_ONLY'                |
  'QUEST_EXEC_REMOVE_TRIAL_AVATAR'                        |
  'QUEST_EXEC_ROLLBACK_PARENT_QUEST'                      |
  'QUEST_EXEC_ROLLBACK_QUEST'                             |
  'QUEST_EXEC_SET_DAILY_TASK_VAR'                         |
  'QUEST_EXEC_SET_GAME_TIME'                              |
  'QUEST_EXEC_SET_IS_DIVEABLE'                            |
  'QUEST_EXEC_SET_IS_FLYABLE'                             |
  'QUEST_EXEC_SET_IS_GAME_TIME_LOCKED'                    |
  'QUEST_EXEC_SET_IS_GAME_TIME_LOCKED_V2'                 |
  'QUEST_EXEC_SET_IS_WEATHER_LOCKED'                      |
  'QUEST_EXEC_SET_MAP_LAYER_UNLOCK_STATE'                 |
  'QUEST_EXEC_SET_OPEN_STATE'                             |
  'QUEST_EXEC_SET_QUEST_GLOBAL_VAR'                       |
  'QUEST_EXEC_SET_QUEST_VAR'                              |
  'QUEST_EXEC_SET_WEATHER_GADGET'                         |
  'QUEST_EXEC_SHOW_MAP_LAYER_GROUP'                       |
  'QUEST_EXEC_STOP_BARGAIN'                               |
  'QUEST_EXEC_UNHIDE_SCENE_POINT'                         |
  'QUEST_EXEC_UNLOCK_AREA'                                |
  'QUEST_EXEC_UNLOCK_AVATAR_TEAM'                         |
  'QUEST_EXEC_UNLOCK_AVATAR_TEAM_V2'                      |
  'QUEST_EXEC_UNLOCK_EVENTS_ITEM'                         |
  'QUEST_EXEC_UNLOCK_MIRROR_AVATAR_TEAM'                  |
  'QUEST_EXEC_UNLOCK_POINT'                               |
  'QUEST_EXEC_UNREGISTER_DYNAMIC_GROUP'                   |
  'QUEST_EXEC_UPDATE_PARENT_QUEST_REWARD_INDEX'           ;

export interface QuestExcelConfigData {
  SubId: number,
  MainId: number,
  Order: number,
  DescText?: string,
  DescTextMapHash: number,
  StepDescText?: string,
  StepDescTextMapHash: number,
  ShowType: string, // e.g. "QUEST_HIDDEN"

  // Guide
  Guide: ConfigCondition,
  GuideTipsText?: string,
  GuideTipsTextMapHash: number,

  // Cond/Exec
  FailCond: ConfigCondition<QuestExcelConfigDataFailCondType>[],
  FailCondComb: string,
  FailExec: ConfigCondition<QuestExcelConfigDataFailExecType>[],

  FinishCond: ConfigCondition<QuestExcelConfigDataFinishCondType>[],
  FinishCondComb: string,
  FinishExec: ConfigCondition<QuestExcelConfigDataFinishExecType>[],

  // Custom:
  TalkExcelConfigDataList?: TalkExcelConfigData[],
  QuestMessages?: ManualTextMapConfigData[],
  NonTalkDialog?: DialogExcelConfigData[][],
}

export interface ChapterExcelConfigData {
  Id: number,
  BeginQuestId: number,
  EndQuestId: number,
  ChapterNumText: string
  ChapterNumTextMapHash: number,
  ChapterTitleText: string,
  ChapterTitleTextMapHash: number,
  ChapterIcon: string,
  ChapterImageHashSuffix: number,
  ChapterImageHashPre: number,
  ChapterImageTitleText: string,
  ChapterImageTitleTextMapHash: number,
  ChapterSerialNumberIcon: string
  NeedPlayerLevel?: number,
  Type?: QuestType,
  Quests?: MainQuestExcelConfigData[],
  OrderedQuests?: QuestOrderItem[],
  Summary?: ChapterSummary;
}

export interface ChapterSummary {
  ChapterNum: number,
  ChapterRoman: string,
  ChapterNumText: string,
  ChapterName: string,

  ActNum: number,
  ActName: string,
  ActNumText: string,
  ActRoman: string,
  ActType: string,

  AQCode: string,
}

export interface ReputationQuestExcelConfigData {
  ParentQuestId: number,
  CityId: number,
  CityName?: string,
  RewardId: number,
  Reward?: RewardExcelConfigData,
  IconName: string,
  TitleText: string,
  TitleTextMapHash: number,
  Order: number
}
