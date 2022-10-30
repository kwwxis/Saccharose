
export interface ConfigCondition {
  Type?: string,
  Param?: (string|number)[]
  Count?: string,
  ParamStr?: string,
}

export type LangCode = 'CHS' | 'CHT' | 'DE' | 'EN' | 'ES' | 'FR' | 'ID' | 'JP' | 'KR' | 'PT' | 'RU' | 'TH' | 'VI';
export const LANG_CODES: LangCode[] = ['CHS', 'CHT', 'DE', 'EN', 'ES', 'FR', 'ID', 'JP', 'KR', 'PT', 'RU', 'TH', 'VI'];
export const LANG_CODES_TO_NAME = {
  CHS: 'Chinese (Simplified)',
  CHT: 'Chinese (Traditional)',
  DE: 'German',
  EN: 'English',
  ES: 'Spanish',
  FR: 'French',
  ID: 'Indonesian',
  JP: 'Japanese',
  KR: 'Korean',
  PT: 'Portuguese',
  RU: 'Russian',
  TH: 'Thai',
  VI: 'Vietnamese'
}

// DIALOG CONFIG
// ~~~~~~~~~~~~~

export interface TalkRole {
  Type: 'TALK_ROLE_NPC' | 'TALK_ROLE_PLAYER' | 'TALK_ROLE_BLACK_SCREEN' | 'TALK_ROLE_MATE_AVATAR' | 'TALK_ROLE_GADGET',
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

export interface MainQuestExcelConfigData {
  Id: number,
  Series: number,
  ChapterId?: number,
  Type?: string,
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
}

export interface RewardExcelConfigData {
  RewardId: number,
  RewardItemList: {ItemId?: number, ItemCount?: number}[]
}

export interface MaterialExcelConfigData {
  Id: number,
  NameText: string,
  NameTextMapHash: number
  DescText?: string,
  DescTextMapHash?: number,
  Icon?: string,
  ItemType?: string,
  StackLimit?: number,
  MaxUseCount?: number,
  UseTarget?: string, // ITEM_USE_TARGET_CUR_TEAM
  MaterialType?: string, // MATERIAL_FURNITURE_FORMULA
  Rank?: number,
  GlobalItemLimit?: number,
  EffectDesc?: string,
  EffectDescTextMapHash?: number,
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
    UseOp: string,
    UseParam: string[],
    // ITEM_USE_UNLOCK_FURNITURE_FORMULA => ["371119"]]
    // ITEM_USE_ADD_SERVER_BUFF => ["500202", "900"]
  }[],
  InteractionTitleText?: string,
  InteractionTitleTextMapHash?: number,
  FoodQuality?: string, // FOOD_QUALITY_STRANGE,FOOD_QUALITY_ORDINARY,FOOD_QUALITY_DELICIOUS
}

export interface MaterialSourceDataExcelConfigData {
  Id: number,
  DungeonList: number[],
  JumpList: number[],
  TextList: number[],
}