import { AvatarExcelConfigData } from './avatar-types';
import { NpcExcelConfigData } from './general-types';
import { MonsterExcelConfigData } from './monster-types';
import { TalkExcelConfigData } from './dialogue-types';
import { MainQuestExcelConfigData, QuestExcelConfigData } from './quest-types';
import { MaterialExcelConfigData, RewardExcelConfigData } from './material-types';
import { Subset } from '../utility-types';

// GCG TALK
// --------------------------------------------------------------------------------------------------------------

export interface GCGTalkDetailExcelConfigData {
  TalkDetailId: number,
  TalkDetailIconId: number,
  TalkDetailIcon?: GCGTalkDetailIconExcelConfigData,
  Avatar?: AvatarExcelConfigData,
  TalkContentText: string[]
  TalkContentTextMapHash: number[],
  TalkEmoji: string[],
  VoPrefix?: string,
}

export interface GCGTalkDetailIconExcelConfigData {
  Id: number, // -> GCGTalkDetailExcelConfigData.TalkDetailIconId
  IconName: string,
  Type?: 'NPC',
}

export interface GCGTalkExcelConfigData {
  GameId: number, // -> GCGGameExcelConfigData.Id

  // TalkId -> GCGTalkDetailExcelConfigData.TalkDetailId
  HappyTalkId: number,
  SadTalkId: number,
  ToughTalkId: number,
  ElementBurstTalkId: number,
  HighHealthTalkId: number,
  LowHealthTalkId: number,

  HappyTalk: GCGTalkDetailExcelConfigData,
  SadTalk: GCGTalkDetailExcelConfigData,
  ToughTalk: GCGTalkDetailExcelConfigData,
  ElementBurstTalk: GCGTalkDetailExcelConfigData,
  HighHealthTalk: GCGTalkDetailExcelConfigData,
  LowHealthTalk: GCGTalkDetailExcelConfigData,

  HighHealthValue: number,
  HighHealthConfigId: number,

  LowHealthValue: number,
  LowHealthConfigId: number,
}

export interface GCGTutorialTextExcelConfigData {
  TutorialTextId: number,
  TutorialTextMapHash: number,
  TutorialText: string,
}

// GCG RULE
// --------------------------------------------------------------------------------------------------------------

export interface GCGRuleExcelConfigData {
  Id: number,
  FirstDrawNum: number,
  SecondDrawNum: number,
  DrawCardNum: number,
  ElementReactionList: number[],
  MappedElementReactionList: GCGElementReactionExcelConfigData[],
  HandCardLimit: number,
}

export interface GCGRuleTextExcelConfigData {
  Id: number,
  TitleText: string,
  TitleTextMapHash: number,
  DetailIdList: number[]
  DetailList: GCGRuleTextDetailExcelConfigData[],
}

export interface GCGRuleTextDetailExcelConfigData {
  Id: number,
  Icon: string,
  TitleText: string,
  TitleTextMapHash: number,
  ContentText: string,
  ContentTextMapHash: number
}

export interface GCGElementReactionExcelConfigData {
  Id: number,
  ElementType1: 'GCG_ELEMENT_CRYO' | 'GCG_ELEMENT_ELECTRO' | 'GCG_ELEMENT_HYDRO' | 'GCG_ELEMENT_PYRO',
  ElementType2:
    'GCG_ELEMENT_ANEMO' |
    'GCG_ELEMENT_CRYO'  |
    'GCG_ELEMENT_DENDRO'|
    'GCG_ELEMENT_GEO'   |
    'GCG_ELEMENT_HYDRO' |
    'GCG_ELEMENT_PYRO'  ,
  SkillId: number,
  MappedSkill: GCGSkillExcelConfigData,
}

// GCG SKILLS, TAGS, & SKILL TAGS
// --------------------------------------------------------------------------------------------------------------
export type SkillTagType =
  'GCG_SKILL_TAG_A' | // Normal Attack
  'GCG_SKILL_TAG_E' | // Elemental Skill
  'GCG_SKILL_TAG_NONE' |
  'GCG_SKILL_TAG_PASSIVE' |
  'GCG_SKILL_TAG_Q'; // Elemental Brust

export interface GCGSkillExcelConfigData {
  Id: number,

