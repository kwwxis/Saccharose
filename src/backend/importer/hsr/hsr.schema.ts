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
  VoiceConfig: <SchemaTable> {
    name: 'VoiceConfig',
    jsonFile: './ExcelBinOutput/VoiceConfig.json',
    columns: [
      {name: 'VoiceType', type: 'string', isIndex: true},
      {name: 'VoiceId', type: 'integer', isPrimary: true},
    ]
  },
  // endregion

  // region Mission
  // --------------
  MainMission: <SchemaTable> {
    name: 'MainMission',
    jsonFile: './ExcelOutput/MainMission.json',
    columns: [
      {name: 'Type', type: 'string', isIndex: true},
      {name: 'MainMissionId', type: 'integer', isPrimary: true},
      {name: 'RewardId', type: 'integer', isIndex: true},
      {name: 'DisplayRewardId', type: 'integer', isIndex: true},
      {name: 'ChapterId', type: 'integer', isIndex: true},
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