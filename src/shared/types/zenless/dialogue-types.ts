export const NodeTypeIdToName = {
  0:                   'Normal',
  1:               'Transition',
  2:         'CustomTransition',
  3:                   'Action',
  7:              'JumpChapter',
  9:                 'LookAtIK',
  10:            'PlayAnimation',
  14:              'SetSpecials',
  15:              'BlackScreen',
  17:    'SetExitChatTransition',
  19:  'ShowUIGeneralIntimacyUp',
  20:         'BranchMultiInput',
  21:              'Show3DModel',
  23:               'QuestTrack',
  24:           'QuestRecommend',
  25:          'LocalTransition', // TODO
  26:             'ChangeActors',
  27:               'RandomNext',
  28:             'RandomChoice',
  29:    'TransitionWithActions',
  30:         'ShowConfirmPopup',
  31:                   'ShowUI',
  32:             'PlayTimeline',
  33:                  'CloseUI', // TODO
  34:           'SyncServerData',
  35:                'PlayVoice',
  36:           'MiniGameRecord',
  37:            'ChangeNpcName',
  38:                    'Delay',
  39:            'MainCityGraph',
  40:                'Condition',
  41:             'ModifyCamera', // TODO
};

export const NodeTypeNameToId = {
  Normal:                   0,
  Transition:               1,
  CustomTransition:         2,
  Action:                   3,
  JumpChapter:              7,
  LookAtIK:                 9,
  PlayAnimation:            10,
  SetSpecials:              14,
  BlackScreen:              15,
  SetExitChatTransition:    17,
  ShowUIGeneralIntimacyUp:  19,
  BranchMultiInput:         20,
  Show3DModel:              21,
  QuestTrack:               23,
  QuestRecommend:           24,
  LocalTransition:          25, // TODO
  ChangeActors:             26,
  RandomNext:               27,
  RandomChoice:             28,
  TransitionWithActions:    29,
  ShowConfirmPopup:         30,
  ShowUI:                   31,
  PlayTimeline:             32,
  CloseUI:                  33, // TODO
  SyncServerData:           34,
  PlayVoice:                35,
  MiniGameRecord:           36,
  ChangeNpcName:            37,
  Delay:                    38,
  MainCityGraph:            39,
  Condition:                40,
  ModifyCamera:             41, // TODO
};

export type PerformTemplateTb = {
  Id: number,
  FemalePath: string,
  MalePath: string,
}

export type DialogueNode = DialogueNodeBase & (
  DialogueNode0   |
  DialogueNode1   |
  DialogueNode2   |
  DialogueNode3   |
  DialogueNode7   |
  DialogueNode9   |
  DialogueNode10  |
  DialogueNode14  |
  DialogueNode15  |
  DialogueNode17  |
  DialogueNode19  |
  DialogueNode20  |
  DialogueNode21  |
  DialogueNode23  |
  DialogueNode24  |
  DialogueNode26  |
  DialogueNode27  |
  DialogueNode28  |
  DialogueNode29  |
  DialogueNode30  |
  DialogueNode31  |
  DialogueNode32  |
  DialogueNode34  |
  DialogueNode35  |
  DialogueNode36  |
  DialogueNode37  |
  DialogueNode38  |
  DialogueNode39  |
  DialogueNode40  );

type DialogueNodeBase = {
  // These are all custom properties, not from original data:
  NodeId: string, // Computed via: `${scriptConfigFileName}_${sectionIndex}_${nodeIndex}`
  NextNodeId?: string,
  ScriptConfigName: string, // file name of the 'Data/ScriptConfig' story sections json file
  ScriptConfigNodeIndex: number,
  ScriptConfigSectionIndex: number,
  Recurse?: boolean,
  Branches?: DialogueNode[][]
};

/**
 * Normal
 */
export type DialogueNode0 = {
  NodeType: 0,
  ActionDelay: number,
  ActionType: number,
  AutoDoNext: boolean,
  AvatarId: number,           // SPEAKER ID
  AvatarNameKey: string,
  AvatarNameText?: string,    // SPEAKER TEXT
  AvatarShowingKey: string,
  CallType: number,
  DialogueKey: string,
  DialogueText?: string,      // CONTENT TEXT
  EffectKey: string,
  EffectType: number,
  ExternalVoiceKey: string,
  HideAvatarName: boolean,
  IsEndByKey: boolean,
  IsInterruptType: boolean,
  IsOneFrameEnd: boolean,
  NodeMark: DialogueNodeMark,
  NpcLocation: number,
  ShaderCustomType: number,
  ShowBlackMask: boolean,
  SoundEvent: string,
  SpeakSpeed: number,
  Time: number,
  TriggerOnFinish: boolean,
};