  NameTextMapHash: number,
  DescTextMapHash: number,
  CostList: { CostType: GCGCostType, CostData?: GCGCostExcelConfigData, Count: number }[],
  SkillTagList: SkillTagType[],
  MappedSkillTagList?: GCGSkillTagExcelConfigData[],
  DescText: string,
  NameText: string,
  EnergyRecharge: number,
  BlockAiCardId: number,
  IsHidden: boolean,

  InternalName: string, // skill internal id
  GOOGPDHGMGN: string, // JsonPathHash
  PHNMFFMECLK: 0 | 0.4 | 0.8,

  LHEEECLKKMJ: boolean,
  LOLPGKPEMKI: boolean,
  FOHLOAAPBEJ: boolean,

  KPPDPJPILLC?: 'OnBannerShow' | 'OnBehaviorStart' | 'OnHitLanded',
  OHGMCNABLOD?: string,
  NGLIJEOOBBB?: string,

  WikiType?: string,
  WikiDesc?: string,
  SkillDamage?: GCGCharSkillDamage;
}

export interface GCGSkillTagExcelConfigData {
  Type: SkillTagType,
  NameText: string,
  NameTextMapHash: number,
  KeywordId: number,
  Keyword?: GCGKeywordExcelConfigData,
}

export interface GCGCharSkillDamage {
  Name: string,
  Damage?: number,
  IndirectDamage?: number,
  ElementTag?: string,
  Element?: string
  ElementKeywordId?: number,
  ElementKeyword?: GCGKeywordExcelConfigData,
}

export type GCGTagType =
  // General Tags
  'GCG_TAG_ALLY'              |
  'GCG_TAG_ARTIFACT'          |
  'GCG_TAG_DENDRO_PRODUCE'    |
  'GCG_TAG_FOOD'              |
  'GCG_TAG_FORBIDDEN_ATTACK'  |
  'GCG_TAG_IMMUNE_CONTROL'    |
  'GCG_TAG_IMMUNE_FREEZING'   |
  'GCG_TAG_ITEM'              |
  'GCG_TAG_PLACE'             |
  'GCG_TAG_RESONANCE'         |
  'GCG_TAG_SHEILD'            |
  'GCG_TAG_SLOWLY'            |
  'GCG_TAG_TALENT'            |
  'GCG_TAG_UNIQUE'            |

  // Elements
  'GCG_TAG_ELEMENT_ANEMO'     |
  'GCG_TAG_ELEMENT_CRYO'      |
  'GCG_TAG_ELEMENT_DENDRO'    |
  'GCG_TAG_ELEMENT_ELECTRO'   |
  'GCG_TAG_ELEMENT_GEO'       |
  'GCG_TAG_ELEMENT_HYDRO'     |
  'GCG_TAG_ELEMENT_NONE'      |
  'GCG_TAG_ELEMENT_PYRO'      |

  // Nations/Camps
  'GCG_TAG_NATION_FONTAINE'   |
  'GCG_TAG_NATION_INAZUMA'    |
  'GCG_TAG_NATION_KHAENRIAH'  |
  'GCG_TAG_NATION_LIYUE'      |
  'GCG_TAG_NATION_MONDSTADT'  |
  'GCG_TAG_NATION_NATLAN'     |
  'GCG_TAG_NATION_SNEZHNAYA'  |
  'GCG_TAG_NATION_SUMERU'     |
  'GCG_TAG_CAMP_FATUI'        |
  'GCG_TAG_CAMP_HILICHURL'    |
  'GCG_TAG_CAMP_KAIRAGI'      |
  'GCG_TAG_CAMP_MONSTER'      |

  // Weapons
  'GCG_TAG_WEAPON'            |
  'GCG_TAG_WEAPON_BOW'        |
  'GCG_TAG_WEAPON_CATALYST'   |
  'GCG_TAG_WEAPON_CLAYMORE'   |
  'GCG_TAG_WEAPON_NONE'       |
  'GCG_TAG_WEAPON_POLE'       |
  'GCG_TAG_WEAPON_SWORD'      ;

export type GCGTagCategoryType =
  'GCG_TAG_IDENTIFIER_ASSIST' | // support cards
  'GCG_TAG_IDENTIFIER_CHAR'   | // char camp
  'GCG_TAG_IDENTIFIER_ELEMENT'| // char element
  'GCG_TAG_IDENTIFIER_EVENT'  | // event cards
  'GCG_TAG_IDENTIFIER_MODIFY' | // equipment cards
  'GCG_TAG_IDENTIFIER_NONE'   |
  'GCG_TAG_IDENTIFIER_WEAPON' ; // char weapon

