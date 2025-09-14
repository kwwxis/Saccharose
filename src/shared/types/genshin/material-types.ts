// The Material IDs of some useful items:
import {
  FurnitureMakeExcelConfigData,
  FurnitureSuiteExcelConfigData,
  HomeWorldFurnitureExcelConfigData,
} from './homeworld-types.ts';
import { AvatarExcelConfigData, BuffExcelConfigData } from './avatar-types.ts';
import { GCGCommonCard } from './gcg-types.ts';
import { BooksCodexExcelConfigData } from './readable-types.ts';

export const ADVENTURE_EXP_ID = 102;
export const PRIMOGEM_ID = 201;
export const MORA_ID = 202;

export interface RewardSummary {
  ExpCount: string,
  MoraCount: string,
  PrimogemCount: string,
  CombinedStrings: string,
  CombinedCards: string,
  CombinedStringsNoLocale: string,
}

export interface RewardExcelConfigData {
  RewardId: number,
  RewardItemList: {
    ItemId?: number,
    ItemCount?: number,
    Material?: MaterialExcelConfigData
  }[],
  RewardSummary?: RewardSummary,
}

export type MaterialType =
  'MATERIAL_ACTIVITY_GEAR'                    |
  'MATERIAL_ACTIVITY_JIGSAW'                  |
  'MATERIAL_ACTIVITY_ROBOT'                   |
  'MATERIAL_ADSORBATE'                        |
  'MATERIAL_ARANARA'                          |
  'MATERIAL_AVATAR'                           |
  'MATERIAL_AVATAR_MATERIAL'                  |
  'MATERIAL_AVATAR_TALENT_MATERIAL'           |
  'MATERIAL_AVATAR_TRACE'                     |
  'MATERIAL_BGM'                              |
  'MATERIAL_CHANNELLER_SLAB_BUFF'             |
  'MATERIAL_CHEST'                            |
  'MATERIAL_CHEST_BATCH_USE'                  |
  'MATERIAL_CHEST_BATCH_USE_WITH_GROUP'       |
  'MATERIAL_CONSUME'                          |
  'MATERIAL_CONSUME_BATCH_USE'                |
  'MATERIAL_COSTUME'                          |
  'MATERIAL_CRICKET'                          |
  'MATERIAL_DESHRET_MANUAL'                   |
  'MATERIAL_ELEM_CRYSTAL'                     |
  'MATERIAL_EXCHANGE'                         |
  'MATERIAL_EXP_FRUIT'                        |
  'MATERIAL_FAKE_ABSORBATE'                   |
  'MATERIAL_FIREWORKS'                        |
  'MATERIAL_FIRE_MASTER_AVATAR_TALENT_ITEM'   |
  'MATERIAL_FISH_BAIT'                        |
  'MATERIAL_FISH_ROD'                         |
  'MATERIAL_FLYCLOAK'                         |
  'MATERIAL_FOOD'                             |
  'MATERIAL_FURNITURE_FORMULA'                |
  'MATERIAL_FURNITURE_SUITE_FORMULA'          |
  'MATERIAL_GCG_CARD'                         |
  'MATERIAL_GCG_CARD_BACK'                    |
  'MATERIAL_GCG_CARD_FACE'                    |
  'MATERIAL_GCG_EXCHANGE_ITEM'                |
  'MATERIAL_GCG_FIELD'                        |
  'MATERIAL_GREATEFESTIVALV2_INVITE'          |
  'MATERIAL_HOLIDAY_MEMORY_BOOK'              |
  'MATERIAL_HOLIDAY_RESORT_INVITE'            |
  'MATERIAL_HOME_SEED'                        |
  'MATERIAL_LANV5_PAIMON_GREETING_CARD'       |
  'MATERIAL_MIKAWA_FLOWER_INVITE'             |
  'MATERIAL_MUSIC_GAME_BOOK_THEME'            |
  'MATERIAL_NAMECARD'                         |
  'MATERIAL_NATLAN_RACE_ALBUM'                |
  'MATERIAL_NATLAN_RACE_ENVELOPE'             |
  'MATERIAL_NATLAN_RELATION_A'                |
  'MATERIAL_NATLAN_RELATION_B'                |
  'MATERIAL_NONE'                             |
  'MATERIAL_NOTICE_ADD_HP'                    |
  'MATERIAL_PHOTOGRAPH_POSE'                  |
  'MATERIAL_PHOTOV5_HAND_BOOK'                |
  'MATERIAL_PHOTOV6_HAND_BOOK'                |
  'MATERIAL_PHOTO_DISPLAY_BOOK'               |
  'MATERIAL_PROFILE_FRAME'                    |
  'MATERIAL_PROFILE_PICTURE'                  |
  'MATERIAL_QUEST'                            |
  'MATERIAL_QUEST_ALBUM'                      |
  'MATERIAL_QUEST_EVENT_BOOK'                 |
  'MATERIAL_RAINBOW_PRINCE_HAND_BOOK'         |
  'MATERIAL_RARE_GROWTH_MATERIAL'             |
  'MATERIAL_RELIQUARY_MATERIAL'               |
  'MATERIAL_REMUS_MUSIC_BOX'                  |
  'MATERIAL_RENAME_ITEM'                      |
  'MATERIAL_ROBO_GIFT'                        |
  'MATERIAL_SEA_LAMP'                         |
  'MATERIAL_SELECTABLE_CHEST'                 |
  'MATERIAL_SPICE_FOOD'                       |
  'MATERIAL_TALENT'                           |
  'MATERIAL_WEAPON_EXP_STONE'                 |
  'MATERIAL_WEAPON_SKIN'                      |
  'MATERIAL_WIDGET'                           |
  'MATERIAL_WOOD'                             ;
