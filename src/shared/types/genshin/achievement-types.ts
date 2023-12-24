import { RewardExcelConfigData } from './material-types.ts';
import { MainQuestExcelConfigData } from './quest-types.ts';
export type AchievementTriggerType =
  'TRIGGER_ABILITY_STATE_PASS_TIME'               |
  'TRIGGER_ARRANGEMENT_FURNITURE'                 |
  'TRIGGER_ARRANGEMENT_FURNITURE_COUNT'           |
  'TRIGGER_AVATAR_PROMOTE'                        |
  'TRIGGER_BATTLE_FOR_MONSTER_DIE_AND'            |
  'TRIGGER_BATTLE_FOR_MONSTER_DIE_OR'             |
  'TRIGGER_BUY_SHOP_GOODS'                        |
  'TRIGGER_BUY_SHOP_GOODS_AND'                    |
  'TRIGGER_CAPTURE_ANIMAL'                        |
  'TRIGGER_CITY_LEVEL_UP'                         |
  'TRIGGER_CITY_REPUTATION_FINISH_REQUEST'        |
  'TRIGGER_CITY_REPUTATION_LEVEL'                 |
  'TRIGGER_COLLECT_SET_OF_READINGS'               |
  'TRIGGER_COMBAT_CONFIG_COMMON'                  |
  'TRIGGER_COMBAT_MULTICOND_CONFIG_COMMON'        |
  'TRIGGER_COMBINE_ITEM'                          |
  'TRIGGER_CUR_AVATAR_HURT_BY_SPECIFIC_ABILITY'   |
  'TRIGGER_DAILY_TASK_VAR_EQUAL'                  |
  'TRIGGER_DONE_DUNGEON_WITH_SAME_ELEMENT_AVATARS'|
  'TRIGGER_DONE_TOWER_GADGET_UNHURT'              |
  'TRIGGER_DONE_TOWER_STARS'                      |
  'TRIGGER_DONE_TOWER_UNHURT'                     |
  'TRIGGER_DO_COOK'                               |
  'TRIGGER_ELEMENT_REACTION_TIMELIMIT_KILL_NUM'   |
  'TRIGGER_ELEMENT_REACTION_TIMELIMIT_NUM'        |
  'TRIGGER_ELEMENT_TYPE_CHANGE'                   |
  'TRIGGER_ENTER_SELF_HOME'                       |
  'TRIGGER_ENTER_VEHICLE'                         |
  'TRIGGER_FETTER_LEVEL_AVATAR_NUM'               |
  'TRIGGER_FINISH_CHALLENGE_IN_DURATION'          |
  'TRIGGER_FINISH_PARENT_QUEST_AND'               |
  'TRIGGER_FINISH_PARENT_QUEST_OR'                |
  'TRIGGER_FINISH_QUEST_AND'                      |
  'TRIGGER_FINISH_QUEST_OR'                       |
  'TRIGGER_FINISH_TOWER_LEVEL'                    |
  'TRIGGER_FISHING_FAIL_NUM'                      |
  'TRIGGER_FISHING_KEEP_BONUS'                    |
  'TRIGGER_FISHING_SUCC_NUM'                      |
  'TRIGGER_FORGE_WEAPON'                          |
  'TRIGGER_FULL_SATIATION_TEAM_AVATAR_NUM'        |
  'TRIGGER_FURNITURE_MAKE'                        |
  'TRIGGER_GADGET_INTERACTABLE'                   |
  'TRIGGER_GCG_CHALLENGE_PROGRESS'                |
  'TRIGGER_GCG_OBTAIN_COIN'                       |
  'TRIGGER_GROUP_NOTIFY'                          |
  'TRIGGER_GROUP_VARIABLE_SET_VALUE_TO'           |
  'TRIGGER_HOME_AVATAR_IN_COUNT'                  |
  'TRIGGER_HOME_AVATAR_REWARD_EVENT_ALL_COUNT'    |
  'TRIGGER_HOME_AVATAR_TALK_FINISH_ALL_COUNT'     |
  'TRIGGER_HOME_COIN'                             |
  'TRIGGER_HOME_FIELD_GATHER_COUNT'               |
  'TRIGGER_HOME_LEVEL'                            |
  'TRIGGER_HOME_MODULE_COMFORT_VALUE'             |
  'TRIGGER_HOME_UNLOCK_BGM_COUNT'                 |
  'TRIGGER_HUNTING_FAIL_NUM'                      |
  'TRIGGER_HUNTING_FINISH_NUM'                    |
  'TRIGGER_INTERACT_GADGET_WITH_INTERACT_ID'      |
  'TRIGGER_KILLED_BY_CERTAIN_MONSTER'             |
  'TRIGGER_KILLED_BY_SPECIFIC_ABILITY'            |
  'TRIGGER_MAIN_COOP_SAVE_POINT_AND'              |
  'TRIGGER_MAIN_COOP_SAVE_POINT_OR'               |
  'TRIGGER_MAIN_COOP_VAR_EQUAL'                   |
  'TRIGGER_MAX_CRITICAL_DAMAGE'                   |
  'TRIGGER_MAX_DASH_TIME'                         |
  'TRIGGER_MAX_FLY_MAP_DISTANCE'                  |
  'TRIGGER_MAX_FLY_TIME'                          |
  'TRIGGER_MIRACLE_RING_TAKE_REWARD'              |
  'TRIGGER_MP_DUNGEON_TIMES'                      |
  'TRIGGER_MP_KILL_MONSTER_ID_NUM'                |
  'TRIGGER_MP_KILL_MONSTER_NUM'                   |
  'TRIGGER_OBTAIN_ITEM_NUM'                       |
  'TRIGGER_OBTAIN_MATERIAL_NUM'                   |
  'TRIGGER_OBTAIN_RELIQUARY_NUM'                  |
  'TRIGGER_OFFERING_LEVEL'                        |
  'TRIGGER_OPEN_BLOSSOM_CHEST'                    |
  'TRIGGER_OPEN_CHEST_WITH_GADGET_ID'             |
  'TRIGGER_OPEN_WORLD_CHEST'                      |
  'TRIGGER_PAIMON_ANGRY_VOICE_EASTER_EGG'         |
  'TRIGGER_QUEST_GLOBAL_VAR_EQUAL'                |
  'TRIGGER_RELIQUARY_UPGRADE_EQUAL_RANK_LEVEL'    |
  'TRIGGER_SHIELD_SOURCE_NUM'                     |
  'TRIGGER_SHOCK_FISH_NUM'                        |
  'TRIGGER_SIT_DOWN_IN_ALL_POINTS'                |
  'TRIGGER_SIT_DOWN_IN_POINT'                     |
  'TRIGGER_SKILLED_AT_RECIPE'                     |
  'TRIGGER_STEAL_FOOD_TIMES'                      |
  'TRIGGER_TAKE_PHOTO'                            |
  'TRIGGER_TALK_NUM'                              |
  'TRIGGER_TELEPORT_WITH_CERTAIN_PORTAL'          |
  'TRIGGER_UNLOCK_AREA'                           |
  'TRIGGER_UNLOCK_FURNITURE_COUNT'                |
  'TRIGGER_UNLOCK_GATE_TEMPLE'                    |
  'TRIGGER_UNLOCK_RECIPE'                         |
  'TRIGGER_UNLOCK_SCENE_POINT'                    |
  'TRIGGER_UNLOCK_SPECIFIC_ANIMAL_CODEX'          |
  'TRIGGER_UNLOCK_SPECIFIC_RECIPE_OR'             |
  'TRIGGER_UNLOCK_TRANS_POINT'                    |
  'TRIGGER_USE_ENERGY_SKILL_NUM_TIMELIMIT'        |
  'TRIGGER_USE_ITEM'                              |
  'TRIGGER_VEHICLE_DASH'                          |
  'TRIGGER_VEHICLE_DURATION'                      |
  'TRIGGER_VEHICLE_FRIENDS'                       |
  'TRIGGER_VEHICLE_KILLED_BY_MONSTER'             |
  'TRIGGER_WEAPON_PROMOTE'                        ;

