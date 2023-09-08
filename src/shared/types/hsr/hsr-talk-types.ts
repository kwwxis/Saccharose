export type TalkParaType = 'BETWEEN' | 'GREATEQUAL' | 'LOWER' | 'LOWEREQUAL';

export interface TalkBehavior {
  BehaviorType: number,
  CurrencyItem: number,
  CustomString: string,
  Id: number,
  ParaInt: number,
  ParaList: number[],
  ParaType: TalkParaType,
}
export interface TalkReward {
  FloorId: number,
  GroupId: number,
  Id: number,
  NPCConfigId: number,
  PlaneId: number,
  RewardId: number,
  VerificationId: number,
}
export interface TalkSentenceConfig {
  TalkSentenceId: number,

  TalkSentenceTextMapHash: number,
  TalkSentenceText: string,

  TextmapTalkSentenceNameTextMapHash: number,
  TextmapTalkSentenceNameText: string,

  VoiceId: number,
}
export interface TalkSentenceMultiVoice {
  TalkSentenceId: number,
  VoiceIdList: number[],
}
export interface TutorialGuideTalkData {
  AvatarHeadIcon: string,
  Id: number,
  TalkDataText: string,
  TalkDataTextMapHash: number,
}

export type VoiceType =
  'Archive' |
  'BroadcastFar' |
  'BroadcastNear' |
  'BroadcastNormal' |
  'Cutscene' |
  'MissionTalk_3d' |
  'NPC_Far' |
  'NPC_Near' |
  'NPC_Normal';

export interface VoiceConfig {
  IsPlayerInvolved: boolean,
  VoiceId: number,
  VoicePath: string,
  VoiceType?: VoiceType,
}