export interface NewActivityEntryConfigData {
  Id: number,
  ActivityType: string,
  TabNameText: string,
  TabNameTextMapHash: number,
  SortPriority: number,

  TabIcon: string,
  Duration: number,
  BannerPath: string,
  BannerEffect: string,
}

export interface NewActivityExcelConfigData {
  ActivityId: number,
  ActivityType: string,
  NameTextMapHash: number,
  NameText: string,

  CondGroupId: number[],
  WatcherId: number[],
  ActivityCoinIdList: number[],
  DungeonIdList: number[],

  ActivitySceneTag: string,
  IsLoadTerrain: boolean,
  IsBanClientUi: boolean,

  Entry?: NewActivityEntryConfigData,
}