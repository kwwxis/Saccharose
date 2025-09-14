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
