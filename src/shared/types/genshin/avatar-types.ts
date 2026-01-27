import { isInt } from '../../util/numberUtil.ts';

export type AvatarExcelConfigDataQualityType  = 'QUALITY_ORANGE' | 'QUALITY_ORANGE_SP' | 'QUALITY_PURPLE';
export type AvatarExcelConfigDataUseType      = 'AVATAR_ABANDON' | 'AVATAR_FORMAL' | 'AVATAR_SYNC_TEST' | 'AVATAR_TEST';
export type AvatarExcelConfigDataWeaponType   = 'WEAPON_BOW' | 'WEAPON_CATALYST' | 'WEAPON_CLAYMORE' | 'WEAPON_POLE' | 'WEAPON_SWORD_ONE_HAND';
export type AvatarExcelConfigDataBodyType     = 'BODY_BOY' | 'BODY_GIRL' | 'BODY_LADY' | 'BODY_LOLI' | 'BODY_MALE';
export type AvatarExcelConfigDataAvatarIdentityType = 'AVATAR_IDENTITY_MASTER' | 'AVATAR_IDENTITY_NORMAL';

export function isAvatar(o: any): o is AvatarExcelConfigData {
  return isInt(o.Id) && !!o.AvatarIdentityType;
}

export interface AvatarExcelConfigData {
  Id: number,
  QualityType: AvatarExcelConfigDataQualityType,
  NameText: string,
  NameTextMapHash: number,
  DescText: string,
  DescTextMapHash: number,
  InfoDescText: string,
  InfoDescTextMapHash: number,
  InitialWeapon: number, // weapon id
  WeaponType: AvatarExcelConfigDataWeaponType,
  BodyType: AvatarExcelConfigDataBodyType,
  IconName: string,
  ImageName: string,
  SideIconName: string,

  AnimatorConfigPathHash: number|string,
  AttackBase: number,
  AvatarIdentityType: AvatarExcelConfigDataAvatarIdentityType,
  AvatarPromoteId: number,
  AvatarPromoteRewardIdList: number[],
  AvatarPromoteRewardLevelList: number[],
  BCKLNKFFIBN: number|string,
  BKCLJKHLOHI: number|string,
  BNBIMGGNMJB: number,
  CampId: number,
  CandSkillDepotIds: number[],
  ChargeEfficiency: number,
  CombatConfigHash: string,
  ControllerPathHash: string,
  ControllerPathRemoteHash: string,
  CoopPicNameHash: string|number,
  Critical: number,
  CriticalHurt: number,
  DJEEJEICACA: number,
  DefenseBase: number,
  DeformationMeshPathHash: string,
  EHOIIPACDEC: number,
  ElecSubHurt: number,
  ElementMastery: number,
  FFEEGCJCBGB: number,
  FHCHMEECOIE: number,
  FeatureTagGroupId: number,
  FireSubHurt: number,
  GAIDKDLLFEH: number,
  GAPNFMHMEJI: boolean,
  GachaCardNameHash: string|number,
  GachaImageNameHash: string|number,
  GrassSubHurt: number,
  HAGKGEEAAIK: number,
  HFPHGGOKJAD: number,
  HpBase: number,
  INIIGAGFDMG: boolean,
  IceSubHurt: number,
  IsRangeAttack: boolean,
  JJCDEPCEKJO: string,
  KILINOBNBPO: number,
  KKFPOIBHPEK: number|string,
  LNMIDNHMJFC: string,
  MALFNOPHKPA: string,
  MAPKODPJLFB: number,
  MGPMHIOHGMK: number,
  MIJMKGNIOPD: string,
  ManekinJsonConfigHash: string,
  ManekinMotionConfig: number,
  ManekinPathHash: string,
  NAKPAEBDJAC: number|string,
  NIDCKFMJHLB: string|number,
  OBGGFJKAOJC: number|string,
  OHNKPJFCKIC: number|string,
  OOMNOELEHIL: number,
  PPLEFFANMHL: number,
  PhysicalSubHurt: number,
  PrefabPathHash: string,
  PrefabPathRagdollHash: string,
  PrefabPathRemoteHash: string,
  PropGrowCurves: { GrowCurve: string, Type: string }[],
  RockSubHurt: number,
  ScriptDataPathHash: string,
  SkillDepotId: number,
  SpecialDeformationMeshPathHash: number|string,
  StaminaRecoverSpeed: number,
  Tags: string[],
  UseType: AvatarExcelConfigDataUseType,
  WaterSubHurt: number,
  WindSubHurt: number,
}