/**
 * Transition
 */
export type DialogueNode1 = {
  NodeType: 1,
  NodeMark: DialogueNodeMark,
  TransitionList: DialogueNodeTransition1[],  // TRANSITIONS
};

export interface DialogueNodeGenericTransition {
  BindSectionIndex: number,
  BindNodeIndex: number,
  NextNodeId: string
}

export interface DialogueNodeTransition1 extends DialogueNodeGenericTransition{
  BindSectionIndex: number,
  BindNodeIndex: number,
  IconId?: number,
  TextKey?: string,
  Text?: string,
  NextNodeId: string
}

/**
 * Custom Transition
 */
export type DialogueNode2 = {
  NodeType: 2,
  ShowChatWindow: boolean,
};

/**
 * Action
 */
export type DialogueNode3 = {
  NodeType: 3,
  ActionList: DialogueNode3Action[],
  NodeMark: DialogueNodeMark,
};

export type DialogueNode3Action =
  { AvatarId: number, Location: number, AvatarNameKey?: string } |
  { Slot: number, ShowName: string };

/**
 * Jump Chapter
 */
export type DialogueNode7 = {
  NodeType: 7,
  ChapterIndex: number,
  SubIndex: number,
};


/**
 * LookAtIK
 */
export type DialogueNode9 = {
  NodeType: 9,
  AvatarId: number,
  Enable: boolean,
  IKParam: number,
  IKType: number,
  NodeMark: DialogueNodeMark,
};

/**
 * PlayAnimation
 */
export type DialogueNode10 = {
  NodeType: 10,
  AvatarId: number,
  TemplateId: number,
};

/**
 * SetSpecials
 */
export type DialogueNode14 = {
  NodeType: 14,
  NodeMark: DialogueNodeMark,
  Specials: DialogueNode14Special[],
};

export type DialogueNode14Special = {
  Name: string,
  Value: number,
};

/**
 * BlackScreen
 */
export type DialogueNode15 = {
  NodeType: 15,

  DialogueKeys: string[],
  DialogueTexts: string[],        // CONTENT TEXT

  NodeMark: DialogueNodeMark,
  SoundEvent: string,
  SpeakSpeed: number,
  Delay: number,
};


/**
 * SetExitChatTransition
 */
export type DialogueNode17 = {
  NodeType: 17,
  NodeMark: DialogueNodeMark,
  TransitionId: number,
};

/**
 * ShowUIGeneralIntimacyUp
 */
export type DialogueNode19 = {
  NodeType: 19,
  CurTrustLevel: number[],
  ModTrustType: number,
  NodeMark: DialogueNodeMark,
  PartnerId: number,
  UsePopShowModel: boolean,
};

/**
 * BranchMultiInput
 */
export type DialogueNode20 = {
  NodeType: 20,
  FromIndexList: number[][],
  Failure: DialogueNodeTransition20, // TRANSITIONS
  Success: DialogueNodeTransition20, // TRANSITIONS
};

export interface DialogueNodeTransition20 extends DialogueNodeGenericTransition {
  BindSectionIndex: number,
  BindNodeIndex: number
}

/**
 * Show3DModel
 */
export type DialogueNode21 = {
  NodeType: 21,
  ConfigType: number,
  ModelId: number,
  NodeMark: DialogueNodeMark,
};

/**
 * QuestTrack
 */
export type DialogueNode23 = {
  NodeType: 23,
  QuestList: DialogueNode23QuestItem[]
};

export type DialogueNode23QuestItem = {
  BindSectionIndex: number,
  BindNodeIndex: number,
  QuestId: number
};


/**
 * QuestRecommend
 */
export type DialogueNode24 = {
  NodeType: 24,
};


/**
 * ChangeActors
 */
export type DialogueNode26 = {
  NodeType: 26,
  CameraX: number,
  CameraY: number,
  Params: { TagId: number, IsVisible: boolean }[],
  ResetCamera: boolean,
  TargetTag: number,
  TransformKey: string,
  TransitionId: number,
};

/**
 * RandomNext
 */
