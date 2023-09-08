import { plainLineMapSchema, SchemaTable, textMapSchema } from '../import_db';

export const starRailSchema = {

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

}