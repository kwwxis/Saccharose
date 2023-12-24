import { ElementType } from './manual-text-map.ts';

export type DungeonType =
  'DUNGEON_ACTIVITY'                  |
  'DUNGEON_BIGWORLD_MIRROR'           |
  'DUNGEON_BLITZ_RUSH'                |
  'DUNGEON_BOSS'                      |
  'DUNGEON_BRICK_BREAKER'             |
  'DUNGEON_CHANNELLER_SLAB_LOOP'      |
  'DUNGEON_CHANNELLER_SLAB_ONE_OFF'   |
  'DUNGEON_CHAR_AMUSEMENT'            |
  'DUNGEON_CHESS'                     |
  'DUNGEON_CRYSTAL_LINK'              |
  'DUNGEON_DAILY_FIGHT'               |
  'DUNGEON_DISCARDED'                 |
  'DUNGEON_DREAMLAND'                 |
  'DUNGEON_DUEL_HEART'                |
  'DUNGEON_DUEL_HEART_PLOT'           |
  'DUNGEON_EFFIGY'                    |
  'DUNGEON_EFFIGY_CHALLENGE_V2'       |
  'DUNGEON_ELEMENT_CHALLENGE'         |
  'DUNGEON_FIGHT'                     |
  'DUNGEON_FLEUR_FAIR'                |
  'DUNGEON_FUNGUS_FIGHTER_PLOT'       |
  'DUNGEON_FUNGUS_FIGHTER_TRAINING'   |
  'DUNGEON_GCG'                       |
  'DUNGEON_HACHI'                     |
  'DUNGEON_INSTABLE_SPRAY'            |
  'DUNGEON_IRODORI_CHESS'             |
  'DUNGEON_MINI_ELDRITCH'             |
  'DUNGEON_MIST_TRIAL'                |
  'DUNGEON_MUQADAS_POTION'            |
  'DUNGEON_PLOT'                      |
  'DUNGEON_POTION'                    |
  'DUNGEON_ROGUELIKE'                 |
  'DUNGEON_ROGUE_DIARY'               |
  'DUNGEON_SUMMER_V2'                 |
  'DUNGEON_SUMO_COMBAT'               |
  'DUNGEON_TEAM_CHAIN'                |
  'DUNGEON_THEATRE_MECHANICUS'        |
  'DUNGEON_TOWER'                     |
  'DUNGEON_UGC'                       |
  'DUNGEON_WIND_FIELD'                ;

export type DungeonSettleShowType =
  'SETTLE_SHOW_BLACKSCREEN'       |
  'SETTLE_SHOW_KILL_MONSTER_COUNT'|
  'SETTLE_SHOW_NONE'              |
  'SETTLE_SHOW_OPEN_CHEST_COUNT'  |
  'SETTLE_SHOW_TIME_COST'         ;

export interface DungeonExcelConfigData {
  Id: number,

  // Names
  NameTextMapHash: number,
  DescTextMapHash: number,
  DisplayNameTextMapHash: number,
  GearDescTextMapHash: number,
  NameText: string,
  DescText: string,
  DisplayNameText: string,
  GearDescText: string,

  // Types
  Type: string,
  SubType?: 'DUNGEON_SUB_BOSS' | 'DUNGEON_SUB_RELIQUARY' | 'DUNGEON_SUB_TALENT' | 'DUNGEON_SUB_WEAPON',
  InvolveType: 'INVOLVE_ONLY_SINGLE' | 'INVOLVE_SINGLE_MULTIPLE',
  SettleUIType?: 'SETTLE_UI_NEVER_SHOW' | 'SETTLE_UI_ON_FAIL',
  SettleShows: DungeonSettleShowType[],
  StateType?: 'DUNGEON_STATE_RELEASE' | 'DUNGEON_STATE_TEST',
  PlayType?: 'DUNGEON_PLAY_TYPE_FOGGY_MAZE' | 'DUNGEON_PLAY_TYPE_MIST_TRIAL' | 'DUNGEON_PLAY_TYPE_TRIAL_AVATAR',

