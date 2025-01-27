

export const DialogueNodeTypeMap = {
  BASE_DIALOGUE: 0,
  PLAYER_INPUT: 1,
};

export type PerformTemplateTb = {
  Id: number,
  FemalePath: string,
  MalePath: string,
}

export type DialogueNodeType =
  0   |
  1   |
  2   |
  3   |
  7   |
  9   |
  10  |
  14  |
  15  |
  17  |
  19  |
  20  |
  21  |
  23  |
  24  |
  26  |
  27  |
  28  |
  29  |
  30  |
  31  |
  32  |
  34  |
  35  |
  36  |
  37  |
  38  |
  39  |
  40  ;

export type DialogueNode = {
  // Custom Properties:
  NodeId: string,
  ScriptConfigName: string,
  ScriptConfigSectionIndex: number,
  ScriptConfigNodeIndex: number,
  NextNodeId?: string,

  ActionDelay: number,
  ActionList: ({ AvatarId: number, Location: number, AvatarNameKey: string }|{ AvatarId: number, Location: number, AvatarNameKey?: never }|{ AvatarId: number, Location: number, AvatarNameKey?: string }|{ Slot: number, ShowName: string })[],
  ActionList_Text: never,
  ActionType: number,
  AutoDoNext: boolean,
  AvatarId: number,
  AvatarNameKey: string,
  AvatarNameText: string,
  AvatarShowingKey: string,
  CallType: number,
  CameraX: number,
  CameraY: number,
  CancelBtnDesc: string,
  CancelBtnDescText: string,
  Cfg: { IsBegin: boolean, IsEnd: boolean, SoundEvent?: string, OnlyActions: boolean, IsTransition: boolean, DialogueKey?: string, DialogueDelay: number, TransitionId: number, SetTagVisible: boolean, Params: { TagId: number, IsVisible: boolean }[], ResetCamera:
      boolean, TargetTag: number, CameraX: number, CameraY: number, SetPlayerTransform: boolean, PlayerPos: number[], PlayerRot: number[], TransformKey?: string, SetClientNpcTransform: boolean, ClientNpcTag: number, ClientNpcTransformKey?: string, ResetCamera1: boolean, CameraParam?: { CameraPos: number[], CameraRot: number[], Fov: number, Target: number }, ModifyTime: boolean, ModType: number, Minute: number, TimePeriodNum: number, DayOfWeek: number, TimePeriod: number },
  ChapterIndex: number,
  ConditionKey: string,
  ConditionList: { Value: number, BindSectionIndex: number, BindNodeIndex: number }[],
  Config: { CountDownSeconds: number, ConfigCameraBezierSurface: string, MainCityGameUIConfigGameId: number, IsHideCameraMove: boolean, PhotoGameId: number, PhotoCheckInterval: number, NotChangeBGM: boolean, ItemConfigId: number, GameId: number, NpcId: number, S
    toreConfigId: number, FadeInTime: number, FadeOutTime: number, PostId: number, DisableCameraAndAnimation: boolean, Camera2: string, CameraStoryKey: string, PlayAnimationId: number, OverrideCameraNearClip: number, OpenNoise: boolean, NoisePath: string, NoiseAmplitudeGain: number, NoiseFrequencyGain: number, NoiseDuration: number, StartNodeId: number, EndNodeId: number, MessageGroupId: number, RelLocalAvatar: boolean, PlayAnimationIdF: number },
  ConfigType: number,
  ConfirmBtnDesc: string,
  ConfirmBtnDescText: string,
  CurTrustLevel: number[],
  Delay: number,
  DelayTime: number,
  Description: string,
  DescriptionDetail: string,
  DescriptionDetailText: string,
  DescriptionText: string,

  DialogueKey: string,
  DialogueText: string,
  DialogueKeys: string[],
  DialogueTexts: string,

  EffectKey: string,
  EffectType: number,
  Enable: boolean,
  ExternalVoiceKey: string,
  Failure: { BindSectionIndex: number, BindNodeIndex: number },
  FromIndexList: number[][],
  GameId: number,
  GraphId: number,
  HideAvatarName: boolean,
  IKParam: number,
  IKType: number,
  IsEndByKey: boolean,
  IsInterruptType: boolean,
  IsOneFrameEnd: boolean,
  IsStart: boolean,
  IsStop: boolean,
  ModTrustType: number,
  ModelId: number,
  NameKey: string,
  NameText: string,
  NextList: { BindSectionIndex: number, BindNodeIndex: number }[],
  NodeMark: string,
  NodeType: DialogueNodeType,
  NpcLocation: number,
  OnCancelNext: { BindSectionIndex: number, BindNodeIndex: number },
  OnConfirmNext: { BindSectionIndex: number, BindNodeIndex: number },
  Params: { TagId: number, IsVisible: boolean }[],
  PartnerId: number,
  QuestList: { BindSectionIndex: number, BindNodeIndex: number, QuestId: number }[],
  ResetCamera: boolean,
  ShaderCustomType: number,
  ShowBlackMask: boolean,
  ShowChatWindow: boolean,
  SoundEvent: string,
  SpeakSpeed: number,
  Specials: { Name: string, Value: number }[],
  State: number,
  SubIndex: number,
  Success: { BindSectionIndex: number, BindNodeIndex: number },
  TagId: number,
  TargetTag: number,
  TemplateId: number,
  Time: number,
  TimelineKey: string,
  TransformKey: string,
  TransitionId: number,
  TransitionList?: DialogueTransition[],
  TriggerOnFinish: boolean,
  UsePopShowModel: boolean,
  VoiceKey: string,
  WaitFinish: boolean,
}

export type DialogueTransition = {
  BindSectionIndex: number,
  BindNodeIndex: number,
  IconId?: number,
  TextKey?: string,
  NextNodeId: string,
  GroupId?: number,
};


export type DialogueNodeBase = {
  ScriptConfigName: string,
  ScriptConfigNodeIndex: number,
  ScriptConfigSectionIndex: number,
}

export interface DialogueNode0 {
  NodeType: 0,
  ActionDelay: number,
  ActionType: number,
  AutoDoNext: boolean,
  AvatarId: number,
  AvatarNameKey: string,
  AvatarNameText: string,
  AvatarShowingKey: string,
  CallType: number,
  DialogueKey: string,
  DialogueText: string,
  EffectKey: string,
  EffectType: number,
  ExternalVoiceKey: string,
  HideAvatarName: boolean,
  IsEndByKey: boolean,
  IsInterruptType: boolean,
  IsOneFrameEnd: boolean,
  NextNodeId: string,
  NodeId: string,
  NodeMark: string,
  NpcLocation: number,
  ShaderCustomType: number,
  ShowBlackMask: boolean,
  SoundEvent: string,
  SpeakSpeed: number,
  Time: number,
  TriggerOnFinish: boolean,
}