export type MaterialUseTarget =
  'ITEM_USE_TARGET_CUR_TEAM'              |
  'ITEM_USE_TARGET_NONE'                  |
  'ITEM_USE_TARGET_PLAYER_AVATAR'         |
  'ITEM_USE_TARGET_SPECIFY_ALIVE_AVATAR'  |
  'ITEM_USE_TARGET_SPECIFY_AVATAR'        |
  'ITEM_USE_TARGET_SPECIFY_DEAD_AVATAR'   ;

export type MaterialItemUseOp =
  'ITEM_USE_ACCEPT_QUEST'                     |
  'ITEM_USE_ADD_ALCHEMY_SIM_ITEM'             |
  'ITEM_USE_ADD_ALL_ENERGY'                   |
  'ITEM_USE_ADD_AVATAR_EXTRA_PROPERTY'        |
  'ITEM_USE_ADD_CHANNELLER_SLAB_BUFF'         |
  'ITEM_USE_ADD_CUR_HP'                       |
  'ITEM_USE_ADD_CUR_STAMINA'                  |
  'ITEM_USE_ADD_DUNGEON_COND_TIME'            |
  'ITEM_USE_ADD_ELEM_ENERGY'                  |
  'ITEM_USE_ADD_EXP'                          |
  'ITEM_USE_ADD_ITEM'                         |
  'ITEM_USE_ADD_MAGNET_POWER'                 |
  'ITEM_USE_ADD_PERSIST_STAMINA'              |
  'ITEM_USE_ADD_PHLOGISTON'                   |
  'ITEM_USE_ADD_REGIONAL_PLAY_VAR'            |
  'ITEM_USE_ADD_RELIQUARY_EXP'                |
  'ITEM_USE_ADD_SELECT_ITEM'                  |
  'ITEM_USE_ADD_SERVER_BUFF'                  |
  'ITEM_USE_ADD_TEMPORARY_STAMINA'            |
  'ITEM_USE_ADD_WEAPON_EXP'                   |
  'ITEM_USE_ADD_WEAPON_SKIN'                  |

  'ITEM_USE_CHECK_FORMAL_AVATAR'              |
  'ITEM_USE_CHEST_SELECT_ITEM'                |
  'ITEM_USE_COMBINE_ITEM'                     |

  'ITEM_USE_GAIN_AVATAR'                      |
  'ITEM_USE_GAIN_AVATAR_TALENT_MATERIAL'      |
  'ITEM_USE_GAIN_CARD_PRODUCT'                |
  'ITEM_USE_GAIN_COSTUME'                     |
  'ITEM_USE_GAIN_FLYCLOAK'                    |
  'ITEM_USE_GAIN_GCG_CARD'                    |
  'ITEM_USE_GAIN_GCG_CARD_BACK'               |
  'ITEM_USE_GAIN_GCG_CARD_FACE'               |
  'ITEM_USE_GAIN_GCG_CARD_FIELD'              |
  'ITEM_USE_GAIN_NAME_CARD'                   |

  'ITEM_USE_GRANT_SELECT_REWARD'              |
  'ITEM_USE_MAKE_GADGET'                      |
  'ITEM_USE_MUSIC_GAME_BOOK_UNLOCK_THEME'     |
  'ITEM_USE_NONE'                             |
  'ITEM_USE_OPEN_DROP_EXTRA'                  |
  'ITEM_USE_OPEN_RANDOM_CHEST'                |
  'ITEM_USE_OPEN_RENAME_DIALOG'               |
  'ITEM_USE_RELIVE_AVATAR'                    |
  'ITEM_USE_SET_OPEN_STATE'                   |

  'ITEM_USE_UNLOCK_AVATAR_TRACE'              |
  'ITEM_USE_UNLOCK_CODEX'                     |
  'ITEM_USE_UNLOCK_COMBINE'                   |
  'ITEM_USE_UNLOCK_COOK_RECIPE'               |
  'ITEM_USE_UNLOCK_FORGE'                     |
  'ITEM_USE_UNLOCK_FURNITURE_FORMULA'         |
  'ITEM_USE_UNLOCK_FURNITURE_SUITE'           |
  'ITEM_USE_UNLOCK_HOME_BGM'                  |
  'ITEM_USE_UNLOCK_HOME_MODULE'               |
  'ITEM_USE_UNLOCK_PAID_BATTLE_PASS_NORMAL'   |
  'ITEM_USE_UNLOCK_PHOTOGRAPH_POSE'           |
  'ITEM_USE_UNLOCK_PROFILE_FRAME'             |
  'ITEM_USE_UNLOCK_PROFILE_PICTURE'           ;