export type DialogueNode27 = {
  NodeType: 27,
  NextList: DialogueNodeTransition27[] // TRANSITIONS
};

export interface DialogueNodeTransition27 extends DialogueNodeGenericTransition {
  BindSectionIndex: number,
  BindNodeIndex: number
}

/**
 * RandomChoice
 */
export type DialogueNode28 = {
  NodeType: 28,
  TransitionList: DialogueNodeTransition28[], // TRANSITIONS
};

export interface DialogueNodeTransition28 extends DialogueNodeGenericTransition {
  BindSectionIndex: number,
  BindNodeIndex: number,
  IconId: number,
  TextKey: string,
  Text?: string,
  GroupId: number,
  NextNodeId: string
}

/**
 * TransitionWithActions
 */
export type DialogueNode29 = {
  NodeType: 29,
  Cfg: DialogueNode29Cfg,
  NodeMark: DialogueNodeMark,
};

export type DialogueNode29Cfg = {
  IsBegin: boolean,
  IsEnd: boolean,
  SoundEvent?: string,
  OnlyActions: boolean,
  IsTransition: boolean,
  DialogueKey?: string,
  DialogueText?: string, // CONTENT TEXT
  DialogueDelay: number,
  TransitionId: number,
  SetTagVisible: boolean,
  Params: { TagId: number, IsVisible: boolean }[],
  ResetCamera: boolean,
  TargetTag: number,
  CameraX: number,
  CameraY: number,
  SetPlayerTransform: boolean,
  PlayerPos: number[],
  PlayerRot: number[],
  TransformKey?: string,
  SetClientNpcTransform: boolean,
  ClientNpcTag: number,
  ClientNpcTransformKey?: string,
  ResetCamera1: boolean,
  CameraParam?: {
    CameraPos: number[],
    CameraRot: number[],
    Fov: number,
    Target: number
  },
  ModifyTime: boolean,
  ModType: number,
  Minute: number,
  TimePeriodNum: number,
  DayOfWeek: number,
  TimePeriod: number
};

/**
 * ShowConfirmPopup
 */
export type DialogueNode30 = {
  NodeType: 30,

  CancelBtnDesc: string,
  CancelBtnDescText?: string, // CONTENT TEXT

  ConfirmBtnDesc: string,
  ConfirmBtnDescText?: string, // CONTENT TEXT

  Description: string,
  DescriptionText?: string, // CONTENT TEXT

  DescriptionDetail: string,
  DescriptionDetailText?: string, // CONTENT TEXT

  OnCancelNext: DialogueNodeTransition30, // TRANSITIONS
  OnConfirmNext: DialogueNodeTransition30, // TRANSITIONS
};

export interface DialogueNodeTransition30 extends DialogueNodeGenericTransition {
  BindSectionIndex: number,
  BindNodeIndex: number
}

/**
 * ShowUI
 */
export type DialogueNode31 = {
  NodeType: 31,
  Config: DialogueNode31Cfg,
  TransitionList: DialogueNodeTransition31[], // TRANSITIONS
};

export type DialogueNode31Cfg = {
  CountDownSeconds: number,
  ConfigCameraBezierSurface: string,
  MainCityGameUIConfigGameId: number,
  IsHideCameraMove: boolean,
  PhotoGameId: number,
  PhotoCheckInterval: number,
  NotChangeBGM: boolean,
  ItemConfigId: number,
  GameId: number,
  NpcId: number,
  StoreConfigId: number,
  FadeInTime: number,
  FadeOutTime: number,
  PostId: number,
  DisableCameraAndAnimation: boolean,
  Camera2: string,
  CameraStoryKey: string,
  PlayAnimationId: number,
  OverrideCameraNearClip: number,
  OpenNoise: boolean,
  NoisePath: string,
  NoiseAmplitudeGain: number,
  NoiseFrequencyGain: number,
  NoiseDuration: number,
  StartNodeId: number,
  EndNodeId: number,
  MessageGroupId: number,
  RelLocalAvatar: boolean,
  PlayAnimationIdF: number
};

export interface DialogueNodeTransition31 extends DialogueNodeGenericTransition {
  BindSectionIndex: number,
  BindNodeIndex: number,
  NextNodeId: string
}

/**
 * PlayTimeline
 */
export type DialogueNode32 = {
  NodeType: 32,
  IsStop: boolean,
  TimelineKey: string,
  WaitFinish: boolean,
};