  // Domain Preview
  CityId: number,
  RecommendElementTypes: ElementType[],
  RecommendElementNames: string[],
  RecommendTips: never,
  PreviewMonsterList: number[],

  // Reward
  FirstPassRewardPreviewId: number,
  PassCond: number, // DomainPassExcelConfigData
  PassRewardPreviewId: number,
  MappedPassCond?: DungeonPassExcelConfigData,

  // Level Req
  ShowLevel: number,
  LimitLevel: number,
  LevelRevise: number,

  // Countdown
  SettleCountdownTime: number,
  FailSettleCountdownTime: number,
  QuitSettleCountdownTime: number,

  // Statue Cost
  StatueCostId: number,
  StatueCostCount: number,
  StatueDrop: number,

  // Conditions
  ForbiddenRestart: boolean,
  IsDynamicLevel: boolean,
  EnableQuestGuide: boolean,
  DontShowPushTips: boolean,

  // Other IDs
  SerialId: number,
  SceneId: number,
  LevelConfigMap: {[DungeonLevelEntityConfigDataId: number]: number}, // Not sure what the value is for, but it always seems to be `100`
  AvatarLimitType: number,

  // Images
  EntryPicPath: string,
  FactorPic: string,
  FactorIcon: string,

  // Other:
  ReviveMaxCount: number,
  DayEnterCount: number,
  PassJumpDungeon: number,
  EventInterval: number,
  ReviveIntervalTime: number,

  // Unused:
  CEJNGDKNBFP: boolean,
  CADCHBEJFLN: boolean,
  IHKGGJBNLIG: boolean,
  EnterCostItems: never,
  MappedRecommendTips: never,
}

export type DungeonPassCondType =
  'DUNGEON_COND_END_MULTISTAGE_PLAY'  |
  'DUNGEON_COND_FINISH_CHALLENGE'     |
  'DUNGEON_COND_FINISH_QUEST'         |
  'DUNGEON_COND_IN_TIME'              |
  'DUNGEON_COND_KILL_GROUP_MONSTER'   |
  'DUNGEON_COND_KILL_MONSTER'         |
  'DUNGEON_COND_KILL_MONSTER_COUNT'   |
  'DUNGEON_COND_KILL_TYPE_MONSTER'    ;

export interface DungeonPassExcelConfigData {
  Id: number,
  Conds: {
    CondType: DungeonPassCondType,
    Param: number[]
  }[],
  LogicType?: 'LOGIC_AND' | 'LOGIC_OR',
}

export type DungeonEntryType =
  'DUNGEN_ENTRY_TYPE_AVATAR_TALENT'           |
  'DUNGEN_ENTRY_TYPE_RELIQUARY'               |
  'DUNGEN_ENTRY_TYPE_WEAPON_PROMOTE'          |
  'DUNGEON_ENTRY_TYPE_ACTIVITY'               |
  'DUNGEON_ENTRY_TYPE_BLITZ_RUSH'             |
  'DUNGEON_ENTRY_TYPE_CHANNELLER_SLAB_LOOP'   |
  'DUNGEON_ENTRY_TYPE_CHANNELLER_SLAB_ONE_OFF'|
  'DUNGEON_ENTRY_TYPE_EFFIGY'                 |
  'DUNGEON_ENTRY_TYPE_FLEUR_FAIR'             |
  'DUNGEON_ENTRY_TYPE_HACHI'                  |
  'DUNGEON_ENTRY_TYPE_NORMAL'                 |
  'DUNGEON_ENTRY_TYPE_OBSCURAE'               |
  'DUNGEON_ENTRY_TYPE_SUMO'                   |
  'DUNGEON_ENTRY_TYPE_TRIAL'                  ;

export interface DungeonEntryExcelConfigData {
  Id: number,
  Type: DungeonEntryType,
  SatisfiedCond: {
    Type: 'DUNGEON_ENTRY_CONDITION_LEVEL' | 'DUNGEON_ENTRY_CONDITION_QUEST',
    Param1: number
  }[],
  CondComb?: 'LOGIC_OR',
  SceneId: number,
  DungeonEntryId: number,
  IsShowInAdvHandbook: boolean,
  DescTextMapHash: number,
  CooldownTipsDungeonId: number[],
  PicPath: string,
  SystemOpenUiId: number,
  RewardDataId: number,
  DescriptionCycleRewardList: number[][],
  DescText: string,
  IsDailyRefresh: boolean,
  IsDefaultOpen: boolean,
}