export interface GCGTagExcelConfigData {
  Type: GCGTagType,
  CategoryType: GCGTagCategoryType,
  NameText: string,
  NameTextMapHash: number,
}

export const GCG_TAGS_WITHOUT_ICONS: Set<GCGTagType> = new Set<GCGTagType>([

  // GCG_TAG_IDENTIFIER_NONE:
  'GCG_TAG_UNIQUE',
  'GCG_TAG_FORBIDDEN_ATTACK',
  'GCG_TAG_IMMUNE_FREEZING',
  'GCG_TAG_IMMUNE_CONTROL',

  // GCG_TAG_IDENTIFIER_CHAR:
  'GCG_TAG_NATION_FONTAINE',
  'GCG_TAG_NATION_NATLAN',
  'GCG_TAG_NATION_SNEZHNAYA',
  'GCG_TAG_NATION_KHAENRIAH',

  // GCG_TAG_IDENTIFIER_NONE:
  'GCG_TAG_DENDRO_PRODUCE',
]);

export interface GCGKeywordExcelConfigData {
  Id: number,
  TitleTextMapHash: number,
  DescTextMapHash: number,
  TitleText: string,
  DescText: string,
}

export type GCGTagWeaponType = Subset<GCGTagType,
  'GCG_TAG_WEAPON_NONE' |
  'GCG_TAG_WEAPON_CATALYST' |
  'GCG_TAG_WEAPON_BOW' |
  'GCG_TAG_WEAPON_CLAYMORE' |
  'GCG_TAG_WEAPON_POLE' |
  'GCG_TAG_WEAPON_SWORD'>;

export type GCGTagElementType = Subset<GCGTagType,
  'GCG_TAG_ELEMENT_NONE' |
  'GCG_TAG_ELEMENT_CRYO' |
  'GCG_TAG_ELEMENT_HYDRO' |
  'GCG_TAG_ELEMENT_PYRO' |
  'GCG_TAG_ELEMENT_ELECTRO' |
  'GCG_TAG_ELEMENT_ANEMO' |
  'GCG_TAG_ELEMENT_GEO' |
  'GCG_TAG_ELEMENT_DENDRO'>;

export type GCGTagNationType = Subset<GCGTagType,
  'GCG_TAG_NATION_MONDSTADT' |
  'GCG_TAG_NATION_LIYUE' |
  'GCG_TAG_NATION_INAZUMA' |
  'GCG_TAG_NATION_SUMERU' |
  'GCG_TAG_NATION_FONTAINE' |
  'GCG_TAG_NATION_NATLAN' |
  'GCG_TAG_NATION_SNEZHNAYA' |
  'GCG_TAG_NATION_KHAENRIAH'>;

export type GCGTagCampType = Subset<GCGTagType,
  'GCG_TAG_CAMP_FATUI' |
  'GCG_TAG_CAMP_HILICHURL' |
  'GCG_TAG_CAMP_MONSTER' |
  'GCG_TAG_CAMP_KAIRAGI'>;

// GCG GAME / LEVEL
// --------------------------------------------------------------------------------------------------------------

export type GCGGameWikiType = 'No Type' | 'Adventure Challenge' | 'Duel' | 'Friendly Fracas' | 'Serious Showdown' | 'Weekly Guest Challenge' | 'Ascension Challenge';
export type GCGGameWikiGroup = 'No Group' | 'Open World Match' | 'Tavern Challenge' | 'Invitation Board' | 'Quest' | 'Event' | 'Special';

export interface GCGGameExcelConfigData {
  Id: number,
  EnemyNameText: string,
  EnemyNameTextMapHash: number,
  RuleId: number,
  Rule?: GCGRuleExcelConfigData,

  // Game Cards:
  CardGroupId: number,
  EnemyCardGroupId: number,
  CardGroup: GCGDeckExcelConfigData,
  EnemyCardGroup: GCGDeckExcelConfigData,

  // IDK what these are:
  GameType: 'AI' | 'PVE',
  InitHand: 'SELF',
  GuideName: 'Tutorial_1_1' | 'Tutorial_1_2' | 'Tutorial_1_4' | 'Tutorial_1_5' | 'Tutorial_2_1' | 'Tutorial_2_2',
  AFDLJEHJMBM: boolean,
  EOKDDNCPBJF?: 'GCG_FESTIVAL_MODE_TYPE_PAIMON',
  DOIPEHEKFHD?: number, // no idea what this is -- only one record has this field and its value is 44

