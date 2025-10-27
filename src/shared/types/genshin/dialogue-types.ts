import { ConfigCondition } from './general-types.ts';
import { Readable } from './readable-types.ts';
import { NpcExcelConfigData } from './npc-types.ts';

export type TalkRoleType =
  'TALK_ROLE_NPC'
  | 'TALK_ROLE_PLAYER'
  | 'TALK_ROLE_BLACK_SCREEN'
  | 'TALK_ROLE_MATE_AVATAR'
  | 'TALK_ROLE_GADGET'
  | 'TALK_ROLE_CONSEQUENT_BLACK_SCREEN'
  | 'TALK_ROLE_NEED_CLICK_BLACK_SCREEN'
  | 'TALK_ROLE_CONSEQUENT_NEED_CLICK_BLACK_SCREEN'
  | 'TALK_ROLE_WIKI_CUSTOM';

export interface TalkRole {
  Type: TalkRoleType,
  Id: number | string,
  NameTextMapHash?: number, // custom
  NameText?: string, // custom
}

export type TalkType =
  'ACTIVITY' |
  'BLOSSOM' |
  'COOP' |
  'EQ' |
  'FREE' |
  'FURNITURE' |
  'GADGET' |
  'IQ' |
  'LQ' |
  'STORYBOARD' |
  'NARRATOR' |
  'WQ';

export type TalkBinType =
  'Activity' |
  'ActivityGroup' |
  'Blossom' |
  'BlossomGroup' |
  'Coop' |
  'FreeGroup' |
  'Gadget' |
  'GadgetGroup' |
  'Npc' |
  'NpcGroup' |
  'NpcOther' |
  'Quest';

