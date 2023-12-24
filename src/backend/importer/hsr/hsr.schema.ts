import { plainLineMapSchema, SchemaTable, textMapSchema } from '../import_db.ts';

export const starRailSchema = {

  // region TextMap & PlainLineMap
  // -----------------------------
  TextMapCHS: textMapSchema('CHS'),
  TextMapCHT: textMapSchema('CHT'),
  TextMapDE: textMapSchema('DE'),
  TextMapEN: textMapSchema('EN'),
  TextMapES: textMapSchema('ES'),
  TextMapFR: textMapSchema('FR'),
  TextMapID: textMapSchema('ID'),
  TextMapJP: textMapSchema('JP'),
  TextMapKR: textMapSchema('KR'),
  TextMapPT: textMapSchema('PT'),
  TextMapRU: textMapSchema('RU'),
  TextMapTH: textMapSchema('TH'),
  TextMapVI: textMapSchema('VI'),

  PlainLineMapCHS: plainLineMapSchema('CHS'),
  PlainLineMapCHT: plainLineMapSchema('CHT'),
  PlainLineMapDE: plainLineMapSchema('DE'),
  PlainLineMapEN: plainLineMapSchema('EN'),
  PlainLineMapES: plainLineMapSchema('ES'),
  PlainLineMapFR: plainLineMapSchema('FR'),
  PlainLineMapID: plainLineMapSchema('ID'),
  PlainLineMapJP: plainLineMapSchema('JP'),
  PlainLineMapKR: plainLineMapSchema('KR'),
  PlainLineMapPT: plainLineMapSchema('PT'),
  PlainLineMapRU: plainLineMapSchema('RU'),
  PlainLineMapTH: plainLineMapSchema('TH'),
  PlainLineMapVI: plainLineMapSchema('VI'),
  // endregion

  // region Avatar & Voice
  // ---------------------
  AvatarConfig: <SchemaTable> {
    name: 'AvatarConfig',
    jsonFile: './ExcelOutput/AvatarConfig.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'BaseType', type: 'string', isIndex: true},
      {name: 'DamageType', type: 'string', isIndex: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
      {name: 'FullNameTextMapHash', type: 'integer', isIndex: true},
      {name: 'CutinIntroTextMapHash', type: 'integer', isIndex: true},
    ],
    renameFields: {
      'AvatarId': 'Id',
      'AvatarBaseType': 'BaseType',
      'AvatarVOTag': 'VOTag',
      'AvatarNameTextMapHash': 'NameTextMapHash',
      'AvatarDescTextMapHash': 'DescTextMapHash',
      'AvatarFullNameTextMapHash': 'FullNameTextMapHash',
      'AvatarCutinIntroTextMapHash': 'CutinIntroTextMapHash',

      'ActionAvatarHeadIconPath': 'ActionHeadIconPath',
      'AvatarMiniIconPath': 'MiniIconPath',
      'AvatarSideIconPath': 'SideIconPath',
      'DefaultAvatarHeadIconPath': 'DefaultHeadIconPath',
      'SideAvatarHeadIconPath': 'SideHeadIconPath',
      'WaitingAvatarHeadIconPath': 'WaitingHeadIconPath',
      'AvatarGachaResultImgPath': 'GachaResultImgPath',
      'AvatarCutinBgImgPath': 'CutinBgImgPath',
      'AvatarCutinFrontImgPath': 'CutinFrontImgPath',
      'AvatarCutinImgPath': 'CutinImgPath',
    }
  },
  AvatarBaseType: <SchemaTable> {
    name: 'AvatarBaseType',
    jsonFile: './ExcelOutput/AvatarBaseType.json',
    columns: [
      {name: 'Id', type: 'string', isPrimary: true},
      {name: 'BaseTypeTextMapHash', type: 'integer', isIndex: true},
      {name: 'BaseTypeDescTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  AvatarVO: <SchemaTable> {
    name: 'AvatarVO',
    jsonFile: './ExcelOutput/AvatarVO.json',
    columns: [
      {name: 'VOTag', type: 'string', isPrimary: true},
    ]
  },
  VoiceAtlas: <SchemaTable> {
    name: 'VoiceAtlas',
    jsonFile: './ExcelOutput/VoiceAtlas.json',
    columns: [
      {name: 'AvatarId', type: 'integer', isIndex: true},
      {name: 'VoiceId', type: 'integer', isIndex: true},
      {name: 'AudioId', type: 'integer', isIndex: true},
      {name: 'VoiceTitleTextMapHash', type: 'integer', isIndex: true},
      {name: 'VoiceMTextMapHash', type: 'integer', isIndex: true},
      {name: 'VoiceFTextMapHash', type: 'integer', isIndex: true},
      {name: 'UnlockDescTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  AtlasUnlockData: <SchemaTable> {
    name: 'AtlasUnlockData',
    jsonFile: './ExcelOutput/AtlasUnlockData.json',
    columns: [
      {name: 'UnlockId', type: 'integer', isPrimary: true},
    ]
  },
  // endregion

  // region Main Mission
  // -------------------
  MainMission: <SchemaTable> {
    name: 'MainMission',
    jsonFile: './ExcelOutput/MainMission.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'Type', type: 'string', isIndex: true},
      {name: 'RewardId', type: 'integer', isIndex: true},
      {name: 'DisplayRewardId', type: 'integer', isIndex: true},
      {name: 'ChapterId', type: 'integer', isIndex: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
    ],
    renameFields: {
      'MainMissionId': 'Id'
    }
  },
  MainMissionSchedule: <SchemaTable> {
    name: 'MainMissionSchedule',
    jsonFile: './ExcelOutput/MainMissionSchedule.json',
    columns: [
      {name: 'MainMissionId', type: 'integer', isPrimary: true},
      {name: 'ActivityModuleId', type: 'integer', isIndex: true},
      {name: 'ScheduleDataId', type: 'integer', isIndex: true},
    ]
  },
  MainMissionType: <SchemaTable> {
    name: 'MainMissionType',
    jsonFile: './ExcelOutput/MainMissionType.json',
    columns: [
      {name: 'Type', type: 'string', isPrimary: true},
      {name: 'TypeNameTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  MissionChapterConfig: <SchemaTable> {
    name: 'MissionChapterConfig',
    jsonFile: './ExcelOutput/MissionChapterConfig.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'ChapterNameTextMapHash', type: 'integer', isIndex: true},
      {name: 'StageNameTextMapHash', type: 'integer', isIndex: true},
      {name: 'ChapterDescTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  ScheduleDataMission: <SchemaTable> {
    name: 'ScheduleDataMission',
    jsonFile: './ExcelOutput/ScheduleDataMission.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
    ]
  },
  SubMission: <SchemaTable> {
    name: 'SubMission',
    jsonFile: './ExcelOutput/SubMission.json',
    columns: [
      {name: 'SubMissionId', type: 'integer', isPrimary: true},
      {name: 'TargetTextMapHash', type: 'integer', isIndex: true},
      {name: 'DescTextMapHash', type: 'integer', isIndex: true},
    ],
    renameFields: {
      'DescrptionText:': 'DescText',
      'DescrptionTextMapHash': 'DescTextMapHash'
    }
  },
  // endregion

  // region Event Mission
  // --------------------
  EventMission: <SchemaTable> {
    name: 'EventMission',
    jsonFile: './ExcelOutput/EventMission.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'Type', type: 'string', isIndex: true},
      {name: 'TakeType', type: 'string', isIndex: true},
      {name: 'FinishWayId', type: 'integer', isIndex: true},
      {name: 'MazePlaneId', type: 'integer', isIndex: true},
      {name: 'MazeFloorId', type: 'integer', isIndex: true},
      {name: 'RewardId', type: 'integer', isIndex: true},
      {name: 'TitleTextMapHash', type: 'integer', isIndex: true},
      {name: 'DescTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  EventMissionChallenge: <SchemaTable> {
    name: 'EventMissionChallenge',
    jsonFile: './ExcelOutput/EventMissionChallenge.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
    ]
  },
  FinishWayEventMission: <SchemaTable> {
    name: 'FinishWayEventMission',
    jsonFile: './ExcelOutput/FinishWayEventMission.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'FinishType', type: 'string', isIndex: true},
      {name: 'ParamType', type: 'string', isIndex: true},
    ]
  },
  // endregion

  // region Daily Mission
  // --------------------
  DailyMissionCount: <SchemaTable> {
    name: 'DailyMissionCount',
    jsonFile: './ExcelOutput/DailyMissionCount.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
    ]
  },
  DailyMissionData: <SchemaTable> {
    name: 'DailyMissionData',
    jsonFile: './ExcelOutput/DailyMissionData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'GroupId', type: 'integer', isIndex: true},
    ]
  },
  // endregion

  // region Talk
  // -----------
  TalkBehavior: <SchemaTable> {
    name: 'TalkBehavior',
    jsonFile: './ExcelOutput/TalkBehavior.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'ParaType', type: 'string', isIndex: true},
    ]
  },
  TalkReward: <SchemaTable> {
    name: 'TalkReward',
    jsonFile: './ExcelOutput/TalkReward.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'PlaneId', type: 'integer', isIndex: true},
      {name: 'FloorId', type: 'integer', isIndex: true},
      {name: 'GroupId', type: 'integer', isIndex: true},
      {name: 'NPCConfigId', type: 'integer', isIndex: true},
      {name: 'RewardId', type: 'integer', isIndex: true},
    ]
  },
  TalkSentenceConfig: <SchemaTable> {
    name: 'TalkSentenceConfig',
    jsonFile: './ExcelOutput/TalkSentenceConfig.json',
    columns: [
      {name: 'TalkSentenceId', type: 'integer', isPrimary: true},
      {name: 'TextmapTalkSentenceNameTextMapHash', type: 'integer', isIndex: true},
      {name: 'TalkSentenceTextMapHash', type: 'integer', isIndex: true},
      {name: 'VoiceId', type: 'integer', isIndex: true},
    ]
  },
  TalkSentenceMultiVoice: <SchemaTable> {
    name: 'TalkSentenceMultiVoice',
    jsonFile: './ExcelOutput/TalkSentenceMultiVoice.json',
    columns: [
      {name: 'TalkSentenceId', type: 'integer', isPrimary: true},
    ]
  },
  VoiceConfig: <SchemaTable> {
    name: 'VoiceConfig',
    jsonFile: './ExcelOutput/VoiceConfig.json',
    columns: [
      {name: 'VoiceType', type: 'string', isIndex: true},
      {name: 'VoiceId', type: 'integer', isPrimary: true},
    ]
  },
  // endregion

  // region Dialogue
  // ---------------

  DialogueCondition: <SchemaTable> {
    name: 'DialogueCondition',
    jsonFile: './ExcelOutput/DialogueCondition.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'Type', type: 'string', isIndex: true},
    ]
  },
  DialogueDynamicContent: <SchemaTable> {
    name: 'DialogueDynamicContent',
    jsonFile: './ExcelOutput/DialogueDynamicContent.json',
    columns: [
      {name: 'DynamicContentId', type: 'integer', isIndex: true},
      {name: 'ArgId', type: 'integer', isIndex: true},
      {name: 'DynamicParamType', type: 'string', isIndex: true},
      {name: 'ContentTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  DialogueEvent: <SchemaTable> {
    name: 'DialogueEvent',
    jsonFile: './ExcelOutput/DialogueEvent.json',
    columns: [
      {name: 'EventId', type: 'integer', isPrimary: true},
      {name: 'EffectType', type: 'string', isIndex: true},
      {name: 'CostType', type: 'string', isIndex: true},
      {name: 'DescValueTextMapHash', type: 'integer', isIndex: true},
      {name: 'EventDisplayId', type: 'integer', isIndex: true},
      {name: 'DynamicContentId', type: 'integer', isIndex: true},
      {name: 'PerformanceType', type: 'integer', isIndex: true},
    ]
  },
  DialogueEventDisplay: <SchemaTable> {
    name: 'DialogueEventDisplay',
    jsonFile: './ExcelOutput/DialogueEventDisplay.json',
    columns: [
      {name: 'EventDisplayId', type: 'integer', isPrimary: true},
      {name: 'EventTitleTextMapHash', type: 'integer', isIndex: true},
      {name: 'EventDescTextMapHash', type: 'integer', isIndex: true},
      {name: 'EventDetailDescTextMapHash', type: 'integer', isIndex: true},
    ]
  },

  DialogueIcon: <SchemaTable> {
    name: 'DialogueIcon',
    jsonFile: './ExcelOutput/DialogueIcon.json',
    columns: [
      {name: 'Type', type: 'string', isIndex: true},
    ]
  },
  DialogueNPC: <SchemaTable> {
    name: 'DialogueNPC',
    jsonFile: './ExcelOutput/DialogueNPC.json',
    columns: [
      {name: 'GroupId', type: 'integer', isPrimary: true},
      {name: 'GroupType', type: 'string', isIndex: true},
      {name: 'InteractTitleTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  DialogueProp: <SchemaTable> {
    name: 'DialogueProp',
    jsonFile: './ExcelOutput/DialogueProp.json',
    columns: [
      {name: 'GroupId', type: 'integer', isPrimary: true},
      {name: 'GroupType', type: 'string', isIndex: true},
      {name: 'InteractTitleTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  RogueNPCDialogue: <SchemaTable> {
    name: 'RogueNPCDialogue',
    jsonFile: './ExcelOutput/RogueNPCDialogue.json',
    columns: [
      {name: 'RogueNPCId', type: 'integer', isIndex: true},
      {name: 'HandbookEventId', type: 'integer', isIndex: true},
    ]
  },
  // endregion

  // region Messages
  // ---------------

  MessageContactsCamp: <SchemaTable> {
    name: 'MessageContactsCamp',
    jsonFile: './ExcelOutput/MessageContactsCamp.json',
    columns: [
      {name: 'ContactsCamp', type: 'integer', isPrimary: true},
      {name: 'SortId', type: 'integer', isIndex: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  MessageContactsCondition: <SchemaTable> {
    name: 'MessageContactsCondition',
    jsonFile: './ExcelOutput/MessageContactsCondition.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'FakeContactId', type: 'integer', isIndex: true},
    ]
  },
  MessageContactsConfig: <SchemaTable> {
    name: 'MessageContactsConfig',
    jsonFile: './ExcelOutput/MessageContactsConfig.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'ContactsType', type: 'integer', isIndex: true},
      {name: 'ContactsCamp', type: 'integer', isIndex: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
      {name: 'SignatureTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  MessageContactsType: <SchemaTable> {
    name: 'MessageContactsType',
    jsonFile: './ExcelOutput/MessageContactsType.json',
    columns: [
      {name: 'ContactsType', type: 'integer', isPrimary: true},
      {name: 'SortId', type: 'integer', isIndex: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  MessageGroupConfig: <SchemaTable> {
    name: 'MessageGroupConfig',
    jsonFile: './ExcelOutput/MessageGroupConfig.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'MessageContactsId', type: 'integer', isIndex: true},
      {name: 'ActivityModuleId', type: 'integer', isIndex: true},
    ]
  },
  MessageItemConfig: <SchemaTable> {
    name: 'MessageItemConfig',
    jsonFile: './ExcelOutput/MessageItemConfig.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'ItemType', type: 'string', isIndex: true},
      {name: 'SectionId', type: 'integer', isIndex: true},
      {name: 'MainTextMapHash', type: 'integer', isIndex: true},
      {name: 'OptionTextMapHash', type: 'integer', isIndex: true},
      {name: 'ContactsId', type: 'integer', isIndex: true},
      {name: 'ItemContentId', type: 'integer', isIndex: true},
    ]
  },
  MessageItemImage: <SchemaTable> {
    name: 'MessageItemImage',
    jsonFile: './ExcelOutput/MessageItemImage.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
    ]
  },
  MessageItemRaidEntrance: <SchemaTable> {
    name: 'MessageItemRaidEntrance',
    jsonFile: './ExcelOutput/MessageItemRaidEntrance.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'RaidId', type: 'integer', isIndex: true},
    ]
  },
  MessageSectionConfig: <SchemaTable> {
    name: 'MessageSectionConfig',
    jsonFile: './ExcelOutput/MessageSectionConfig.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
    ]
  },
  MessageStateIcon: <SchemaTable> {
    name: 'MessageStateIcon',
    jsonFile: './ExcelOutput/MessageStateIcon.json',
    columns: [
      {name: 'Id', type: 'string', isPrimary: true},
    ]
  },
  // endregion

  // region Other
  // ------------
  TutorialGuideTalkData: <SchemaTable> {
    name: 'TutorialGuideTalkData',
    jsonFile: './ExcelOutput/TutorialGuideTalkData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'TalkDataTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  RewardData: <SchemaTable> {
    name: 'RewardData',
    jsonFile: './ExcelOutput/RewardData.json',
    columns: [
      {name: 'RewardId', type: 'integer', isPrimary: true},
    ]
  },
  // endregion
}
