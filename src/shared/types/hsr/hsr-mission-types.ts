export type MainMissionTypeEnum = 'Branch' | 'Companion' | 'Daily' | 'Main';

export type MainMissionBeginOperation = 'And';
export type MainMissionTakeOperation = 'And' | 'Or';
export type MainMissionBeginParamType = 'Auto' | 'MultiSequence' | 'PlayerLevel';
export type MainMissionTakeParamType = 'Auto' | 'Manual' | 'MultiSequence' | 'MuseumPhaseRenewPointReach' | 'PlayerLevel' | 'SequenceNextDay';

export interface MainMission {
  MainMissionId: number,
  ChapterId: number,
  Type: MainMissionTypeEnum,
  TypeData: MainMissionType,

  // Name:
  NameText: string,
  NameTextMapHash: number,

  // Next:
  NextMainMissionList: never,
  NextTrackMainMission: number,

  // Reward:
  RewardId: number,
  SubRewardList: number[],

  // Begin Param
  BeginOperation: MainMissionBeginOperation,
  BeginParam: { Type: MainMissionBeginParamType, Value?: number }[],

  // Take Op/Param:
  TakeOperation: MainMissionTakeOperation,
  TakeParam: { Type: MainMissionTakeParamType, Value?: number }[],
  TakeTypeA?: never,
  TakeTypeB?: never,

  // Other:
  DisplayPriority: number,
  DisplayRewardId: number,
  IsInRaid: boolean,
  MissionAdvance: number,
  MissionSuspend: number,
  AudioEmotionState: '' | 'State_Tense',
  TrackWeight: number,
}
export interface MainMissionType {
  Type: string,
  TypePriority: number,

  // Name:
  TypeNameText: string,
  TypeNameTextMapHash: number,

  // Colors:
  TypeColor: string,
  TypeChapterColor: string,

  // Icons:
  TypeIcon: string,
  TypeIconMini: string,
  MenuItemIcon: string,
  WaypointIconType: number,
  IsShowRedDot: boolean,
}
export interface MainMissionSchedule {
  MainMissionId: number,
  ActivityModuleId: number,
  HideRemainTime: boolean,
  ScheduleDataId: number,
}
export interface MissionChapterConfig {
  ChapterDescText: string,
  ChapterDescTextMapHash: number,
  ChapterDisplayPriority: number,
  ChapterFigureIconPath: string,
  ChapterIconPath: string,
  ChapterNameText: string,
  ChapterNameTextMapHash: number,
  ChapterType: string,
  FinalMainMission: number,
  Id: number,
  OriginMainMission: number,
  StageNameText: string,
  StageNameTextMapHash: number,
}
export interface ScheduleDataMission {
  Id: number,
  BeginTime: string,
  EndTime: string,
}
export interface SubMission {
  SubMissionId: number,

  DescText: string,
  DescTextMapHash: number,

  TargetText: string,
  TargetTextMapHash: number,
}




export type EventMissionType = 'Challenge' | 'Normal';
export type EventMissionTakeType = 'Auto' | 'Client' | 'Manual' | 'SequenceNextDay';

export interface EventMission {
  Id: number,
  Type: EventMissionType,

  TitleText: string,
  TitleTextMapHash: number,

  DescText: string,
  DescTextMapHash: number,

  // Next:
  NextEventMissionList: number[],
  FinishWayId: number,

  // Reward:
  RewardId: number,

  // Take Op/Param:
  TakeType: EventMissionTakeType,
  TakeParamIntList: number[],

  // Other:
  MazeFloorId: number,
  MazePlaneId: number,
  ClearGroupList: never,
  LoadGroupList: never,
  UnLoadGroupList: never,
  MissionJsonPath: string,
}
export interface EventMissionChallenge {
  Id: number,
  IsBeginPrepare: boolean,
  IsCancellable: boolean,
  IsResetable: boolean,
  LimitTime: number,
}

export type FinishWayEventMissionParamType = 'Equal' | 'NoPara';
export type FinishWayEventMissionFinishType = 'ClientProgress' | 'EnterFloor' | 'MessagePerformSectionFinish' | 'PropState' | 'Talk';
export interface FinishWayEventMission {
  Id: number,
  FinishType: FinishWayEventMissionFinishType,
  ParamType: FinishWayEventMissionParamType,
  ParamInt1: number,
  ParamInt2: number,
  ParamInt3: number,
  ParamIntList: never,
  ParamItemList: never,
  ParamStr1: string,
  Progress: number,
}


export interface DailyMissionCount {
  Id: number,
  DailyCount: number,
  DailyMissionType: number,
}

export interface DailyMissionData {
  Id: number,
  DailyMissionType: number,
  GroupId: number,
  IconPath: string,
  QuestId: number,
  UnlockMainMission: number,
}
