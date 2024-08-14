import { LangCodeMap, VoiceItem } from '../lang-types.ts';

export type AvatarBaseTypeEnum = 'Knight' | 'Mage' | 'Priest' | 'Rogue' | 'Shaman' | 'Warlock' | 'Warrior';

export type AvatarDamageType = 'Fire' | 'Ice' | 'Imaginary' | 'Physical' | 'Quantum' | 'Thunder' | 'Wind';

export type AvatarConfigRarity = 'CombatPowerAvatarRarityType4' | 'CombatPowerAvatarRarityType5';

export interface AvatarConfig {
  Id: number,
  VOTag: string,
  AdventurePlayerId: number,
  BaseType: AvatarBaseTypeEnum,
  BaseTypeData?: AvatarBaseType, // custom
  DamageType: AvatarDamageType,
  Rarity: AvatarConfigRarity,
  MaxPromotion: number,
  MaxRank: number,
  RankIdList: number[],
  Release: boolean,
  SPNeedValue: number,

  // Icons:
  ActionHeadIconPath: string,
  MiniIconPath: string,
  SideIconPath: string,
  DefaultHeadIconPath: string,
  SideHeadIconPath: string,
  WaitingHeadIconPath: string,
  GachaResultImgPath: string,
  CutinBgImgPath: string,
  CutinFrontImgPath: string,
  CutinImgPath: string,

  // Texts:
  NameText: string,
  NameTextMapHash: number,

  DescText: string,
  DescTextMapHash: number,

  FullNameText: string,
  FullNameTextMapHash: number,

  CutinIntroText: string,
  CutinIntroTextMapHash: number,

  // Offets:
  AssistBgOffset: number[],
  AssistOffset: number[],
  AvatarDropOffset: number[],
  AvatarSelfShowOffset: number[],
  AvatarTrialOffset: number[],
  PlayerCardOffset: number[],

  // Other:
  AIPath: string,
  DamageTypeResistance: never,
  DefaultAvatarModelPath: string,
  ExpGroup: number,
  JsonPath: string,
  ManikinJsonPath: string,

  // Reward:
  RewardList: { ItemId: number, ItemNum: number }[],
  RewardListMax: { ItemId: number, ItemNum: number }[],

  // Skill:
  SkillList: number[],
  SkilltreePrefabPath: string,
  UIAvatarModelPath: string,
  UltraSkillCutInPrefabPath: string,
}

export function isTrailblazer(avatar: number|AvatarConfig, checkMode: 'male' | 'female' | 'either' = 'either'): boolean {
  if (!avatar) {
    return false;
  }
  if (typeof avatar !== 'number') {
    avatar = avatar.Id;
  }

  const maleIds = [8001, 8003];
  const femaleIds = [8002, 8004];

  if (checkMode === 'either') {
    return [... maleIds, ... femaleIds].includes(avatar);
  } else if (checkMode === 'male') {
    return maleIds.includes(avatar);
  } else {
    return femaleIds.includes(avatar);
  }
}

export interface AvatarBaseType {
  Id: string,
  BaseTypeDescText: string,
  BaseTypeDescTextMapHash: number,
  BaseTypeIcon: string,
  BaseTypeIconMiddle: string,
  BaseTypeIconPathTalk: string,
  BaseTypeIconSmall: string,
  BaseTypeText: string,
  BaseTypeTextMapHash: number,
  BgPath: string,
  Equipment3DTgaPath: string,
  EquipmentLightMatPath: string,
  FirstWordText: string,
}

export interface AvatarVO {
  VOTag: string,

  ActionBegin: number,
  ActionBeginAdvantage: number,
  ActionBeginHighThreat: number,
  LightHit: number,
  ReceiveHealing: number,
  Revived: number,
  StandBy: number,
  UltraReady: number,
}

export interface AtlasUnlockData {
  UnlockId: number,
  Conditions: {
    Type: 'AvatarLevel' | 'FinishMainMission',
    Param: string
  }[],
  ShowCondition: never,
}

export interface VoiceAtlas {
  AvatarId: number,
  VoiceId: number,
  AudioId: number, // -> VoiceConfig.VoiceId
  VoiceItem?: VoiceItem,
  IsBattleVoice: boolean,

  AudioEvent: string,

  // Unlocks:

  Unlock: number, // AtlasUnlockData -> UnlockId
  UnlockData?: AtlasUnlockData, // custom
  UnlockMissionNameTextMap: LangCodeMap,

  // Texts:

  VoiceTitleTextMap: LangCodeMap,
  VoiceTitleTextMapHash: number,

  UnlockDescTextMap: LangCodeMap,
  UnlockDescTextMapHash: number,

  VoiceMTextMap: LangCodeMap,
  VoiceMTextMapHash: number,

  VoiceFTextMap: LangCodeMap,
  VoiceFTextMapHash: number,
}

export interface VoiceAtlasGroup {
  avatarId: number;
  avatarName: LangCodeMap;
  storyAtlases: VoiceAtlas[];
  combatAtlases: VoiceAtlas[];
}

export type VoiceAtlasGroupByAvatar = {[avatarId: number]: VoiceAtlasGroup};