export interface DungeonElementChallengeExcelConfigData {
  DungeonId: number,
  TrialAvatarId: number[],
  TutorialId: number,
}

export type DungeonChallengeType =
  'CHALLENGE_CRYSTAL_ELEMENT_REACTION_COUNT'  |
  'CHALLENGE_DIE_LESS_IN_TIME'                |
  'CHALLENGE_ELEMENT_REACTION_COUNT'          |
  'CHALLENGE_FATHER_SUCC_IN_TIME'             |
  'CHALLENGE_FREEZE_ENEMY_IN_TIME'            |
  'CHALLENGE_GUARD_HP'                        |
  'CHALLENGE_KILL_COUNT'                      |
  'CHALLENGE_KILL_COUNT_FAST'                 |
  'CHALLENGE_KILL_COUNT_FROZEN_LESS'          |
  'CHALLENGE_KILL_COUNT_GUARD_HP'             |
  'CHALLENGE_KILL_COUNT_IN_TIME'              |
  'CHALLENGE_KILL_MONSTER_IN_TIME'            |
  'CHALLENGE_LUA_IN_TIME'                     |
  'CHALLENGE_MONSTER_DAMAGE_COUNT'            |
  'CHALLENGE_SHEILD_ABSORB_DAMAGE_COUNT'      |
  'CHALLENGE_SURVIVE'                         |
  'CHALLENGE_SURVIVE_IN_TIME'                 |
  'CHALLENGE_SWIRL_ELEMENT_REACTION_COUNT'    |
  'CHALLENGE_TIME_FLY'                        |
  'CHALLENGE_TRIGGER2_AVOID_TRIGGER1'         |
  'CHALLENGE_TRIGGER_COUNT'                   |
  'CHALLENGE_TRIGGER_IN_TIME'                 |
  'CHALLENGE_TRIGGER_IN_TIME_FLY'             ;

export interface DungeonChallengeConfigData {
  Id: number,
  ChallengeType: DungeonChallengeType,
  InterruptButtonType?: 'INTERRUPT_BUTTON_TYPE_ALL' | 'INTERRUPT_BUTTON_TYPE_HOST',

  TargetTextTemplateTextMapHash: number,
  SubTargetTextTemplateTextMapHash: number,
  ProgressTextTemplateTextMapHash: number,
  SubProgressTextTemplateTextMapHash: number,
  TargetTextTemplateText: string,
  SubTargetTextTemplateText: string,
  ProgressTextTemplateText: string,
  SubProgressTextTemplateText: string,

  TeamAbilityGroupList: string[],
  SubChallengeFadeOutRule: string,
  SubChallengeBannerRule: string,
  RecordType?: 'CHALLENGE_RECORD_TYPE_IN_TIME',
  ActivitySkillId: number,

  SubChallengeFadeOutDelayTime: number,
  NoSuccessHint: boolean,
  NoFailHint: boolean,
  IsBlockTopTimer: boolean,
  EKONCKMFLEP: boolean,
  NoPauseHint: boolean,
  IsSuccessWhenNotSettled: boolean,
  IsForwardTiming: boolean,
  IsTransBackWhenInterrupt: boolean,

  SubChallengeSortType?: 'SUB_CHALLENGE_SORT_TYPE_CHALLENGEINDEX',
  SubChallengeStartAnim?: string,
  SubChallengeSuccessAnim?: string,
  SubChallengeFailAnim?: string,
}

export interface DungeonLevelEntityConfigData {
  ClientId: number,
  Id: number,
  Show: boolean,
  LevelConfigName: string,
  DescTextMapHash: number,
  SwitchTitleTextMapHash: number,
  DescText: string,
  SwitchTitleText: string,
}