/**
 * SyncServerData
 */
export type DialogueNode34 = {
  NodeType: 34,
  Config: { MessageGroupId: number },
};


/**
 * PlayVoice
 */
export type DialogueNode35 = {
  NodeType: 35,
  VoiceKey: string,
};


/**
 * MiniGameRecord
 */
export type DialogueNode36 = {
  NodeType: 36,
  GameId: number,
  State: number,
};


/**
 * ChangeNpcName
 */
export type DialogueNode37 = {
  NodeType: 37,
  TagId: number,
  NameKey: string,
  NameText?: string, // SPEAKER TEXT
};


/**
 * Delay
 */
export type DialogueNode38 = {
  NodeType: 38,
  DelayTime: number,
};


/**
 * MainCityGraph
 */
export type DialogueNode39 = {
  NodeType: 39,
  GraphId: number,
  IsStart: boolean,
  NodeMark: DialogueNodeMark,
};

/**
 * Condition
 */
export type DialogueNode40 = {
  NodeType: 40,
  NodeMark: DialogueNodeMark,
  ConditionKey: string,
  ConditionList: DialogueNode40Condition[], // TRANSITIONS (maybe?)
};

export interface DialogueNode40Condition extends DialogueNodeGenericTransition {
  Value: number,
  BindSectionIndex: number,
  BindNodeIndex: number
}