export const OptionIconMap = {
  UI_Icon_Intee_ActivityProps: 'Special Souvenir',
  UI_Icon_Intee_AkaFes_Architect: 'Project Connectivity',
  UI_Icon_Intee_AkaFes_Astrolabe: 'Gathering of Stars',
  UI_Icon_Intee_AkaFes_Reasoning: 'In Truth\'s steps',
  UI_Icon_Intee_AkaFes_Rhythm: 'Mimetic Replication',
  UI_Icon_Intee_AreaUpgrad: '', // TODO not in wiki
  UI_Icon_Intee_Astrology: 'Astrology',
  UI_Icon_Intee_Blacksmith: 'Forging',
  UI_Icon_Intee_Blessing: 'Flushes',
  UI_Icon_Intee_Comfort: 'Tubby',
  UI_Icon_Intee_DailyEvent_0: 'Commission',
  UI_Icon_Intee_DailyEvent_1: 'Commission',
  UI_Icon_Intee_DiceDungeon: 'Heart of the Dice',
  UI_Icon_Intee_ElectroherculesBattle: 'BeetleBrawl',
  UI_Icon_Intee_Explore_0: 'Expedition',
  UI_Icon_Intee_Fishblaster: 'Dodoco',
  UI_Icon_Intee_Fishes: 'Fishing Supplies',
  UI_Icon_Intee_FlightChallenge: '', // TODO not in wiki
  UI_Icon_Intee_FungusFighter: '', // TODO not in wiki
  UI_Icon_Intee_FungusFighterV2: 'Fungus Mechanicus',
  UI_Icon_Intee_FurnitureBuild: 'Create',
  UI_Icon_Intee_GcgJiuGuan: '', // TODO not in wiki
  UI_Icon_Intee_GcgPve: '', // TODO not in wiki
  UI_Icon_Intee_GcgWatchVideo: '', // TODO not in wiki
  UI_Icon_Intee_GcgZhanDou: 'TCG',
  UI_Icon_Intee_GcgZhanDou_01: '', // TODO not in wiki
  UI_Icon_Intee_GeneralCargo: 'GeneralGoods',
  UI_Icon_Intee_GrowFlowers: '', // TODO not in wiki
  UI_Icon_Intee_HomeSwitch: 'Switch',
  UI_Icon_Intee_Investigation: 'Investigate',
  UI_Icon_Intee_LanV3BoatGame: '', // TODO not in wiki
  UI_Icon_Intee_LanV3Shadow: '', // TODO not in wiki
  UI_Icon_Intee_LuminanceStone: 'Adjuvant',
  UI_Icon_Intee_Mechanism: 'Gear',
  UI_Icon_Intee_Miscsmarvs: 'BoxOfMarv',
  UI_Icon_Intee_Music: 'Drumalong',
  UI_Icon_Intee_Nutcracker01: '', // TODO not in wiki
  UI_Icon_Intee_Nutcracker02: '', // TODO not in wiki
  UI_Icon_Intee_Pacman: 'Floral Pursuit',
  UI_Icon_Intee_PenAdvShuffleBoard: '', // TODO not in wiki
  UI_Icon_Intee_PenAdvTargetShooting: '', // TODO not in wiki
  UI_Icon_Intee_PlayerLevel_0: 'AdvGuild',
  UI_Icon_Intee_Questevents: 'Case Record',
  UI_Icon_Intee_Questinference: 'Logic Chain',
  UI_Icon_Intee_Reputation: 'Reputation',
  UI_Icon_Intee_Restaurant: 'Restaurant',
  UI_Icon_Intee_SandwormCannon: 'Fulminating Sandstorm',
  UI_Icon_Intee_Shop: 'Shop',
  UI_Icon_Intee_Souvenir: 'Souvenir',
  UI_Icon_Intee_Speedup: 'Speedup',
  UI_Icon_Intee_TalkSpecial: '!',
  UI_Icon_Intee_TheatreMechanicus: 'Theater',
  UI_Icon_Intee_ToyBattleQTE: '', // TODO not in wiki
  UI_Icon_Intee_TreasureBox: 'Reward',
  UI_Icon_Intee_TreasureGift: '', // TODO not in wiki
  UI_Icon_Intee_TreasureHunt: 'Lost Riches',
  UI_Icon_Intee_Vintage_01: '', // TODO not in wiki
  UI_Icon_Intee_Vintage_02: '', // TODO not in wiki
  UI_Icon_Intee_Vintage_03: '', // TODO not in wiki
  UI_Icon_Quest_Once: 'Quest',
  UI_NPCTopIcon_Activity_BrickBreaker: '',
  UI_NPCTopIcon_Activity_Music: 'Drumalong',
  UI_NPCTopIcon_Activity_ProjectionNPC: 'Wondrous Shadows',
  UI_NPCTopIcon_Activity_RobotGacha: '', // TODO not in wiki
  UI_NPCTopIcon_Blacksmith: 'Forging',
  UI_NPCTopIcon_Combine: 'Alchemy',
  UI_NPCTopIcon_EditTeam: '', // TODO not in wiki
  UI_NPCTopIcon_InspirationSpurt: 'Inspiration Eruption',
  UI_NPCTopIcon_MiscsMarvs: 'BoxOfMarv',
  UI_NPCTopIcon_PitchPot: 'Hundred-Pace Hurling Rites',
  UI_NPCTopIcon_Restaurant: 'Restaurant',
  UI_NPCTopIcon_Souvenir: 'Souvenir',

  UI_NPCTopIcon_QuestEvent: 'Commission-Purple',
  UI_Icon_Intee_Attack: 'Attack',
  UI_Icon_Intee_Defense: '', // TODO not in wiki
  UI_Icon_Intee_NatlanDrill_ADG: 'Bloomflower Trials',
  UI_Icon_Intee_NatlanDrill_DC: 'Saurian Treasure Seeker',
  UI_Icon_Intee_AutoChess_Tutorial: 'Companion Caper Chronicles',
  UI_Icon_Intee_ThemeParkSim_BuffGacha: 'Theme Restaurant',
  UI_NPCTopIcon_NtNpcWorldChallenge: 'Warrior\'s Challenge',
  UI_Icon_Intee_NodKrai_Lighthouse: 'Lightkeepers',
  UI_Icon_Intee_NodKrai_LunarEdictStatuette: 'Frostmoon Scions',
  UI_Icon_Intee_NodKrai_Workshop: 'Clink-Clank Krumkake Workshop',
  UI_Icon_Intee_LanV4PartyLion: 'Wushou Dance',
  UI_Icon_Intee_AlchemySim_Order: 'Alchemy Order',
  UI_Icon_Intee_AlchemySim_TechTree: 'Alchemy Upgrade',
  UI_Icon_Intee_AlchemySim_Exam: 'Alchemy Exam',
  UI_Icon_Intee_FishingJoy: 'Invasive Fish Wrangler',
  UI_Icon_Intee_EffigyChallengeV5: 'Concocted Reaction',
  UI_Icon_Intee_EffigyChallengeV6: 'Specially-Shaped Saurian Search',
  UI_Icon_Intee_HideAndSeekV4: 'Windtrace',
  UI_Icon_Intee_HolidayResort_Shop: 'Asha\'s Treasure Trove',
} as const;