  // Custom properties, set based on data in sub-objects.
  LevelType: 'BOSS' | 'QUEST' | 'WORLD' | 'WEEK' | 'CHARACTER' | 'OTHER',
  LevelDifficulty?: 'NORMAL' | 'HARD',
  MinPlayerLevel: number,

  // Custom Wiki Properties:
  WikiCombinedTitle: string,
  WikiCharacter: string,
  WikiLevelName: string,
  WikiType: GCGGameWikiType,
  WikiGroup: GCGGameWikiGroup,

  // Resolved level types:
  BossLevel?: GCGBossLevelExcelConfigData,
  QuestLevel: GCGQuestLevelExcelConfigData,
  WorldLevel: GCGWorldLevelExcelConfigData,
  WeekLevel: GCGWeekLevelExcelConfigData,
  CharacterLevel: GCGCharacterLevelExcelConfigData,
  OtherLevel: GcgOtherLevelExcelConfigData,

  // Quest condition:
  LevelLock?: GCGLevelLockExcelConfigData,

  // Dialogue:
  LevelTalk?: GCGTalkExcelConfigData,

  // Reward object:
  Reward: GCGGameRewardExcelConfigData,
}

export interface GCGBossLevelExcelConfigData {
  Id: number,
  NormalLevelId: number, // -> GCGGameExcelConfigData.Id
  HardLevelId: number, // -> GCGGameExcelConfigData.Id
  UnlockCond: string,
  UnlockGcgLevel: number,
  NpcId: number, // -> NpcExcelConfigData.Id
  Npc: NpcExcelConfigData,
  MonsterId: number, // -> MonsterExcelConfigData.Id
  Monster: MonsterExcelConfigData,
  MonsterTitleTextMapHash: number,
  MonsterTitleText: string,
  UnlockTipTextMapHash: number,
  UnlockTipText: string,
}

export interface GCGQuestLevelExcelConfigData {
  LevelId: number,
  QuestId: number,
  Quest?: QuestExcelConfigData,
  MainQuest?: MainQuestExcelConfigData,
}

export interface GCGWorldLevelExcelConfigData {
  Id: number,
  NpcId: number,
  Npc: NpcExcelConfigData,
  LevelId: number,
  LevelTitleTextMapHash: number,
  MapDescTextMapHash: number,
  TalkId: number,
  Talk?: TalkExcelConfigData,
  LevelTitleText: string,
  MapDescText: string,
  UnlockCond?: 'GCG_LEVEL_UNLOCK_QUEST',
  UnlockParam: number,
  UnlockMainQuest: MainQuestExcelConfigData,
  WorldWorkTime?: GcgWorldWorkTimeExcelConfigData,
}

export interface GcgWorldWorkTimeExcelConfigData {
  Id: number, // npc id
  StartTime: number,
  EndTime: number,
}

export interface GCGWeekLevelExcelConfigData {
  Id: number,
  NpcType: string,
  OpenQuestId?: number,
  OpenQuest?: QuestExcelConfigData,
  OpenMainQuest?: MainQuestExcelConfigData,
  Npc: NpcExcelConfigData,
  NpcId: number,
  LevelCondList: { LevelId: number, GcgLevel: number }[],
  CondQuestList: never[],
  IconName: string,
  IsUseStandScenePoint: boolean,
  OpenGcgLevel: number,
}

export interface GCGCharacterLevelExcelConfigData {
  Id: number,
  NormalLevelList: { LevelId: number, GcgLevel: number }[],
  NormalLevelId: number,

  NpcId: number,
  Npc?: NpcExcelConfigData,
  AvatarId: number,
  Avatar?: AvatarExcelConfigData,

  HardLevelId: number,
  IsNeedUnlock: boolean,
  CostItemId: number,
  CostItemMaterial?: MaterialExcelConfigData,
  CostCount: number,

  PreQuestId: number,
  PreQuest: QuestExcelConfigData,
  PreMainQuest: MainQuestExcelConfigData,

  WinNormalLevelTalkId: number,
  LoseNormalLevelTalkId: number,
  WinHardLevelTalkId: number,
  LoseHardLevelTalkId: number,

