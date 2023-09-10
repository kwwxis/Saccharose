export type AvatarBaseType = 'Knight' | 'Mage' | 'Priest' | 'Rogue' | 'Shaman' | 'Warlock' | 'Warrior';

export type AvatarDamageType = 'Fire' | 'Ice' | 'Imaginary' | 'Physical' | 'Quantum' | 'Thunder' | 'Wind';

export type AvatarConfigRarity = 'CombatPowerAvatarRarityType4' | 'CombatPowerAvatarRarityType5';

export interface AvatarConfig {
  AvatarId: number,
  AvatarVOTag: string,
  AdventurePlayerId: number,
  AvatarBaseType: AvatarBaseType,
  DamageType: AvatarDamageType,
  Rarity: AvatarConfigRarity,
  MaxPromotion: number,
  MaxRank: number,
  RankIdList: number[],
  Release: boolean,
  SPNeedValue: number,

  // Icons:
  ActionAvatarHeadIconPath: string,
  AvatarMiniIconPath: string,
  AvatarSideIconPath: string,
  DefaultAvatarHeadIconPath: string,
  SideAvatarHeadIconPath: string,
  WaitingAvatarHeadIconPath: string,
  AvatarGachaResultImgPath: string,
  AvatarCutinBgImgPath: string,
  AvatarCutinFrontImgPath: string,
  AvatarCutinImgPath: string,

  // Texts:
  AvatarNameText: string,
  AvatarNameTextMapHash: number,

  AvatarDescText: string,
  AvatarDescTextMapHash: number,

  AvatarFullNameText: string,
  AvatarFullNameTextMapHash: number,

  AvatarCutinIntroText: string,
  AvatarCutinIntroTextMapHash: number,

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
  AudioId: number,
  IsBattleVoice: boolean,

  AudioEvent: string,

  Unlock: number, // AtlasUnlockData -> UnlockId
  UnlockData?: AtlasUnlockData, // custom

  VoiceTitleText: string,
  VoiceTitleTextMapHash: number,

  UnlockDescText: string,
  UnlockDescTextMapHash: number,

  VoiceMText: string,
  VoiceMTextMapHash: number,

  VoiceFText: string,
  VoiceFTextMapHash: number,
}