export interface DialogExcelConfigData {
  Id: number,
  NextDialogs: number[],
  TalkShowType?: 'TALK_SHOW_FORCE_SELECT',
  TalkRole: TalkRole,

  TalkContentTextMapHash?: number,
  TalkContentText?: string,
  OptionIcon?: keyof typeof OptionIconMap,

  TalkTitleTextMapHash?: number,
  TalkTitleText?: string,

  TalkRoleNameTextMapHash?: number,
  TalkRoleNameText?: string,

  // Misc:
  TalkAssetPath?: string,
  TalkAssetPathAlter?: string,
  TalkAudioName?: string,
  ActionBefore?: string,
  ActionWhile?: string,
  ActionAfter?: string,
  GroupId?: number,

  // Custom:
  Branches?: DialogExcelConfigData[][],
  Recurse?: boolean,
  TalkId?: number,
  TalkType?: TalkType,
  TalkBinType?: TalkBinType,
  PlayerNonOption?: boolean,

  // Custom Travel Log
  CustomTravelLogMenuText?: string,
  CustomTravelLogMenuTextMapHash?: number,

  // Custom Image:
  CustomImageName?: string,
  CustomImageWikiName?: string,
  CustomSecondImageName?: string,
  CustomSecondImageWikiName?: string,

  // Custom Tx:
  CustomWikiTx?: string,
  CustomWikiTxComment?: string,

  // Custom Readable
  CustomWikiReadable?: Readable

  // NPC First Met
  CustomNpcFirstMet?: string,
}

export interface DialogUnparented {
  MainQuestId: number,
  DialogId: number,
}

export interface ManualTextMapConfigData {
  TextMapId: string,
  TextMapContentText?: string,
  TextMapContentTextMapHash: number,
  ParamTypes: string[],
}

