export interface MessageContactsCamp {
  ContactsCamp: number,
  NameText: string,
  NameTextMapHash: number,
  SortId: number,
}

export interface MessageContactsCondition {
  Id: number,
  FakeContactId: number,
  FrozenMissionCondition: number,
  TruthMissionCondition: number,
}

export interface MessageContactsConfig {
  Id: number,

  NameText: string,
  NameTextMapHash: number,
  SignatureText: string,
  SignatureTextMapHash: number,

  ContactsCamp: number,
  ContactsType: number,
  IconPath: string,
}

export interface MessageContactsType {
  ContactsType: number,
  NameText: string,
  NameTextMapHash: number,
  SortId: number,
}
export interface MessageGroupConfig {
  ActivityModuleId: number,
  Id: number,
  MessageContactsId: number,
  MessageSectionIdList: number[],
}

export type MessageItemType = 'Image' | 'Raid' | 'Sticker' | 'Text';
export type MessageItemSender = 'NPC' | 'Player' | 'PlayerAuto' | 'System';

export interface MessageItemConfig {
  Id: number,
  ContactsId: number,

  ItemType: MessageItemType,
  ItemContentId?: number,

  MainText: string,
  MainTextMapHash: number,

  OptionText: string,
  OptionTextMapHash: number,

  NextItemIdList: number[],
  SectionId: number,
  Sender: MessageItemSender,
}

export interface MessageItemImage {
  Id: number,
  ImagePath: string,
}

export interface MessageItemRaidEntrance {
  Id: number,
  ImagePath: string,
  InvalidMissionList: number[],
  RaidId: number,
}

export interface MessageSectionConfig {
  Id: number,
  StartMessageItemIdList: number[],
  IsPerformMessage?: boolean,
  MainMissionLink?: number,
}

export interface MessageStateIcon {
  Id: string,
  IconPath: string,
}