export type DialogueNodeMark =
  '0'                                                         |
  '{C#1}'                                                     |
  '{C#2}'                                                     |
  '{C#3}'                                                     |
  '{C#4}'                                                     |
  '{M#10}{A#Tool}'                                            |
  '{M#10}{O#Tool}'                                            |
  '{M#11}{A#Tool}'                                            |
  '{M#11}{O#Tool}'                                            |
  '{M#12}{A#Tool}'                                            |
  '{M#12}{O#Tool}'                                            |
  '{M#13}{A#Tool}'                                            |
  '{M#13}{O#Tool}'                                            |
  '{M#14}{A#Tool}'                                            |
  '{M#14}{O#Tool}'                                            |
  '{M#14}{O#Tool}{O#Keep}'                                    |
  '{M#15}{A#Tool}'                                            |
  '{M#15}{O#Tool}'                                            |
  '{M#16}{A#Tool}'                                            |
  '{M#16}{O#Tool}'                                            |
  '{M#17}{A#Tool}'                                            |
  '{M#17}{O#Tool}'                                            |
  '{M#18}{A#Tool}'                                            |
  '{M#18}{O#Tool}'                                            |
  '{M#19}{A#Tool}'                                            |
  '{M#19}{O#Tool}'                                            |
  '{M#1}{A#Tool}'                                             |
  '{M#1}{O#Tool}'                                             |
  '{M#1}{O#Tool}{O#Keep}'                                     |
  '{M#20}{A#Tool}'                                            |
  '{M#20}{O#Tool}'                                            |
  '{M#21}{A#Tool}'                                            |
  '{M#21}{O#Tool}'                                            |
  '{M#22}{A#Tool}'                                            |
  '{M#22}{O#Tool}'                                            |
  '{M#23}{A#Tool}'                                            |
  '{M#23}{O#Tool}'                                            |
  '{M#24}{A#Tool}'                                            |
  '{M#24}{O#Tool}'                                            |
  '{M#25}{A#Tool}'                                            |
  '{M#25}{O#Tool}'                                            |
  '{M#26}{A#Tool}'                                            |
  '{M#26}{O#Tool}'                                            |
  '{M#27}{A#Tool}'                                            |
  '{M#27}{O#Tool}'                                            |
  '{M#28}{A#Tool}'                                            |
  '{M#28}{O#Tool}'                                            |
  '{M#29}{A#Tool}'                                            |
  '{M#29}{O#Tool}'                                            |
  '{M#2}{A#Tool}'                                             |
  '{M#2}{O#Tool}'                                             |
  '{M#30}{A#Tool}'                                            |
  '{M#30}{O#Tool}'                                            |
  '{M#31}{A#Tool}'                                            |
  '{M#31}{O#Tool}'                                            |
  '{M#32}{A#Tool}'                                            |
  '{M#32}{O#Tool}'                                            |
  '{M#33}{A#Tool}'                                            |
  '{M#33}{O#Tool}'                                            |
  '{M#34}{A#Tool}'                                            |
  '{M#34}{O#Tool}'                                            |
  '{M#35}{A#Tool}'                                            |
  '{M#35}{O#Tool}'                                            |
  '{M#36}{A#Tool}'                                            |
  '{M#36}{O#Tool}'                                            |
  '{M#37}{A#Tool}'                                            |
  '{M#37}{O#Tool}'                                            |
  '{M#38}{A#Tool}'                                            |
  '{M#38}{O#Tool}'                                            |
  '{M#39}{A#Tool}'                                            |
  '{M#39}{O#Tool}'                                            |
  '{M#3}{A#Tool}'                                             |
  '{M#3}{O#Tool}'                                             |
  '{M#40}{A#Tool}'                                            |
  '{M#40}{O#Tool}'                                            |
  '{M#41}{A#Tool}'                                            |
  '{M#41}{O#Tool}'                                            |
  '{M#42}{A#Tool}'                                            |
  '{M#42}{O#Tool}'                                            |
  '{M#43}{A#Tool}'                                            |
  '{M#43}{O#Tool}'                                            |
  '{M#44}{A#Tool}'                                            |
  '{M#44}{O#Tool}'                                            |
  '{M#45}{A#Tool}'                                            |
  '{M#45}{O#Tool}'                                            |
  '{M#46}{A#Tool}'                                            |
  '{M#46}{O#Tool}'                                            |
  '{M#47}{A#Tool}'                                            |
  '{M#47}{O#Tool}'                                            |
  '{M#48}{A#Tool}'                                            |
  '{M#48}{O#Tool}'                                            |
  '{M#49}{A#Tool}'                                            |
  '{M#49}{O#Tool}'                                            |
  '{M#4}{A#Tool}'                                             |
  '{M#4}{O#Tool}'                                             |
  '{M#4}{O#Tool}{O#Keep}'                                     |
  '{M#50}{O#Tool}'                                            |
  '{M#51}{O#Tool}'                                            |
  '{M#52}{O#Tool}'                                            |
  '{M#53}{O#Tool}'                                            |
  '{M#54}{O#Tool}'                                            |
  '{M#55}{O#Tool}'                                            |
  '{M#56}{O#Tool}'                                            |
  '{M#57}{O#Tool}'                                            |
  '{M#58}{O#Tool}'                                            |
  '{M#59}{O#Tool}'                                            |
  '{M#5}{A#Tool}'                                             |
  '{M#5}{O#Tool}'                                             |
  '{M#60}{O#Tool}'                                            |
  '{M#61}{O#Tool}'                                            |
  '{M#62}{O#Tool}'                                            |
  '{M#63}{O#Tool}'                                            |
  '{M#64}{O#Tool}'                                            |
  '{M#65}{O#Tool}'                                            |
  '{M#66}{O#Tool}'                                            |
  '{M#67}{O#Tool}'                                            |
  '{M#68}{O#Tool}'                                            |
  '{M#69}{O#Tool}'                                            |
  '{M#6}{A#Tool}'                                             |
  '{M#6}{O#Tool}'                                             |
  '{M#70}{O#Tool}'                                            |
  '{M#71}{O#Tool}'                                            |
  '{M#72}{O#Tool}'                                            |
  '{M#73}{O#Tool}'                                            |
  '{M#74}{O#Tool}'                                            |
  '{M#76}{O#Tool}'                                            |
  '{M#7}{A#Tool}'                                             |
  '{M#7}{O#Tool}'                                             |
  '{M#801}{O#Tool}'                                           |
  '{M#8}{A#Tool}'                                             |
  '{M#8}{O#Tool}'                                             |
  '{M#8}{O#Tool}{O#Keep}'                                     |
  '{M#91}{O#Tool}'                                            |
  '{M#92}{O#Tool}'                                            |
  '{M#93}{O#Tool}'                                            |
  '{M#94}{O#Tool}'                                            |
  '{M#95}{O#Tool}'                                            |
  '{M#9}{A#Tool}'                                             |
  '{M#9}{O#Tool}'                                             |
  '{O#Ignore}{O#Tool}'                                        |
  '{O#Ignore}{O#Tool}{O#Keep}'                                |
  '{P#Before}'                                                |
  '{P#Ignore}{A#Tool}'                                        |
  '{S#10}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#10}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#11}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#11}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#11}{P#Before}{T#ChatEditorLookIKNode-1}{A#Tool}'        |
  '{S#11}{P#Before}{T#ChatEditorLookIKNode-2}{A#Tool}'        |
  '{S#12}{P#After}{T#ChatEditorLookIKNode-1}{O#Tool}'         |
  '{S#12}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#12}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#12}{P#Before}{T#ChatEditorLookIKNode-1}{A#Tool}'        |
  '{S#12}{P#Before}{T#ChatEditorLookIKNode-1}{O#Tool}'        |
  '{S#13}{P#After}{T#ChatEditorLookIKNode-1}{A#Tool}'         |
  '{S#13}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#13}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#14}{P#After}{T#ChatEditorLookIKNode-1}{O#Tool}'         |
  '{S#14}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#14}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#14}{P#Before}{T#ChatEditorLookIKNode-1}{O#Tool}'        |
  '{S#15}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#15}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#16}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#16}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#17}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#17}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#18}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#18}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#19}{P#After}{T#ChatEditorLookIKNode-1}{O#Tool}'         |
  '{S#19}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#19}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#19}{P#Before}{T#ChatEditorLookIKNode-1}{O#Tool}'        |
  '{S#1}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'     |
  '{S#1}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'     |
  '{S#1}{P#Before}{T#ChatEditorLookIKNode-1}{A#Tool}'         |
  '{S#1}{P#Before}{T#ChatEditorLookIKNode-1}{O#Tool}'         |
  '{S#1}{P#Before}{T#ChatEditorLookIKNode-1}{O#Tool}{O#Keep}' |
  '{S#1}{P#Before}{T#ChatEditorLookIKNode-2}{A#Tool}'         |
  '{S#1}{P#Before}{T#ChatEditorLookIKNode-2}{O#Tool}'         |
  '{S#20}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#20}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#21}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#21}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#22}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#22}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#23}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#23}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#24}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#24}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#25}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#25}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#26}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#26}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#27}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#27}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#28}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#28}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#29}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#29}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#2}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'     |
  '{S#2}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'     |
  '{S#2}{P#Before}{T#ChatEditorLookIKNode-1}{A#Tool}'         |
  '{S#2}{P#Before}{T#ChatEditorLookIKNode-1}{O#Tool}'         |
  '{S#30}{P#After}{T#ChatEditorLookIKNode-1}{O#Tool}'         |
  '{S#30}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#30}{P#Before}{T#ChatEditorLookIKNode-1}{O#Tool}'        |
  '{S#31}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#32}{P#After}{T#ChatEditorLookIKNode-1}{O#Tool}'         |
  '{S#32}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#32}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#33}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#33}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#34}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#35}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#36}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#36}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#37}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#37}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#38}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#38}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#39}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#3}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'     |
  '{S#3}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'     |
  '{S#3}{P#Before}{T#ChatEditorLookIKNode-1}{O#Tool}'         |
  '{S#40}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#40}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#41}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#41}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#42}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#43}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#43}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#44}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#45}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#46}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#46}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#47}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'    |
  '{S#48}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#49}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#4}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'     |
  '{S#4}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'     |
  '{S#52}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#53}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#55}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#56}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#59}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#5}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'     |
  '{S#5}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'     |
  '{S#5}{P#Before}{T#ChatEditorLookIKNode-1}{A#Tool}'         |
  '{S#5}{P#Before}{T#ChatEditorLookIKNode-1}{O#Tool}'         |
  '{S#5}{P#Before}{T#ChatEditorLookIKNode-2}{O#Tool}'         |
  '{S#60}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#64}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#66}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'    |
  '{S#6}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'     |
  '{S#6}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'     |
  '{S#6}{P#Before}{T#ChatEditorLookIKNode-1}{O#Tool}'         |
  '{S#7}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'     |
  '{S#7}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'     |
  '{S#7}{P#Before}{T#ChatEditorLookIKNode-1}{O#Tool}'         |
  '{S#8}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'     |
  '{S#8}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'     |
  '{S#91}{P#Before}{T#ChatEditorLookIKNode-1}{O#Tool}'        |
  '{S#9}{P#After}{T#ChatEditorLookIKNode-1}{A#Tool}'          |
  '{S#9}{P#Before}{T#ChatEditorActionPlayNode-1}{A#Tool}'     |
  '{S#9}{P#Before}{T#ChatEditorActionPlayNode-1}{O#Tool}'     ;
