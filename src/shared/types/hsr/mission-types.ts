export type MainMissionType = 'Branch' | 'Companion' | 'Daily' | 'Main';

export type MissionConditionType = 'Auto' | 'MultiSequence' | 'PlayerLevel' | 'Sequence' | 'SequenceNextDay';

export interface MainMission {
  AudioEmotionState: string,
  BeginOperation: string,
  BeginParam: { Type: string, Value?: number }[],
  ChapterId: number,
  DisplayPriority: number,
  DisplayRewardId: number,
  IsInRaid: boolean,
  IsShowRedDot: boolean,
  MainMissionId: number,
  MissionAdvance: number,
  MissionSuspend: number,
  NameHash: number,
  NextMainMissionValueList: never,
  NextTrackMainMission: number,
  RewardId: number,
  SubRewardList: number[],
  SubRewardValueList: never,
  TakeOperation: string,
  TakeParamAInt1: number,
  TakeParamAIntList: number[],
  TakeParamAIntValueList: never,
  TakeParamBInt1: number,
  TakeParamBIntValueList: never,
  TakeTypeA: string,
  TakeTypeB?: string,
  TrackWeight: number,
  Type: string,
}
