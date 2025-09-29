import { AvatarExcelConfigData } from './avatar-types.ts';

export interface NpcExcelConfigData {
  Id: number,
  NameTextMapHash: number,
  NameText: string,

  JsonName: string,
  SpecialType: string,
  BodyType: NpcExcelConfigDataBodyType,
  Alias: string,

  HasMove: boolean,
  HasAudio: boolean,
  IsDaily: boolean,
  Invisiable: boolean,
  DisableShowName: boolean,
  UseDynBone: boolean,
  SkipInitClosetToGround: boolean,
  IsActivityDailyNpc: boolean,

  BillboardType: string,
  BillboardIcon: string,

  CampId: number,
  FirstMetId: number,
  UniqueBodyId: number,

  ScriptDataPath: string,
  PrefabPathHash: string,
  TemplateEmotionPath: string,
  AnimatorConfigPathHash: string,
  JsonPathHash: string,
  LuaDataPath: string,
  LuaDataIndex: number,
  OKJNGNPPCBP: string,
  JMJLKENBJEA: number,
  BHDMIMPGPOI: number[],

  HasDialogs?: boolean,
  HasTalks?: boolean,
  HasTalksOrDialogs?: boolean,
}

export type NpcExcelConfigDataBodyType =
  'AVATAR_BOY' |
  'AVATAR_GIRL' |
  'AVATAR_LADY' |
  'AVATAR_LOLI' |
  'AVATAR_MALE' |
  'AVATAR_PAIMON' |
  'Barbara' |
  'Bennett' |
  'Chongyun' |
  'Collei' |
  'Diona' |
  'NONE' |
  'NPC_CHILD' |
  'NPC_ELDER' |
  'NPC_FEMALE' |
  'NPC_GIRL' |
  'NPC_MALE' |
  'NPC_MUSCLEMAN' |
  'NPC_Others' |
  'Ningguang' |
  'Noel';

export type NpcFirstMetExcelConfigDataNpcType = 'Avatar' | 'Passersby';
export type NpcFirstMetExcelConfigDataCostElemType = 'Electric' | 'Ice' | 'None' | 'Wind';

export interface NpcFirstMetExcelConfigData {
  Id: number,
  NpcType: NpcFirstMetExcelConfigDataNpcType,
  CostElemType: NpcFirstMetExcelConfigDataCostElemType,

  NameText: string,
  NameTextMapHash: number,

  AvatarTitleText: string,
  AvatarTitleTextMapHash: number,

  AvatarDescriptionText: string,
  AvatarDescriptionTextMapHash: number,

  AvatarId: number,
  Avatar?: AvatarExcelConfigData,

  IconName?: string,
  SubQuestIdList: number[],
}