export interface AchievementExcelConfigData {
  Id: number,
  GoalId: number,
  OrderId: number,
  Goal?: AchievementGoalExcelConfigData;

  TitleText: string,
  TitleTextMapHash: number,

  DescText: string,
  DescTextMapHash: number,
  Ps5TitleText: string,
  Ps5TitleTextMapHash: number,

  PreStageAchievementId: number,
  FinishRewardId: number,
  FinishReward?: RewardExcelConfigData

  IsDeleteWatcherAfterFinish: boolean,
  TriggerConfig: {
    TriggerType: AchievementTriggerType,
    ParamList: string[],
    TriggerQuests: MainQuestExcelConfigData[],
    CityNameText: string,
  },
  Progress: number,
  Ps4GroupId: number,
  Ps5GroupId: number,
  Ttype: string,
  PsTrophyId: string,
  Ps4TrophyId: string,
  Ps5TrophyId: string,
  Icon: string,
  IsShow: 'SHOWTYPE_HIDE',
  IsDisuse: boolean,
  ProgressShowType: 'PROGRESSTYPE_FINISH' | 'PROGRESSTYPE_THOUSAND_TO_ONE',
  IsHidden: boolean,
}

export interface AchievementGoalExcelConfigData {
  Id: number,
  OrderId: number,
  NameText: string,
  NameTextEN: string,
  NameTextMapHash: number,
  IconPath: string,
  FinishRewardId: number,
  FinishReward?: RewardExcelConfigData
}

export type AchievementsByGoals = {
  [goalId: number]: {
    Goal: AchievementGoalExcelConfigData,
    Achievements: AchievementExcelConfigData[]
  }
}