  WinNormalLevelTalk: TalkExcelConfigData,
  LoseNormalLevelTalk: TalkExcelConfigData,
  WinHardLevelTalk: TalkExcelConfigData,
  LoseHardLevelTalk: TalkExcelConfigData,

  CondQuestList: never, // unused
  LHOBJKLEJNC: string, // JsonPathHash
}

// GCG LEVEL-SUPPORTING DATA
// --------------------------------------------------------------------------------------------------------------
export interface GCGLevelLockExcelConfigData {
  UnlockLevel: number,
  UnlockMainQuestId: number,
  UnlockDescTextMapHash: number,
  LevelId: number,
  QuestTitleTextMapHash: number,
  QuestDescTextMapHash: number,
  UnlockDescText: string,
  QuestTitleText: string,
  QuestDescText: string,
}

export interface GcgOtherLevelExcelConfigData {
  LevelId: number,
  TalkId: number[],
  Talks?: TalkExcelConfigData[],
}

// GCG REWARD
// --------------------------------------------------------------------------------------------------------------
export interface GCGGameRewardExcelConfigData {
  LevelId: number, // -> GCGGameExcelConfigData.Id
  GroupId: number, // -> ???
  ChallengeRewardList: {
    ChallengeId: number, // -> GCGChallengeExcelConfigData.Id
    Challenge?: GCGChallengeExcelConfigData,
    RewardId: number // -> RewardExcelConfigData.RewardId
    Reward: RewardExcelConfigData,
  }[],

  LevelNameTextMapHash: number,
  LevelNameText: string,

  IntroTextMapHash: number,
  IntroText: string,

  ObjectiveTextMapHashList: number[],
  ObjectiveTextList: string[],

  FailTips: number[],
  MappedFailTips: string[],

  TalkDetailIconId: number,
  TalkDetailIcon?: GCGTalkDetailIconExcelConfigData,

  CondList: {
    Type: 'FINISH_LEVEL_CHALLENGE' | 'GCG_LEVEL',
    ParamList: number[]
    // GCG_LEVEL = [ (LevelNumber) ]
    // FINISH_LEVEL_CHALLENGE = [ (GCGGameExcelConfigData.Id), (GCGChallengeExcelConfigData.Id) ]
  }[],

  MFAAJJMNGMC?: boolean,
  ECMPCDCMCMG?: boolean,
  EFEOOJFNKLN: 'PVE_MONSTER',
  IFKLJAGNCDC?: 'TRAVELER',
  OJIFJBBFGPG: 'Gcg_Loading_Bg2' | 'Gcg_Loading_Bg3' | 'Gcg_Loading_Bg4' | 'Gcg_Loading_Bg5',

  // These two properties don't seem to be used for anything right now:
  OACBEKOLDFI: number[],
  HGDLKEHAKCE: number[],
}

// GCG CHALLENGE
// --------------------------------------------------------------------------------------------------------------

export type GCGChallengeType =
  'GCG_CHALLENGE_BEING_HEAL_SUM'                      |
  'GCG_CHALLENGE_DEAD_CHARACTER_NUM'                  |
  'GCG_CHALLENGE_ELEMENT_REACTION_TIMES'              |
  'GCG_CHALLENGE_ONE_HIT_DAMAGE_TIMES'                |
  'GCG_CHALLENGE_ONE_OPERATION_DAMAGE_SUM_TIMES'      |
  'GCG_CHALLENGE_ONE_OPERATION_KILL_COUNT_TIMES'      |
  'GCG_CHALLENGE_PLAY_CARD_TIMES'                     |
  'GCG_CHALLENGE_PLAY_CARD_WITH_TAG_AND_TYPE_TIMES'   |
  'GCG_CHALLENGE_ROUND_NUM'                           |
  'GCG_CHALLENGE_SETTLE_WITH_SKILL_TAG_Q_TIMES'       |
  'GCG_CHALLENGE_SHIELD_REDUCE_SUM'                   |
  'GCG_CHALLENGE_SKILL_TAG_Q_TIMES'                   |
  'GCG_CHALLENGE_SUMMON_TIMES'                        |
  'GCG_CHALLENGE_WIN'                                 ;

export type GCGChallengeParam =
  ''                  |
  '2'                 |
  '3'                 |
  '8'                 |
  'GCG_CARD_ASSIST'   |
  'GCG_CARD_EVENT'    |
  'GCG_CARD_MODIFY'   |
  'GCG_TAG_ARTIFACT'  |
  'GCG_TAG_FOOD'      |
  'GCG_TAG_PLACE'     |
  'GCG_TAG_WEAPON'    ;

