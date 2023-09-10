import { plainLineMapSchema, SchemaTable, textMapSchema } from '../import_db';

export const starRailSchema = {

  // region TextMap & PlainLineMap
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
    jsonFile: './ExcelBinOutput/AvatarConfig.json',
    columns: [
      {name: 'AvatarId', type: 'integer', isPrimary: true},
      {name: 'AvatarBaseType', type: 'string', isIndex: true},
      {name: 'DamageType', type: 'string', isIndex: true},
      {name: 'AvatarNameTextMapHash', type: 'integer', isIndex: true},
      {name: 'AvatarFullNameTextMapHash', type: 'integer', isIndex: true},
      {name: 'AvatarCutinIntroTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  AvatarVO: <SchemaTable> {
    name: 'AvatarVO',
    jsonFile: './ExcelBinOutput/AvatarVO.json',
    columns: [
      {name: 'VOTag', type: 'string', isPrimary: true},
    ]
  },
  VoiceAtlas: <SchemaTable> {
    name: 'VoiceAtlas',
    jsonFile: './ExcelBinOutput/VoiceAtlas.json',
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
    jsonFile: './ExcelBinOutput/AtlasUnlockData.json',
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
      {name: 'MainMissionId', type: 'integer', isPrimary: true},
      {name: 'Type', type: 'string', isIndex: true},
      {name: 'RewardId', type: 'integer', isIndex: true},
      {name: 'DisplayRewardId', type: 'integer', isIndex: true},
      {name: 'ChapterId', type: 'integer', isIndex: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  MainMissionSchedule: <SchemaTable> {
    name: 'MainMissionSchedule',
    jsonFile: './ExcelBinOutput/MainMissionSchedule.json',
    columns: [
      {name: 'MainMissionId', type: 'integer', isPrimary: true},
      {name: 'ActivityModuleId', type: 'integer', isIndex: true},
      {name: 'ScheduleDataId', type: 'integer', isIndex: true},
    ]
  },
  MainMissionType: <SchemaTable> {
    name: 'MainMissionType',
    jsonFile: './ExcelBinOutput/MainMissionType.json',
    columns: [
      {name: 'Type', type: 'string', isPrimary: true},
      {name: 'TypeNameTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  MissionChapterConfig: <SchemaTable> {
    name: 'MissionChapterConfig',
    jsonFile: './ExcelBinOutput/MissionChapterConfig.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'ChapterNameTextMapHash', type: 'integer', isIndex: true},
      {name: 'StageNameTextMapHash', type: 'integer', isIndex: true},
      {name: 'ChapterDescTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  ScheduleDataMission: <SchemaTable> {
    name: 'ScheduleDataMission',
    jsonFile: './ExcelBinOutput/ScheduleDataMission.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
    ]
  },
  SubMission: <SchemaTable> {
    name: 'SubMission',
    jsonFile: './ExcelBinOutput/SubMission.json',
    columns: [
      {name: 'SubMissionId', type: 'integer', isPrimary: true},
      {name: 'TargetTextMapHash', type: 'integer', isIndex: true},
      {name: 'DescTextMapHash', type: 'integer', isIndex: true},
    ],
    normalizeFixFields: {
      'DescrptionText:': 'DescText',
      'DescrptionTextMapHash': 'DescTextMapHash'
    }
  },
  // endreigon

  // region Event Mission
  // --------------------
  EventMission: <SchemaTable> {
    name: 'EventMission',
    jsonFile: './ExcelBinOutput/EventMission.json',
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
    jsonFile: './ExcelBinOutput/EventMissionChallenge.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
    ]
  },
  FinishWayEventMission: <SchemaTable> {
    name: 'FinishWayEventMission',
    jsonFile: './ExcelBinOutput/FinishWayEventMission.json',
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
    jsonFile: './ExcelBinOutput/DailyMissionCount.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
    ]
  },
  DailyMissionData: <SchemaTable> {
    name: 'DailyMissionData',
    jsonFile: './ExcelBinOutput/DailyMissionData.json',
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
    jsonFile: './ExcelBinOutput/TalkBehavior.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'ParaType', type: 'string', isIndex: true},
    ]
  },
  TalkReward: <SchemaTable> {
    name: 'TalkReward',
    jsonFile: './ExcelBinOutput/TalkReward.json',
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
    jsonFile: './ExcelBinOutput/TalkSentenceConfig.json',
    columns: [
      {name: 'TalkSentenceId', type: 'integer', isPrimary: true},
      {name: 'TextmapTalkSentenceNameTextMapHash', type: 'integer', isIndex: true},
      {name: 'TalkSentenceTextMapHash', type: 'integer', isIndex: true},
      {name: 'VoiceId', type: 'integer', isIndex: true},
    ]
  },
  TalkSentenceMultiVoice: <SchemaTable> {
    name: 'TalkSentenceMultiVoice',
    jsonFile: './ExcelBinOutput/TalkSentenceMultiVoice.json',
    columns: [
      {name: 'TalkSentenceId', type: 'integer', isPrimary: true},
    ]
  },
  VoiceConfig: <SchemaTable> {
    name: 'VoiceConfig',
    jsonFile: './ExcelBinOutput/VoiceConfig.json',
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
    jsonFile: './ExcelBinOutput/DialogueCondition.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'Type', type: 'string', isIndex: true},
    ]
  },
  DialogueDynamicContent: <SchemaTable> {
    name: 'DialogueDynamicContent',
    jsonFile: './ExcelBinOutput/DialogueDynamicContent.json',
    columns: [
      {name: 'DynamicContentId', type: 'integer', isIndex: true},
      {name: 'ArgId', type: 'integer', isIndex: true},
      {name: 'DynamicParamType', type: 'string', isIndex: true},
      {name: 'ContentTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  DialogueEvent: <SchemaTable> {
    name: 'DialogueEvent',
    jsonFile: './ExcelBinOutput/DialogueEvent.json',
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
    jsonFile: './ExcelBinOutput/DialogueEventDisplay.json',
    columns: [
      {name: 'EventDisplayId', type: 'integer', isPrimary: true},
      {name: 'EventTitleTextMapHash', type: 'integer', isIndex: true},
      {name: 'EventDescTextMapHash', type: 'integer', isIndex: true},
      {name: 'EventDetailDescTextMapHash', type: 'integer', isIndex: true},
    ]
  },

  DialogueIcon: <SchemaTable> {
    name: 'DialogueIcon',
    jsonFile: './ExcelBinOutput/DialogueIcon.json',
    columns: [
      {name: 'Type', type: 'string', isIndex: true},
    ]
  },
  DialogueNPC: <SchemaTable> {
    name: 'DialogueNPC',
    jsonFile: './ExcelBinOutput/DialogueNPC.json',
    columns: [
      {name: 'GroupId', type: 'integer', isPrimary: true},
      {name: 'GroupType', type: 'string', isIndex: true},
      {name: 'InteractTitleTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  DialogueProp: <SchemaTable> {
    name: 'DialogueProp',
    jsonFile: './ExcelBinOutput/DialogueProp.json',
    columns: [
      {name: 'GroupId', type: 'integer', isPrimary: true},
      {name: 'GroupType', type: 'string', isIndex: true},
      {name: 'InteractTitleTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  RogueNPCDialogue: <SchemaTable> {
    name: 'RogueNPCDialogue',
    jsonFile: './ExcelBinOutput/RogueNPCDialogue.json',
    columns: [
      {name: 'RogueNPCId', type: 'integer', isIndex: true},
      {name: 'HandbookEventId', type: 'integer', isPrimary: true},
    ]
  },
  // endregion

  // region Messages
  // ---------------

  MessageContactsCamp: <SchemaTable> {
    name: 'MessageContactsCamp',
    jsonFile: './ExcelBinOutput/MessageContactsCamp.json',
    columns: [
      {name: 'ContactsCamp', type: 'integer', isPrimary: true},
      {name: 'SortId', type: 'integer', isIndex: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  MessageContactsCondition: <SchemaTable> {
    name: 'MessageContactsCondition',
    jsonFile: './ExcelBinOutput/MessageContactsCondition.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'FakeContactId', type: 'integer', isIndex: true},
    ]
  },
  MessageContactsConfig: <SchemaTable> {
    name: 'MessageContactsConfig',
    jsonFile: './ExcelBinOutput/MessageContactsConfig.json',
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
    jsonFile: './ExcelBinOutput/MessageContactsType.json',
    columns: [
      {name: 'ContactsType', type: 'integer', isPrimary: true},
      {name: 'SortId', type: 'integer', isIndex: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  MessageGroupConfig: <SchemaTable> {
    name: 'MessageGroupConfig',
    jsonFile: './ExcelBinOutput/MessageGroupConfig.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'MessageContactsId', type: 'integer', isIndex: true},
      {name: 'ActivityModuleId', type: 'integer', isIndex: true},
    ]
  },
  MessageItemConfig: <SchemaTable> {
    name: 'MessageItemConfig',
    jsonFile: './ExcelBinOutput/MessageItemConfig.json',
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
    jsonFile: './ExcelBinOutput/MessageItemImage.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
    ]
  },
  MessageItemRaidEntrance: <SchemaTable> {
    name: 'MessageItemRaidEntrance',
    jsonFile: './ExcelBinOutput/MessageItemRaidEntrance.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'RaidId', type: 'integer', isIndex: true},
    ]
  },
  MessageSectionConfig: <SchemaTable> {
    name: 'MessageSectionConfig',
    jsonFile: './ExcelBinOutput/MessageSectionConfig.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
    ]
  },
  MessageStateIcon: <SchemaTable> {
    name: 'MessageStateIcon',
    jsonFile: './ExcelBinOutput/MessageStateIcon.json',
    columns: [
      {name: 'Id', type: 'string', isPrimary: true},
    ]
  },
  // endregion

  // region Other
  // ------------
  TutorialGuideTalkData: <SchemaTable> {
    name: 'TutorialGuideTalkData',
    jsonFile: './ExcelBinOutput/TutorialGuideTalkData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'TalkDataTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  RewardData: <SchemaTable> {
    name: 'RewardData',
    jsonFile: './ExcelBinOutput/RewardData.json',
    columns: [
      {name: 'RewardId', type: 'integer', isPrimary: true},
    ]
  },
  // endregion
}