export interface AvatarFlycloakExcelConfigData {
  FlycloakId: number,
  NameText: string,
  DescText: string,
  NameTextMapHash: number,
  DescTextMapHash: number,
  PrefabPath: string,
  JsonName: string,
  Icon: string,
  MaterialId: number
}

export interface AvatarCostumeExcelConfigData {
  SkinId: number,
  IndexId: number,
  NameTextMapHash: number,
  DescTextMapHash: number,
  ItemId: number,
  CharacterId: number,
  JsonName: string,
  PrefabPathHash: string,
  PrefabRemotePathHash: string,
  PrefabNpcPathHash: string,
  PrefabManekinPathHash: string,
  Quality: number,
  FrontIconName: string,
  SideIconName: string,
  ImageNameHash: string,
  NameText: string,
  DescText: string,
  IsDefaultUnlock: boolean,
  Hide: boolean,
  AnimatorConfigPathHash: string,
  ControllerPathHash: string,
  ControllerRemotePathHash: string,
  IsDefault: boolean,
  DomesticHideInArtPreview: boolean,
}

export function isTraveler(avatar: number|AvatarExcelConfigData, checkMode: 'male' | 'female' | 'either' = 'either'): boolean {
  if (!avatar) {
    return false;
  }
  if (typeof avatar !== 'number') {
    avatar = avatar.Id;
  }
  if (checkMode === 'either') {
    return [10000005, 10000007].includes(avatar);
  } else if (checkMode === 'male') {
    return avatar === 10000005;
  } else {
    return avatar === 10000007;
  }
}

export type BuffExcelConfigDataServerBuffType = 'SERVER_BUFF_AVATAR' | 'SERVER_BUFF_TEAM';
export type BuffExcelConfigDataStackType = 'BUFF_REFRESH' | 'BUFF_STACK';

export interface BuffExcelConfigData {
  AbilityName: string,
  Desc: string,
  GroupId: number,
  IsDelWhenLeaveScene: boolean,
  IsPersistent: boolean,
  ModifierName: string,
  Name: string,
  ServerBuffId: number,
  ServerBuffType: BuffExcelConfigDataServerBuffType,
  StackType: BuffExcelConfigDataStackType,
  Time: number,
}

export interface ProudSkillExcelConfigData {
  ProudSkillId: number,
  ProudSkillType: number,
  ProudSkillGroupId: number,

  NameText: string,
  NameTextMapHash: number,

  DescText: string,
  DescTextMapHash: number,

  AddProps: { PropType: string, Value: number }[],
  BreakLevel: number,
  CoinCost: number,
  CostItems: { Count: number, Id: number }[],
  FilterConds: string[],
  Icon: string,
  IsHideLifeProudSkill: boolean,
  KAJBEPHIMBF: { MValue: number },
  Level: number,
  LifeEffectParams: string[],
  LifeEffectType: string,
  NEBCFNAHGBG: string,
  OpenConfig: string,
  ParamDescList: number[],
  ParamList: number[],
  UnlockDescTextMapHash: number,
}

export type AvatarSkillExcelConfigDataCostElemType =
  'Electric'
  | 'Fire'
  | 'Grass'
  | 'Ice'
  | 'None'
  | 'Rock'
  | 'Water'
  | 'Wind';
export type AvatarSkillExcelConfigDataDragType = 'DRAG_NONE' | 'DRAG_ROTATE_CAMERA' | 'DRAG_ROTATE_CHARACTER';

export interface AvatarSkillExcelConfigData {
  AbilityName: string,
  BNHEJBMOBLG: string,
  BuffIcon: string,
  CdSlot: number,
  CdTime: number,
  CostElemType: AvatarSkillExcelConfigDataCostElemType,
  CostElemVal: number,
  CostStamina: number,
  DefaultLocked: boolean,
  DescText: string,
  DescTextMapHash: number,
  DragType: AvatarSkillExcelConfigDataDragType,
  EnergyMin: number,
  ExtraDescText: string,
  ExtraDescTextMapHash: number,
  ForceCanDoSkill: boolean,
  GlobalValueKey: string,
  IBCOEJNPPEB: boolean,
  ILBLBCFNPNP: number,
  Id: number,
  IgnoreCDMinusRatio: boolean,
  IsAttackCameraLock: boolean,
  IsRanged: boolean,
  KOGMLJGAKFB: boolean,
  LockShape: string,
  LockWeightParams: number[],
  MHNFKLCEHBO: boolean,
  MaxChargeNum: number,
  NameText: string,
  NameTextMapHash: number,
  NeedMonitor: string,
  NeedStore: boolean,
  OBAFCGLGMAD: number,
  ProudSkillGroupId: number,
  ShareCDId: number,
  ShowIconArrow: boolean,
  SkillIcon: string,
  TriggerId: number,
}