export type MaterialLoadConf = {LoadSourceData?: boolean, LoadRelations?: boolean, LoadItemUse?: boolean, LoadCodex?: boolean};

export function isMaterialExcelConfigData(o: any): o is MaterialExcelConfigData {
  return o.Id && o.MaterialType;
}

export interface MaterialExcelConfigData {
  Id: number,

  // General:
  Rank?: number,
  RankLevel?: number,
  ItemType?: 'ITEM_VIRTUAL' | 'ITEM_MATERIAL',
  StackLimit?: number,
  MaterialType?: MaterialType,
  GlobalItemLimit?: number,

  // Descriptions:
  NameText: string,
  NameTextMapHash: number

  DescText?: string,
  DescTextMapHash?: number,

  InteractionTitleText?: string,
  InteractionTitleTextMapHash?: number,

  SpecialDescText?: string,
  SpecialDescTextMapHash?: number,

  TypeDescText?: string,
  TypeDescTextMapHash?: number,
  WikiTypeDescText?: string,

  // Boolean states:
  UseOnGain?: boolean,
  CloseBagAfterUsed?: boolean,
  IsHidden?: boolean,
  Dropable: boolean,
  IsSplitDrop: boolean,
  IsForceGetHint: boolean,
  NoFirstGetHint: boolean,
  PlayGainEffect?: boolean,

