
export interface ConfigCondition {
  Type?: string,
  Param?: (string|number)[]
  Count?: string,
  ParamStr?: string,
}

export type LangCode = 'CHS' | 'CHT' | 'DE' | 'EN' | 'ES' | 'FR' | 'ID' | /*'IT' |*/ 'JP' | 'KR' | 'PT' | 'RU' | 'TH' | /*'TR' |*/ 'VI';
export const LANG_CODES: LangCode[] = ['CHS', 'CHT', 'DE', 'EN', 'ES', 'FR', 'ID', /*'IT',*/ 'JP', 'KR', 'PT', 'RU', 'TH', /*'TR',*/ 'VI'];
export const LANG_CODES_TO_NAME = {
  CHS: 'Chinese (Simplified)',
  CHT: 'Chinese (Traditional)',
  DE: 'German',
  EN: 'English',
  ES: 'Spanish',
  FR: 'French',
  ID: 'Indonesian',
  //IT: 'Italian',
  JP: 'Japanese',
  KR: 'Korean',
  PT: 'Portuguese',
  RU: 'Russian',
  TH: 'Thai',
  //TR: 'Turkish',
  VI: 'Vietnamese',
}

// DIALOG CONFIG
// ~~~~~~~~~~~~~

export type TalkRoleType = 'TALK_ROLE_NPC' | 'TALK_ROLE_PLAYER' | 'TALK_ROLE_BLACK_SCREEN' | 'TALK_ROLE_MATE_AVATAR' | 'TALK_ROLE_GADGET'
  | 'TALK_ROLE_CONSEQUENT_BLACK_SCREEN' | 'TALK_ROLE_NEED_CLICK_BLACK_SCREEN' | 'TALK_ROLE_CONSEQUENT_NEED_CLICK_BLACK_SCREEN';
export interface TalkRole {
  Type: TalkRoleType,
  Id: number|string,
  NameTextMapHash?: number,
  NameText?: string,
}

export interface DialogExcelConfigData {
  Id: number,
  NextDialogs: number[],
  TalkShowType?: 'TALK_SHOW_FORCE_SELECT',
  TalkRole: TalkRole,
  TalkContentTextMapHash: number,
  TalkContentText?: string,
  TalkTitleTextMapHash: number,
  TalkTitleTextMap?: string,
  TalkRoleNameTextMapHash: number,
  TalkRoleNameText?: string,
  TalkAssetPath: string,
  TalkAssetPathAlter: string,
  TalkAudioName: string,
  ActionBefore: string,
  ActionWhile: string,
  ActionAfter: string,
  OptionIcon: string,
  Branches?: DialogExcelConfigData[][],
  recurse?: boolean
}

export interface TalkExcelConfigData {
  Id: number,
  QuestId: number,
  QuestCondStateEqualFirst: number,
  BeginWay: string,
  ActiveMode: string,
  BeginCondComb: string,
  BeginCond: ConfigCondition[],
  Priority: number,
  NextTalks: number[],
  NextTalksDataList: TalkExcelConfigData[],
  InitDialog: number,
  NpcId: number[],
  NpcDataList?: NpcExcelConfigData[],
  NpcNameList?: string[],
  ParticipantId: number[],
  PerformCfg: string,
  QuestIdleTalk: boolean,
  HeroTalk: string,
  ExtraLoadMarkId: number[],
  PrePerformCfg: string,
  FinishExec: ConfigCondition[]
  Dialog?: DialogExcelConfigData[],
}

// NPC CONFIG
// ~~~~~~~~~~

export interface NpcExcelConfigData {
  JsonName: string,
  Alias: string,
  ScriptDataPath: string,
  LuaDataPath: string,
  DyePart: string,
  BillboardIcon: string,
  TemplateEmotionPath: string,
  Id: number,
  NameText?: string,
  NameTextMapHash: number,
  PrefabPathHashSuffix: number,
  PrefabPathHashPre: number,
  CampID: number,
  LODPatternName: string,
  BodyType?: string,
}

// QUEST CONFIG
// ~~~~~~~~~~~~

export type QuestType = 'AQ' | 'SQ' | 'EQ' | 'WQ';
export type MapByQuestType<T> = {
  AQ: T,
  SQ: T,
  EQ: T,
  WQ: T
};

export interface MainQuestExcelConfigData {
  Id: number,
  Series: number,
  ChapterId?: number,
  Type?: QuestType,
  ActiveMode: string,
  TitleText?: string,
  TitleTextEN?: string,
  TitleTextMapHash: number,
  DescText?: string,
  DescTextMapHash: number,
  LuaPath: string,
  SuggestTrackOutOfOrder?: boolean,
  SuggestTrackMainQuestList?: any[],
  RewardIdList: any[],
  ShowType: string,
  QuestExcelConfigDataList?: QuestExcelConfigData[],
  OrphanedTalkExcelConfigDataList?: TalkExcelConfigData[],
  OrphanedDialog?: DialogExcelConfigData[][],
  QuestMessages?: ManualTextMapConfigData[],
}

