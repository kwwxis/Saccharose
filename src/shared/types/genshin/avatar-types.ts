export interface AvatarExcelConfigData {
  Id: number,
  QualityType: string,
  NameText: string,
  NameTextMapHash: number,
  DescText: string,
  DescTextMapHash: number,
  InfoDescText: string,
  InfoDescTextMapHash: number,
  InitialWeapon: number,
  WeaponType: string,
  BodyType: string,
  IconName: string,
  ImageName: string,
  SideIconName: string,
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