export interface GCGChallengeExcelConfigData {
  Id: number,
  Type: GCGChallengeType,
  ParamList: GCGChallengeParam[],
  ParamTarget: number,
  Progress: number,
  IsAchieveFail: boolean,
}

// GCG CARD TYPES
// --------------------------------------------------------------------------------------------------------------
export type GCGCostType =
  'GCG_COST_DICE_ANEMO'   |
  'GCG_COST_DICE_CRYO'    |
  'GCG_COST_DICE_DENDRO'  |
  'GCG_COST_DICE_ELECTRO' |
  'GCG_COST_DICE_GEO'     |
  'GCG_COST_DICE_HYDRO'   |
  'GCG_COST_DICE_PYRO'    |
  'GCG_COST_DICE_SAME'    |
  'GCG_COST_DICE_VOID'    |
  'GCG_COST_ENERGY'       ;
export type GCGCardElementHintType =
  'GCG_HINT_ANEMO'    |
  'GCG_HINT_CRYO'     |
  'GCG_HINT_DENDRO'   |
  'GCG_HINT_ELECTRO'  |
  'GCG_HINT_HEAL'     |
  'GCG_HINT_HYDRO'    |
  'GCG_HINT_PYRO'     |
  'GCG_HINT_VOID'     ;
export type GCGCardPersistEffectType =
  'GCG_PERSIST_EFFECT_EXPECTO_PATRONUM'   |
  'GCG_PERSIST_EFFECT_IMPERTURBABLE_CHARM'|
  'GCG_PERSIST_EFFECT_PROTEGO'            |
  'GCG_PERSIST_EFFECT_STUPEFY'            ;
export type GCGCardStateBuffType =
  'GCG_STATE_BUFF_ANEMO'      |
  'GCG_STATE_BUFF_CRYO'       |
  'GCG_STATE_BUFF_ELECTRO'    |
  'GCG_STATE_BUFF_GEO'        |
  'GCG_STATE_BUFF_HYDRO'      |
  'GCG_STATE_BUFF_NEGATIVE'   |
  'GCG_STATE_BUFF_PYRO'       ;
export type GCGChooseTargetType = 'GCG_CHOOSE_ARTIFACT_MOVE' | 'GCG_CHOOSE_WEAPON_MOVE';
export type GCGCardType =
  'GCG_CARD_ASSIST'    | // Support cards
  'GCG_CARD_EVENT'     | // Event cards
  'GCG_CARD_MODIFY'    | // Equipment cards
  'GCG_CARD_ONSTAGE'   |
  'GCG_CARD_STATE'     |
  'GCG_CARD_SUMMON'    |
  'GCG_CARD_CHARACTER' ; // Only for GCGCharExcelConfigData

export interface GCGTokenDescConfigData {
  Id: number,
  NameTextMapHash: number,
  NameText: string,
}

// GCG CARD
// --------------------------------------------------------------------------------------------------------------
export interface GCGCommonCard {
  Id: number,
  CardType: GCGCardType,

  NameTextMapHash: number,
  DescTextMapHash: number,
  NameText: string,
  DescText: string,
  IsCanObtain: boolean,

  CardFace?: GCGCardFaceExcelConfigData,
  CardView?: GCGCardViewExcelConfigData,
  DeckCard?: GCGDeckCardExcelConfigData,

  TagList: string[],
  MappedTagList: GCGTagExcelConfigData[],
  SkillList: number[],
  MappedSkillList: GCGSkillExcelConfigData[],

  WikiName?: string,
  WikiNameTextMapHash?: number,
  WikiDesc?: string,
  WikiImage?: string,
  WikiGoldenImage?: string,
  WikiType?: string,
  WikiElement?: string,
  WikiWeapon?: string,
  WikiFaction?: string,
}

export interface GCGCardExcelConfigData extends GCGCommonCard {
  Id: number,
  CardType: GCGCardType,

  ChooseTargetType?: GCGChooseTargetType,
  StateBuffType?: GCGCardStateBuffType,
  PersistEffectType?: GCGCardPersistEffectType,
  ElementHintType?: GCGCardElementHintType,