export type TalkExcelBeginCondType =
  'QUEST_COND_ACTIVITY_AKA_FES_REASONING_QUEST_NUM'       |
  'QUEST_COND_ACTIVITY_ALCHEMY_SIM_EXAM_CAN_SUBMIT'       |
  'QUEST_COND_ACTIVITY_ALCHEMY_SIM_STATE'                 |
  'QUEST_COND_ACTIVITY_BLESSING_V2_HAVE_REWARD'           |
  'QUEST_COND_ACTIVITY_CLIENT_COND'                       |
  'QUEST_COND_ACTIVITY_CUSTOM'                            |
  'QUEST_COND_ACTIVITY_GCG_PVE_HARD_REFRESH'              |
  'QUEST_COND_ACTIVITY_GCG_PVE_HARD_REWARD_CAN_TAKE'      |
  'QUEST_COND_ACTIVITY_GCG_PVE_INFINITE_REFRESH'          |
  'QUEST_COND_ACTIVITY_GCG_PVE_INFINITE_REWARD_CAN_TAKE'  |
  'QUEST_COND_ACTIVITY_GCG_PVE_PUZZLE_REFRESH'            |
  'QUEST_COND_ACTIVITY_GCG_PVE_PUZZLE_REWARD_CAN_TAKE'    |
  'QUEST_COND_ACTIVITY_JOURNEY_GCG_PICK_STAGE_STATE_EQ'   |
  'QUEST_COND_ACTIVITY_NEW_FUNGUS_CAPTURE'                |
  'QUEST_COND_ACTIVITY_OPEN'                              |
  'QUEST_COND_ANECDOTE_STATE_EQUALS'                      | // TODO
  'QUEST_COND_AVATAR_CAN_CHANGE_ELEMENT'                  | // TODO
  'QUEST_COND_AVATAR_ELEMENT_EQUAL'                       | // TODO
  'QUEST_COND_AVATAR_ELEMENT_NOT_EQUAL'                   | // TODO
  'QUEST_COND_AVATAR_FETTER_EQ'                           | // TODO
  'QUEST_COND_AVATAR_FETTER_GT'                           | // TODO
  'QUEST_COND_AVATAR_FETTER_LT'                           | // TODO
  'QUEST_COND_CITY_LEVEL_EQUAL_GREATER'                   | // TODO
  'QUEST_COND_CITY_REPUTATION_LEVEL'                      | // TODO
  'QUEST_COND_DAILY_TASK_IN_PROGRESS'                     | // TODO
  'QUEST_COND_DAILY_TASK_OPEN'                            | // TODO
  'QUEST_COND_DAILY_TASK_REWARD_CAN_GET'                  | // TODO
  'QUEST_COND_DAILY_TASK_REWARD_RECEIVED'                 | // TODO
  'QUEST_COND_DAILY_TASK_VAR_EQ'                          | // TODO
  'QUEST_COND_DAILY_TASK_VAR_GT'                          | // TODO
  'QUEST_COND_DAILY_TASK_VAR_LT'                          | // TODO
  'QUEST_COND_EVENT_ITEM_LOCK_STATE_EQUAL'                |
  'QUEST_COND_EVENT_ITEM_SUBMIT_STATE_EQUAL'              |
  'QUEST_COND_EXPLORATION_REWARD_CAN_GET'                 | // TODO
  'QUEST_COND_FORGE_HAVE_FINISH'                          |
  'QUEST_COND_GADGET_TALK_STATE_EQUAL'                    |
  'QUEST_COND_GALLANT_PATH_REWARD_CAN_GET'                |
  'QUEST_COND_GCG_CHALLENGE_NEW_BOSS'                     |
  'QUEST_COND_GCG_INVITE_TYPE'                            |
  'QUEST_COND_GCG_LEVEL_REWARD_CAN_TAKE'                  |
  'QUEST_COND_GCG_LEVEL_UNLOCKED'                         | // TODO
  'QUEST_COND_GCG_NPC_TYPE'                               |
  'QUEST_COND_GCG_SHOP_NEW_GOODS'                         |
  'QUEST_COND_GCG_WORLD_CHALLENGE_RESULT'                 |
  'QUEST_COND_GROUP_GADGET_STATE_EQUALS'                  |
  'QUEST_COND_HIT_KEYWORD_EASTER_EGG'                     |
  'QUEST_COND_HOMEWORLD_COIN_REACH_MAXIMUM'               |
  'QUEST_COND_HOMEWORLD_NPC_EVENT'                        |
  'QUEST_COND_HOMEWORLD_NPC_NEW_TALK'                     |
  'QUEST_COND_INSTRUMENT_TRIAL'                           |
  'QUEST_COND_IN_VEHICLE'                                 | // TODO
  'QUEST_COND_IN_VEHICLE_BY_FEATURETAG'                   |
  'QUEST_COND_IS_DAYTIME'                                 | // TODO
  'QUEST_COND_IS_WORLD_OWNER'                             | // TODO
  'QUEST_COND_ITEM_GIVING_ACTIVED'                        | // TODO
  'QUEST_COND_ITEM_GIVING_FINISHED'                       | // TODO
  'QUEST_COND_ITEM_NUM_EQUAL'                             | // TODO
  'QUEST_COND_ITEM_NUM_GREATER'                           | // TODO
  'QUEST_COND_ITEM_NUM_LESS'                              | // TODO
  'QUEST_COND_ITEM_NUM_LESS_THAN'                         | // TODO
  'QUEST_COND_LUA_NOTIFY'                                 |
  'QUEST_COND_LUNARITE_COLLECT_FINISH'                    |
  'QUEST_COND_LUNARITE_HAS_REGION_HINT_COUNT'             |
  'QUEST_COND_LUNARITE_MARK_ALL_FINISH'                   |
  'QUEST_COND_LUNARITE_REGION_UNLOCKED'                   |
  'QUEST_COND_NEW_HOMEWORLD_LEVEL_REWARD'                 | // TODO
  'QUEST_COND_NEW_HOMEWORLD_MAKE_FINISH'                  |
  'QUEST_COND_NEW_HOMEWORLD_MOUDLE_UNLOCK'                |
  'QUEST_COND_NEW_HOMEWORLD_SHOP_ITEM'                    |
  'QUEST_COND_NEW_HOMEWORLD_WOOD_EXCHANGE_UNLOCK'         |
  'QUEST_COND_OPEN_STATE_EQUAL'                           | // TODO
  'QUEST_COND_PACK_HAVE_ANY_ITEM'                         | // TODO
  'QUEST_COND_PACK_HAVE_ITEM'                             | // TODO
  'QUEST_COND_PACK_HAVE_ITEM_WITH_ID'                     | // TODO
  'QUEST_COND_PLAYER_CHOOSE_MALE'                         | // TODO
  'QUEST_COND_PLAYER_CURRENT_AVATAR'                      | // TODO
  'QUEST_COND_PLAYER_CURRENT_NOT_AVATAR'                  | // TODO
  'QUEST_COND_PLAYER_HAVE_AVATAR'                         | // TODO
  'QUEST_COND_PLAYER_LEVEL_EQUAL_GREATER'                 | // TODO
  'QUEST_COND_PLAYER_LEVEL_REWARD_CAN_GET'                | // TODO
  'QUEST_COND_PLAYER_TEAM_CONTAINS_AVATAR'                | // TODO
  'QUEST_COND_PLAYER_TEAM_NOT_CONTAINS_AVATAR'            | // TODO
  'QUEST_COND_PRESENT_AT_SPECIFIC_SCENE'                  | // TODO
  'QUEST_COND_QUEST_CHECK_NOT_VALUE'                      | // TODO
  'QUEST_COND_QUEST_CHECK_RESULT'                         | // TODO
  'QUEST_COND_QUEST_CHECK_VALUE'                          | // TODO
  'QUEST_COND_QUEST_GLOBAL_VAR_EQUAL'                     | // TODO
  'QUEST_COND_QUEST_GLOBAL_VAR_GREATER'                   | // TODO
  'QUEST_COND_QUEST_GLOBAL_VAR_LESS'                      | // TODO
  'QUEST_COND_QUEST_GLOBAL_VAR_NOT_EQUAL'                 | // TODO
  'QUEST_COND_QUEST_NOT_RECEIVE'                          | // TODO
  'QUEST_COND_QUEST_SERVER_COND_VALID'                    | // TODO
  'QUEST_COND_QUEST_STATE_NOT_EQUAL'                      | // TODO
  'QUEST_COND_QUEST_VAR_EQUAL'                            | // TODO
  'QUEST_COND_QUEST_VAR_GREATER'                          | // TODO
  'QUEST_COND_QUEST_VAR_LESS'                             | // TODO
  'QUEST_COND_QUEST_VAR_NOT_EQUAL'                        | // TODO
  'QUEST_COND_ROLE_COMBAT_NPC_RANDOM_VALUE'               |
  'QUEST_COND_SCENE_AREA_UNLOCKED'                        |
  'QUEST_COND_SCENE_LEVEL_TAG_EQ'                         |
  'QUEST_COND_SCENE_POINT_UNLOCK'                         |
  'QUEST_COND_SHOP_NEW_FORMULA_GOODS'                     |
  'QUEST_COND_SHOP_NEW_GADGET_GOODS'                      |
  'QUEST_COND_STATE_EQUAL'                                | // TODO
  'QUEST_COND_STATE_INTERVAL'                             | // TODO
  'QUEST_COND_STATE_NOT_EQUAL'                            | // TODO
  'QUEST_COND_STORY_GLOBAL_VALUE'                         | // TODO
  'QUEST_COND_TMPVALUE_HIT_NICKNAME'                      |
  'QUEST_COND_WEAPON_IS_ARKHE_OUSIA_OR_PNEUMA'            | // TODO
  'QUEST_COND_WORLD_LEVEL_REACH'                          ; // TODO