export interface QuestExcelConfigData {
  SubId: number,
  MainId: number,
  Order: number,
  DescText?: string,
  DescTextMapHash: number,
  StepDescText?: string,
  StepDescTextMapHash: number,
  GuideTipsText?: string,
  GuideTipsTextMapHash: number,
  ShowType: string,
  AcceptCond: ConfigCondition[],
  AcceptCondComb: string,
  FinishCond: ConfigCondition[],
  FinishCondComb: string,
  FailCond: ConfigCondition[],
  FailCondComb: string,
  Guide: ConfigCondition,
  FinishExec: ConfigCondition[],
  FailExec: ConfigCondition[],
  BeginExec: ConfigCondition[],
  ExclusiveNpcList: number[],
  ExclusiveNpcNameList: string[],
  ExclusiveNpcDataList: NpcExcelConfigData[],
  SharedNpcList: number[],
  SharedNpcNames: string[],
  SharedNpcDataList: NpcExcelConfigData[],
  TrialAvatarList: any[],
  ExclusivePlaceList: any[],
  TalkExcelConfigDataList?: TalkExcelConfigData[],
  QuestMessages?: ManualTextMapConfigData[],
  OrphanedDialog?: DialogExcelConfigData[][],
}

// RANDOM STUFF
// ~~~~~~~~~~~~

export interface TextMapItem {
  Id: number,
  Text: string,
}

export interface LoadingTipsExcelConfigData {
  Id: number,
  TipsTitleText?: string,
  TipsTitleTextMapHash: number,
  TipsDescText?: string,
  TipsDescTextMapHash: number,
  StageID: string,
  StartTime: string,
  EndTime: string,
  LimitOpenState: string,
  PreMainQuestIds: string,
  Weight: number
}

export interface ManualTextMapConfigData {
  TextMapId: string,
  TextMapContentText?: string,
  TextMapContentTextMapHash: number,
  ParamTypes: string[],
}

export interface AvatarExcelConfigData {
  Id: number
  NameText: string,
  NameTextMapHash: number,
  DescText: string,
  DescTextMapHash: number,
  WeaponType: string,
  BodyType: string,
  IconName: string,
  SideIconName: string,
}

export interface FetterStoryExcelConfigData {
  fetterId: number,
  avatarId: number,
  storyTitleTextMapHash: number,
  storyContextTextMapHash: number,
  storyTitle2TextMapHash: number,
  storyContext2TextMapHash: number,
  storyTitleLockedTextMapHash: number,
  storyTitleText: string,
  storyContextText: string,
  storyTitle2Text: string,
  storyContext2Text: string,
  storyTitleLockedText: string,
  tips: number[],
  friendship: number,
  storyContextHtml: string,
  openConds: {condType: string, paramList: number[]}[],
}

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
}

export interface RewardExcelConfigData {
  RewardId: number,
  RewardItemList: {ItemId?: number, ItemCount?: number}[]
}

export type MaterialType =
  'MATERIAL_ACTIVITY_GEAR' |
  'MATERIAL_ACTIVITY_JIGSAW' |
  'MATERIAL_ACTIVITY_ROBOT' |
  'MATERIAL_ADSORBATE' |
  'MATERIAL_ARANARA' |
  'MATERIAL_AVATAR' |
  'MATERIAL_AVATAR_MATERIAL' |
  'MATERIAL_BGM' |
  'MATERIAL_CHANNELLER_SLAB_BUFF' |
  'MATERIAL_CHEST' |
  'MATERIAL_CHEST_BATCH_USE' |
  'MATERIAL_CONSUME' |
  'MATERIAL_CONSUME_BATCH_USE' |
  'MATERIAL_COSTUME' |
  'MATERIAL_CRICKET' |
  'MATERIAL_DESHRET_MANUAL' |
  'MATERIAL_ELEM_CRYSTAL' |
  'MATERIAL_EXCHANGE' |
  'MATERIAL_EXP_FRUIT' |
  'MATERIAL_FAKE_ABSORBATE' |
  'MATERIAL_FIREWORKS' |
  'MATERIAL_FISH_BAIT' |
  'MATERIAL_FISH_ROD' |
  'MATERIAL_FLYCLOAK' |
  'MATERIAL_FOOD' |
  'MATERIAL_FURNITURE_FORMULA' |
  'MATERIAL_FURNITURE_SUITE_FORMULA' |
  'MATERIAL_HOME_SEED' |
  'MATERIAL_NAMECARD' |
  'MATERIAL_NOTICE_ADD_HP' |
  'MATERIAL_QUEST' |
  'MATERIAL_RELIQUARY_MATERIAL' |
  'MATERIAL_SEA_LAMP' |
  'MATERIAL_SELECTABLE_CHEST' |
  'MATERIAL_SPICE_FOOD' |
  'MATERIAL_TALENT' |
  'MATERIAL_WEAPON_EXP_STONE' |
  'MATERIAL_WIDGET' |
  'MATERIAL_WOOD';