  ChooseTargetList: number[],
  MappedChooseTargetList?: GCGChooseExcelConfigData[],
  CostList: { CostType: GCGCostType, CostData?: GCGCostExcelConfigData, Count: number }[],

  IsHidden: boolean,
  TokenDescId: number,
  TokenDesc: GCGTokenDescConfigData,

  IsEquipment?: boolean,
  IsSupport?: boolean,
  IsEvent?: boolean,

  BHJGPGHNMPB?: string, // JsonPathHash
  PIGACPCFCPF?: '1' | '2' | '×2',
  LEHHGAJEOEE?: 4,
  GDCDJNEBLAB?: 2,
  LHGFAPKCEGE?: 'GCG_TOKEN_COUNTER',
  DOKABCHGHHO?: 4,
  NJDEBIACCGJ: number,
  APGBHOCBDBF: (
    'Card_111041'   |
    'Card_111042'   |
    'Card_114041'   |
    'Card_114041_2' |
    'Card_126012'   |
    'Card_422005'   |
    'Card_422005_2' |
    'Card_422005_3' |
    'Enchant_Elec'  |
    'Enchant_Fire'  |
    'Enchant_Ice'   |
    'Enchant_Rock'  |
    'Weapon_1'      |
    'Weapon_1_A'    |
    'Weapon_1_A_Sky'|
    'Weapon_2'      |
    'Weapon_2_A'    |
    'Weapon_3_Q'    )[],
  TokenToShow?: 'GCG_TOKEN_COUNTER' | 'GCG_TOKEN_LIFE' | 'GCG_TOKEN_ROUND_COUNT' | 'GCG_TOKEN_SHIELD',
  TokenIconToShow?:
    'GCG_TOKEN_ICON_BARRIER_SHIELD' |
    'GCG_TOKEN_ICON_CLOCK'          |
    'GCG_TOKEN_ICON_HOURGLASS'      |
    'GCG_TOKEN_ICON_NORMAL_SHIELD'  ,
  CMMFEFPMGID?:
    'GCG_TOKEN_COUNTER' |
    'GCG_TOKEN_LIFE'    |
    'GCG_TOKEN_SHIELD'  ,
}

export interface GCGCostExcelConfigData {
  Type: string,
  KeywordId: number,
  Keyword?: GCGKeywordExcelConfigData,
}

export type GCGChooseCondType =
  'ALIVE_CHAR_COUNT'              |
  'CARD'                          |
  'CHARACTER_HURT_MIN'            |
  'HAS_MODIFY_STATE_WITH_TAG'     |
  'IS_ALIVE_CHARACTER'            |
  'NOT_HAS_MODIFY_STATE'          |
  'NOT_HAS_MODIFY_STATE_WITH_TAG' |
  'ONSTAGE'                       |
  'SAME_WEAPON_TYPE_CHAR_COUNT'   |
  'SAME_WEAPON_TYPE_WITH'         ;

export type GCGChooseSortType = 'CHARACTER_ORDER' | 'CREATE_ORDER' | 'HAS_TAG' | 'HP' | 'TOKEN_TO_SHOW';

export interface GCGChooseExcelConfigData {
  Id: number,
  CardType: 'GCG_CARD_CHARACTER' | 'GCG_CARD_SUMMON',
  TargetCamp: 'ENEMY' | 'FRIENDLY',
  TagList: string[],
  MappedTagList: GCGTagExcelConfigData[],
  BAGLDMNNBIP: string[],
  CondList: {
    Type: GCGChooseCondType,
    Value?: number
  }[],
  AICLIKHNGHO: {
    Type: 'CHARACTER_NOT_CHARGED_MAX' | 'CHARACTER_NOT_CHARGED_MIN' | 'ONSTAGE',
    Value: number
  }[],
  SortList: {
    Type: GCGChooseSortType,
    Larger?: boolean,
    Tag?: string
  }[],
  ChooseTextMapHash: number,
  ChooseText: string,
  ChooseType: 'HEALING' | 'RELIC' | 'TALENT' | 'WEAPON',
}

export interface GCGCardFaceExcelConfigData {
  Id: number,
  ItemId: number,
  ItemMaterial?: MaterialExcelConfigData,
  CardId: number,
  CardFaceType: 'GCG_CARD_FACE_GOLD',
  ShopGoodId: number,
  ReceiveParamList: number[],
  NameTextMapHash: number,
  DescTextMapHash: number,
  NameText: string,
  ReceiveCondition?: 'GCG_PROFICIENCY_REWARD',
}