export type TalkExcelFinishExecType =
  'TALK_EXEC_CHANGE_WEAPON_MODE'          | // TODO
  'TALK_EXEC_DEC_QUEST_GLOBAL_VAR'        | // TODO
  'TALK_EXEC_DEC_QUEST_VAR'               | // TODO
  'TALK_EXEC_FINISH_ANECDOTE'             | // TODO
  'TALK_EXEC_INC_DAILY_TASK_VAR'          | // TODO
  'TALK_EXEC_INC_QUEST_GLOBAL_VAR'        | // TODO
  'TALK_EXEC_INC_QUEST_VAR'               | // TODO
  'TALK_EXEC_NOTIFY_GROUP_LUA'            |
  'TALK_EXEC_NOTIFY_GROUP_LUA_TALK_FINISH'|
  'TALK_EXEC_SAVE_TALK_ID'                | // TODO
  'TALK_EXEC_SET_DAILY_TASK_VAR'          | // TODO
  'TALK_EXEC_SET_GADGET_STATE'            |
  'TALK_EXEC_SET_GAME_TIME'               | // TODO
  'TALK_EXEC_SET_QUEST_GLOBAL_VAR'        | // TODO
  'TALK_EXEC_SET_QUEST_VAR'               | // TODO
  'TALK_EXEC_TRANS_SCENE_DUMMY_POINT'     |
  'TALK_EXEC_UNLOCK_EVENTS_ITEM'          ; // TODO

