import { AvatarExcelConfigData } from './avatar-types';
import { NpcExcelConfigData } from './general-types';
import { MonsterExcelConfigData } from './monster-types';
import { TalkExcelConfigData } from './dialogue-types';
import { MainQuestExcelConfigData, QuestExcelConfigData } from './quest-types';
import { MaterialExcelConfigData, RewardExcelConfigData } from './material-types';

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
export type SkillTag = 'GCG_SKILL_TAG_A' | 'GCG_SKILL_TAG_E' | 'GCG_SKILL_TAG_NONE' | 'GCG_SKILL_TAG_PASSIVE' | 'GCG_SKILL_TAG_Q';

export interface GCGSkillExcelConfigData {
  Id: number,

  NameTextMapHash: number,
  DescTextMapHash: number,
  CostList: { CostType: GCGCostType, CostData?: GCGCostExcelConfigData, Count: number }[],
  SkillTagList: SkillTag[],
  DescText: string,
  NameText: string,
  EnergyRecharge: number,
  BlockAiCardId: number,
  IsHidden: boolean,

  ODACBHLGCIN: string, // card internal id
  GOOGPDHGMGN: string, // JsonPathHash
  PHNMFFMECLK: 0 | 0.4 | 0.8,

  LHEEECLKKMJ: boolean,
  LOLPGKPEMKI: boolean,
  FOHLOAAPBEJ: boolean,

  KPPDPJPILLC?: 'OnBannerShow' | 'OnBehaviorStart' | 'OnHitLanded',
  OHGMCNABLOD?: string, // skill internal name
  NGLIJEOOBBB?: string, // card internal name
}

export interface GCGSkillTagExcelConfigData {
  Type: SkillTag,
  NameText: string,
  NameTextMapHash: number,
  KeywordId: number,
  Keyword?: GCGKeywordExcelConfigData,
}

export interface GCGTagExcelConfigData {
  Type: string,
  CategoryType: string,
  NameText: string,
  NameTextMapHash: number,
}

export interface GCGKeywordExcelConfigData {
  Id: number,
  TitleTextMapHash: number,
  DescTextMapHash: number,
  TitleText: string,
  DescText: string,
}

// GCG GAME / LEVEL
// --------------------------------------------------------------------------------------------------------------

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
  LevelType: 'BOSS' | 'QUEST' | 'WORLD' | 'WEEK' | 'CHARACTER',
  LevelDifficulty?: 'NORMAL' | 'HARD',
  LevelGcgLevel: number,

  // Resolved level types:
  BossLevel?: GCGBossLevelExcelConfigData,
  QuestLevel: GCGQuestLevelExcelConfigData,
  WorldLevel: GCGWorldLevelExcelConfigData,
  WeekLevel: GCGWeekLevelExcelConfigData,
  CharacterLevel: GCGCharacterLevelExcelConfigData,

  // Quest condition:
  LevelLock?: GCGLevelLockExcelConfigData,

  // Dialogue:
  LevelTalk?: GCGTalkExcelConfigData,
  DialogTalks?: TalkExcelConfigData[],

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
}

export interface GCGQuestLevelExcelConfigData {
  LevelId: number,
  QuestId: number,
  Quest?: QuestExcelConfigData,
  MainQuest?: MainQuestExcelConfigData,
}

// GCG REWARD
// --------------------------------------------------------------------------------------------------------------
export interface GCGGameRewardExcelConfigData {
  LevelId: number, // -> GCGGameExcelConfigData.Id
  GroupId: number,
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
  // OACBEKOLDFI: number[],
  // HGDLKEHAKCE: number[],
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

// GCG CARD
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
  'GCG_CARD_ASSIST'   |
  'GCG_CARD_EVENT'    |
  'GCG_CARD_MODIFY'   |
  'GCG_CARD_ONSTAGE'  |
  'GCG_CARD_STATE'    |
  'GCG_CARD_SUMMON'   ;

export interface GCGTokenDescConfigData {
  Id: number,
  NameTextMapHash: number,
  NameText: string,
}

export interface GCGCardExcelConfigData {
  Id: number,
  CardType: GCGCardType,
  ChooseTargetType?: GCGChooseTargetType,
  StateBuffType?: GCGCardStateBuffType,
  PersistEffectType?: GCGCardPersistEffectType,
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
  ElementHintType?: GCGCardElementHintType,

  NameTextMapHash: number,
  DescTextMapHash: number,
  NameText: string,
  DescText: string,

  ChooseTargetList: number[],
  MappedChooseTargetList?: GCGChooseExcelConfigData[],
  CostList: { CostType: GCGCostType, CostData?: GCGCostExcelConfigData, Count: number }[],
  TagList: string[],
  SkillList: number[],
  IsHidden: boolean,
  IsCanObtain: boolean,
  TokenDescId: number,
  TokenDesc: GCGTokenDescConfigData,

  CardFace?: GCGCardFaceExcelConfigData,
  CardView?: GCGCardViewExcelConfigData,
  DeckCard?: GCGDeckCardExcelConfigData,

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
  GLCONCDPNCI: string,
  DEPNICHKLNH: string[],
  HEJOECFICIP: never,
  AMGJBKAJBLM: string[],
  NBIPJPBMABC: string,
  MINCENHBDMG: string,
  OOEGELMFOPF: string,
  CJMAEMFDAGK: string,
  COCCNCFJLDP: string,
  LKBFALNMKFC: string,
}

export interface GCGCharExcelConfigData {
  Id: number,
  Hp: number,
  CardType: 'GCG_CARD_CHARACTER',

  NameTextMapHash: number,
  DescTextMapHash: number,
  NameText: string,
  DescText: string,

  TagList: string[],
  MappedTagList: GCGTagExcelConfigData[],
  SkillList: number[],
  MappedMappedSkillList: GCGSkillExcelConfigData[],
  IsRemoveAfterDie: boolean,
  IsCanObtain: boolean,

  DeckCard?: GCGDeckCardExcelConfigData,

  BPHBKAGLFCE: number, // JsonPathHash
  HLKMHIIIFHA: string,
  IAPINBOEJCO: string,
}

// GCG CARD GROUP/DECK
// --------------------------------------------------------------------------------------------------------------
export interface GCGDeckExcelConfigData {
  Id: number,

  CharacterList: number[],
  MappedCharacterList: GCGCharExcelConfigData[],

  CardList: number[],
  MappedCardList: GCGCardExcelConfigData[],

  InitHpList: never,
  InitEnergyList: never,
  WaitingCharacterList: { Id: number, CondCount: number }[],
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

export interface GCGDeckStorageExcelConfigData {
  Id: number,
  SourceTextMapHash: number,
  SourceText: string,
  UnlockCond: string,
  UnlockParam: number,
}

export interface GCGProficiencyRewardExcelConfigData {
  CardId: number,
  ProficiencyRewardList: { Proficiency: number, RewardId: number, Reward: RewardExcelConfigData }[],
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

export interface GCGDeckFaceLinkExcelConfigData {
  CardId: number,
  DeckCardId: number,
}