  // Icon:
  Icon?: string,
  IconUrl?: string,
  DownloadIconUrl?: string,

  // Efect:
  EffectIcon?: string,
  EffectName?: string,
  EffectDescText?: string,
  EffectDescTextMapHash?: number,
  EffectGadgetId?: number,

  // Food Fullness [Parameter A, Parameter B] (See [[Food#Fullness]])
  SatiationParams?: number[],

  // Food Quality
  FoodQuality?: MaterialFoodQuality,

  // Other Images:
  PicPath?: string[],

  // Destroy Rule:
  DestroyRule?: 'DESTROY_NONE' | 'DESTROY_RETURN_MATERIAL',
  DestroyReturnMaterial?: never,
  DestroyReturnMaterialCount?: never,

  // Item Use:
  MaxUseCount?: number,
  UseTarget?: MaterialUseTarget,
  UseLevel?: number,
  ItemUse?: {
    UseOp: MaterialItemUseOp,
    UseParam: string[],
    // ITEM_USE_UNLOCK_FURNITURE_FORMULA => ["371119"]]
    // ITEM_USE_ADD_SERVER_BUFF => ["500202", "900"]
  }[],
  LoadedItemUse?: {
    Furniture?: HomeWorldFurnitureExcelConfigData,
    FurnitureSet?: FurnitureSuiteExcelConfigData,
    AddItem?: MaterialVecItem,
    GcgCard?: GCGCommonCard,
    BookCodex?: BooksCodexExcelConfigData,
    BookCodexMaterial?: MaterialExcelConfigData,
    ItemCombine?: { Needed: number; Result: MaterialExcelConfigData };
    ServerBuff?: BuffExcelConfigData;
    GrantSelectRewards?: RewardExcelConfigData[],
  },

  // Unknown:
  GadgetId?: number,
  CdTime?: number,
  CdGroup?: number,
  Weight?: 1 | 0,
  SetId?: number,

  // Custom:
  SourceData?: MaterialSourceDataExcelConfigData,
  Relations?: ItemRelationMap,
  Codex?: MaterialCodexExcelConfigData,
}

export type MaterialFoodQuality = 'FOOD_QUALITY_NONE' | 'FOOD_QUALITY_STRANGE' | 'FOOD_QUALITY_ORDINARY' | 'FOOD_QUALITY_DELICIOUS';

export interface MaterialSourceDataExcelConfigData {
  Id: number,
  DungeonList: number[],
  JumpDescs: number[],
  TextList: number[],
  MappedTextList: string[],
  MappedJumpDescs: string[],
}

export interface MaterialVecItem {
  Id: number,
  Count: number,
  Material?: MaterialExcelConfigData,
}

export type MaterialRelation<T = any> = {
  RelationId: number,
  RoleId: number,
  RoleType: 'input' | 'output' | 'substitute',
  RelationData?: T,
  RecipeWikitext?: string[],
}

export type ItemRelationMap = {
  Combine: MaterialRelation<CombineExcelConfigData>[],
  Compound: MaterialRelation<CompoundExcelConfigData>[],
  CookRecipe: MaterialRelation<CookRecipeExcelConfigData>[],
  CookBonus: MaterialRelation<CookBonusExcelConfigData>[],
  Forge: MaterialRelation<ForgeExcelConfigData>[],
  FurnitureMake: MaterialRelation<FurnitureMakeExcelConfigData>[],
}

export type ItemRelationType = keyof ItemRelationMap;

export type ItemRelationTable =
  'CombineExcelConfigData' |
  'CompoundExcelConfigData' |
  'CookRecipeExcelConfigData' |
  'CookBonusExcelConfigData' |
  'ForgeExcelConfigData' |
  'FurnitureMakeExcelConfigData';

export interface CombineExcelConfigData {
  CombineId: number,
  EffectDescTextMapHash: number,
  EffectDescText: string,