export type TalkLoadType =
  'TALK_ACTIVITY'     |
  'TALK_BLOSSOM'      | // For "Is there anything of note nearby?" dialogues for "Magical Crystal Chunk" veins...
  'TALK_GADGET'       |
  'TALK_NORMAL_QUEST' |
  'TALK_STORYBOARD'   |
  'TALK_COOP'         ;

export type TalkExcelBeginCondComb =
  'LOGIC_AND'                 |
  'LOGIC_A_AND_B_AND_ETCOR'   |
  'LOGIC_A_AND_B_OR_ETCAND'   |
  'LOGIC_A_AND_ETCOR'         |
  'LOGIC_A_OR_B_OR_ETCAND'    |
  'LOGIC_A_OR_ETCAND'         |
  'LOGIC_NONE'                |
  'LOGIC_NOT'                 |
  'LOGIC_OR'                  ;

export const TalkExcelBeginCondCombDescMap: Record<TalkExcelBeginCondComb, string> = {
  LOGIC_NONE: 'No logic necessary (zero or one condition)',
  LOGIC_NOT: 'All conditions must not be true (negated)',
  LOGIC_AND: 'All conditions must be true',
  LOGIC_OR: 'Any condition must be true',

  LOGIC_A_AND_B_AND_ETCOR: '(A AND B) AND (C OR D OR ...)',
  LOGIC_A_AND_B_OR_ETCAND: '(A AND B) OR (C AND D AND ...)',
  LOGIC_A_OR_B_OR_ETCAND: '(A OR B) OR (C AND D AND ...)',

  LOGIC_A_AND_ETCOR: 'A AND (B OR C OR ...)',
  LOGIC_A_OR_ETCAND: 'A OR (B AND C AND ..)',
};

export interface TalkExcelConfigData {
  Id: number,
  QuestId: number,
  QuestCondStateEqualFirst: number

