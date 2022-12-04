import { AvatarExcelConfigData, NpcExcelConfigData } from './general-types';

export interface HomeWorldEventExcelConfigData {
  EventId: number,
  EventType: 'HOME_AVATAR_SUMMON_EVENT' | 'HOME_AVATAR_REWARD_EVENT',
  AvatarId: number,
  Avatar?: AvatarExcelConfigData,
  TalkId: number,
  RewardId: number,
  FurnitureSuitId: number,
  Order: number,
}

export interface HomeWorldNPCExcelConfigData {
  FurnitureId: number,
  AvatarId: number,
  Avatar?: AvatarExcelConfigData,
  NpcId: number,
  Npc?: NpcExcelConfigData,
  TalkIds: number[],
  ShowNameTextMapHash: number,
  DescTextMapHash: number,
  RewardEvents: HomeWorldEventExcelConfigData[],
  SummonEvents: HomeWorldEventExcelConfigData[],
  IsNPC?: boolean,
}