  RecipeType: 'RECIPE_TYPE_COMBINE' | 'RECIPE_TYPE_COMBINE_HOMEWORLD' | 'RECIPE_TYPE_CONVERT',
  PlayerLevel: number,
  IsDefaultShow: boolean,
  CombineType: number,
  SubCombineType: number,

  ScoinCost: number,
  ResultItemId: number,
  ResultItemCount: number,
  ResultItem?: MaterialExcelConfigData,
  RandomItems: { Count: number }[],
  MaterialItems: MaterialVecItem[],
}

export interface CompoundExcelConfigData {
  Id: number,
  GroupId: number,
  RankLevel: number,
  Type: 'COMPOUND_COOK' | 'COMPOUND_RANDOM_COOK',

  NameText: string,
  DescText: string,
  CountDescText: string,

  NameTextMapHash: number,
  DescTextMapHash: number,
  CountDescTextMapHash: number,

  IsDefaultUnlocked: boolean,
  CostTime: number,
  QueueSize: number,
  InputVec: MaterialVecItem[],
  OutputVec: MaterialVecItem[],
  Icon: string,
  DropId: number,
}

export interface CookRecipeExcelConfigData {
  Id: number,
  RankLevel: number,
  Icon: string,

  NameText: string,
  DescText: string,
  NameTextMapHash: number,
  DescTextMapHash: number,
  EffectDesc: number[],
  MappedEffectDesc: string[],

  FoodType: 'COOK_FOOD_ATTACK' | 'COOK_FOOD_DEFENSE' | 'COOK_FOOD_FUNCTION' | 'COOK_FOOD_HEAL',
  CookMethod: 'COOK_METHOD_BAKE' | 'COOK_METHOD_BOIL' | 'COOK_METHOD_FRY' | 'COOK_METHOD_STEAM',
  IsDefaultUnlocked: boolean,
  MaxProficiency: number,

  InputVec: MaterialVecItem[],
  QualityOutputVec: MaterialVecItem[],

  QteParam: string,
  QteQualityWeightVec: number[],
}

export interface CookBonusExcelConfigData {
  AvatarId: number,
  Avatar?: AvatarExcelConfigData,
  RecipeId: number,
  Recipe?: CookRecipeExcelConfigData,
  RecipeOrdinaryResult: MaterialVecItem,
  ResultItemId: number,
  ResultItem?: MaterialExcelConfigData,
  BonusType: 'COOK_BONUS_REPLACE',
  ParamVec: number[],
  ComplexParamVec: [number, number, number]
}

export interface ForgeExcelConfigData {
  Id: number,

  Priority: number,
  ForgeType: number,
  IsDefaultShow: boolean,
  PlayerLevel: number,
  EffectiveWorldLevels: number[],

  ForgePoint: number,
  ForgePointNoticeText: string,
  ForgePointNoticeTextMapHash: number,

  ShowItemId: number,
  ShowConsumeItemId: number,
  ForgeTime: number,
  QueueNum: number,
  RandomItems: never,

  ScoinCost: number,
  ResultItemId: number,
  ResultItemCount: number,
  ResultItem?: MaterialExcelConfigData,
  MaterialItems: MaterialVecItem[],
  MainRandomDropId: number,
}

export interface MaterialCodexExcelConfigData {
  Id: number,
  MaterialId: number,
  SortOrder: number,
  IsDisuse: boolean,

  NameText: string,
  NameTextMapHash: number,

  DescText: string,
  DescTextMapHash: number,

  Icon?: never,
  ShowOnlyUnlocked: boolean,
  Type?: 'CODEX_COOKING_FOOD' | 'CODEX_WAR_TROPHIES' | 'CODEX_WIDGET',

  CELECMEPGFI: number,
  FMFDBLGMOKI: number,
  GACAKMCNKHI: number,
  GBHOGPFGPDJ: number,
  NNMCLALECMM: number,
}