  BeginWay: string,
  ActiveMode: string,
  BeginCondComb: TalkExcelBeginCondComb,
  BeginCond: ConfigCondition<TalkExcelBeginCondType>[],
  FinishExec: ConfigCondition<TalkExcelFinishExecType>[]

  NextRandomTalks: number[], // RqTalkExcel only
  NextTalks: number[],
  NextTalksDataList: TalkExcelConfigData[],
  InitDialog: number,
  Dialog?: DialogExcelConfigData[],
  OtherDialog?: DialogExcelConfigData[][],

  NpcId: number[],
  NpcDataList?: NpcExcelConfigData[],
  NpcNameList?: string[],
  ParticipantId: number[],

  Priority: number,
  HeroTalk?: 'TALK_HERO_MAIN',
  LoadType?: TalkLoadType,
  ExtraLoadMarkId: number[],
  PerformCfg: string,
  PrePerformCfg: string,
  InterActionFile?: string,
  InterActionFileFromPerformCfg?: boolean,

  TalkMarkType: 'TALK_MARK_COMMON' | 'TALK_MARK_HIDE',
  TalkMarkHideList: number[],
  CrowdLOD0List: number[],
  ShowRandomTalkCount: number,
  DecoratorId: number,

  QuestIdleTalk: boolean,
  DontBlockDaily: boolean,
  LowPriority: boolean,
  LockGameTime: boolean,
  StayFreeStyle: boolean,
  CheckActionAfter: boolean,
  EnableCameraDisplacement: boolean,
  ForceNpcNotDestroy: boolean,
}

export type ReminderStyle =
  'AbyssWarReminder'          |
  'Banner'                    |
  'CombatChat'                |
  'DialogueWithPortrait'      |
  'DrillBattleReminder'       |
  'EscoffierCookingChat'      |
  'EventPromptDown'           |
  'HerculesBattle'            |
  'InfoTextDialog'            |
  'InteractionPromptUI'       |
  'NoText'                    |
  'Normal'                    |
  'PenumbraInfo'              |
  'PenumbraMiniStory'         |
  'PenumbraStory'             |
  'PenumbraTarget'            |
  'RoleCombatBanner'          |
  'SpecialFocusAttackReminder'|
  'SpecialReminderOnBottom'   |
  'SpecialReminderOnTop'      |
  'SpecialReminderV2OnBottom' |
  'WhiteMessage'              ;

export interface ReminderExcelConfigData {
  Id: number,
  SpeakerText: string,
  SpeakerTextMapHash: number,
  ContentText: string,
  ContentTextMapHash: number,
  Delay: number,
  ShowTime: number,
  NextReminderId: number,
  SoundEffect: string,
  HasAudio: boolean,
  Style?: ReminderStyle,
}

export type CodexQuestSpeakerTextType = 'Aside' | 'IPCustomizedWhole' | 'Narratage' | 'SpeakerKnown' | 'SpeakerPlayer';
export type CodexQuestContentTextType = 'Aside' | 'DialogNormal' | 'IPCustomizedWhole' | 'Narratage';

export const CodexQuestNarratageTypes: Set<CodexQuestContentTextType> = new Set(['Narratage', 'IPCustomizedWhole']);

export interface CodexQuestExcelConfigData {
  Id: string,
  MainQuestId: number,

  ItemType: string,
  ItemId: number,
  NextItemId: number,
  SoundId?: number,

  SpeakerText: string,
  SpeakerTextMapHash: number,
  SpeakerTextType?: CodexQuestSpeakerTextType,

  ContentText: string,
  ContentTextMapHash: number,
  ContentTextType: CodexQuestContentTextType,

  AssociatedDialogId?: number, // Custom property
}

export interface CodexQuestGroup {
  Items: CodexQuestExcelConfigData[],
  ByContentTextMapHash: {[hash: string]: CodexQuestExcelConfigData},
  ByItemId: {[itemId: number]: CodexQuestExcelConfigData},
}