export type MaterialUseTarget =
  'ITEM_USE_TARGET_CUR_TEAM' |
  'ITEM_USE_TARGET_SPECIFY_ALIVE_AVATAR' |
  'ITEM_USE_TARGET_PLAYER_AVATAR' |
  'ITEM_USE_TARGET_SPECIFY_AVATAR' |
  'ITEM_USE_TARGET_SPECIFY_DEAD_AVATAR';

export type MaterialItemUseOp =
  'ITEM_USE_ACCEPT_QUEST' |
  'ITEM_USE_ADD_ALL_ENERGY' |
  'ITEM_USE_ADD_AVATAR_EXTRA_PROPERTY' |
  'ITEM_USE_ADD_CHANNELLER_SLAB_BUFF' |
  'ITEM_USE_ADD_CUR_HP' |
  'ITEM_USE_ADD_CUR_STAMINA' |
  'ITEM_USE_ADD_DUNGEON_COND_TIME' |
  'ITEM_USE_ADD_ELEM_ENERGY' |
  'ITEM_USE_ADD_EXP' |
  'ITEM_USE_ADD_ITEM' |
  'ITEM_USE_ADD_PERSIST_STAMINA' |
  'ITEM_USE_ADD_REGIONAL_PLAY_VAR' |
  'ITEM_USE_ADD_RELIQUARY_EXP' |
  'ITEM_USE_ADD_SELECT_ITEM' |
  'ITEM_USE_ADD_SERVER_BUFF' |
  'ITEM_USE_ADD_TEMPORARY_STAMINA' |
  'ITEM_USE_ADD_WEAPON_EXP' |
  'ITEM_USE_CHEST_SELECT_ITEM' |
  'ITEM_USE_COMBINE_ITEM' |
  'ITEM_USE_GAIN_AVATAR' |
  'ITEM_USE_GAIN_CARD_PRODUCT' |
  'ITEM_USE_GAIN_COSTUME' |
  'ITEM_USE_GAIN_FLYCLOAK' |
  'ITEM_USE_GAIN_NAME_CARD' |
  'ITEM_USE_GRANT_SELECT_REWARD' |
  'ITEM_USE_MAKE_GADGET' |
  'ITEM_USE_OPEN_RANDOM_CHEST' |
  'ITEM_USE_RELIVE_AVATAR' |
  'ITEM_USE_UNLOCK_CODEX' |
  'ITEM_USE_UNLOCK_COMBINE' |
  'ITEM_USE_UNLOCK_COOK_RECIPE' |
  'ITEM_USE_UNLOCK_FORGE' |
  'ITEM_USE_UNLOCK_FURNITURE_FORMULA' |
  'ITEM_USE_UNLOCK_FURNITURE_SUITE' |
  'ITEM_USE_UNLOCK_HOME_BGM' |
  'ITEM_USE_UNLOCK_HOME_MODULE' |
  'ITEM_USE_UNLOCK_PAID_BATTLE_PASS_NORMAL';

export interface MaterialExcelConfigData {
  Id: number,
  NameText: string,
  NameTextMapHash: number
  DescText?: string,
  DescTextMapHash?: number,
  Icon?: string,
  ItemType?: 'ITEM_VIRTUAL' | 'ITEM_MATERIAL',
  StackLimit?: number,
  MaxUseCount?: number,
  UseTarget?: MaterialUseTarget,
  UseOnGain?: boolean,
  UseLevel?: number,
  Weight?: number,
  SetID?: number,
  CloseBagAfterUsed?: boolean,
  PlayGainEffect?: number,
  MaterialType?: MaterialType,
  Rank?: number,
  GlobalItemLimit?: number,
  EffectDesc?: string,
  EffectDescTextMapHash?: number,
  EffectGadgetID?: number,
  GadgetId?: number,
  SpecialDesc?: string,
  SpecialDescTextMapHash?: number,
  TypeDesc?: string,
  TypeDescTextMapHash?: number,
  EffectIcon?: string,
  EffectName?: string,
  SatiationParams?: any[],
  DestroyRule?: string, // DESTROY_RETURN_MATERIAL
  DestroyReturnMaterial?: any[],
  DestroyReturnMaterialCount?: any[],
  ItemUse?: {
    UseOp: MaterialItemUseOp,
    UseParam: string[],
    // ITEM_USE_UNLOCK_FURNITURE_FORMULA => ["371119"]]
    // ITEM_USE_ADD_SERVER_BUFF => ["500202", "900"]
  }[],
  InteractionTitleText?: string,
  InteractionTitleTextMapHash?: number,
  FoodQuality?: 'FOOD_QUALITY_STRANGE' | 'FOOD_QUALITY_ORDINARY' | 'FOOD_QUALITY_DELICIOUS',
  IsHidden?: boolean,
  CdTime?: number,
  CdGroup?: number,
}

export interface MaterialSourceDataExcelConfigData {
  Id: number,
  DungeonList: number[],
  JumpList: number[],
  TextList: number[],
}