export interface GCGCardViewExcelConfigData {
  Id: number,
  ImagePath: string,
  Image: string,
  SpinePaths: string[],

  HEJOECFICIP: never,
  AMGJBKAJBLM: string[],
  NBIPJPBMABC: string,
  MINCENHBDMG: string,
  OOEGELMFOPF: string,
  CJMAEMFDAGK: string,
  COCCNCFJLDP: string,
  LKBFALNMKFC: string,
}

export interface GCGCharExcelConfigData extends GCGCommonCard {
  Id: number,
  Hp: number,
  CardType: 'GCG_CARD_CHARACTER',
  IsRemoveAfterDie: boolean,
  CharIcon?: string;

  BPHBKAGLFCE: number, // JsonPathHash
  HLKMHIIIFHA: string,
  IAPINBOEJCO: string,
}

export function isCharacterCard(commonCard: GCGCommonCard): commonCard is GCGCharExcelConfigData {
  return commonCard.CardType === 'GCG_CARD_CHARACTER';
}

export function isActionCard(commonCard: GCGCommonCard): commonCard is GCGCardExcelConfigData {
  return commonCard.CardType !== 'GCG_CARD_CHARACTER';
}

// GCG CARD GROUP/DECK
// --------------------------------------------------------------------------------------------------------------
export interface GCGDeckExcelConfigData {
  Id: number,

  CharacterList: number[],
  MappedCharacterList: GCGCharExcelConfigData[], // active

  CardList: number[],
  MappedCardList: GCGCardExcelConfigData[], // action

  WaitingCharacterList: { Id: number, CondCount: number }[],
  MappedWaitingCharacterList: GCGCharExcelConfigData[], // reserve

  InitHpList: never,
  InitEnergyList: never,
}

export interface GCGDeckCardExcelConfigData {
  Id: number,
  ItemId: number,
  ItemMaterial: MaterialExcelConfigData,
  SortOrder: number,
  CardFaceIdList: number[],
  CardFaceList: GCGCardFaceExcelConfigData[],
  ShopGoodId: number,

  RelatedCharacterId: number,
  RelatedCharacterTagList: string[],
  RelatedCharacter?: GCGCharExcelConfigData,

  CardFace?: GCGCardFaceExcelConfigData,
  CardView?: GCGCardViewExcelConfigData,
  ProficiencyReward?: GCGProficiencyRewardExcelConfigData,

  StoryTitleTextMapHash: number,
  StoryContextTextMapHash: number,
  SourceTextMapHash: number,
  StoryTitleText: string,
  StoryContextText: string,
  SourceText: string,
}

export interface GCGProficiencyRewardExcelConfigData {
  CardId: number,
  ProficiencyRewardList: { Proficiency: number, RewardId: number, Reward: RewardExcelConfigData }[],
}

// idk:
export interface GCGDeckStorageExcelConfigData {
  Id: number,
  SourceTextMapHash: number,
  SourceText: string,
  UnlockCond: string,
  UnlockParam: number,
}

// "Card Box" items, e.g. [[Liyue_(Card_Box)]]
export interface GCGDeckFieldExcelConfigData {
  Id: number,
  ItemId: number,
  Order: number,

  NameTextMapHash: number,
  DescTextMapHash: number,
  SourceTextMapHash: number,
  NameText: string,
  DescText: string,
  SourceText: string,
  BattleTableId: number,
  DiceTableId: number,

  StagePrefabPath: string,
  TableTurnHintEffectList: string[],
  StageTurnHintEffectList: string[],
  StageTurnHintLoopEffectList: string[],
  ScreenClickHintEffect: string,
  EnviroPath: string,
  BDFNKMJCNBF: string, // JsonPathHash
  MFCNIONLJGE: string,
}

// "Card Back" items, e.g. [[Dandelion_Seed_(Card_Back)]] or [[Legend]]
export interface GCGDeckBackExcelConfigData {
  Id: number,
  ItemId: number,
  Order: number,
  NameTextMapHash: number,
  DescTextMapHash: number
  NameText: string,
  DescText: string,
  MAEDEOPNNON: string,
  KPINCGJPICF: number,
  BDFNKMJCNBF: string,
}

// idk:
export interface GCGDeckFaceLinkExcelConfigData {
  CardId: number,
  DeckCardId: number,
}