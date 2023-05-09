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

  MainMission: <SchemaTable> {
    name: 'MainMission',
    jsonFile: './ExcelBinOutput/MainMission.json',
    columns: [
      {name: 'Type', type: 'string', isIndex: true},
      {name: 'MainMissionId', type: 'integer', isPrimary: true},
      {name: 'RewardId', type: 'integer', isIndex: true},
      {name: 'DisplayRewardId', type: 'integer', isIndex: true},
      {name: 'ChapterId', type: 'integer', isIndex: true},
    ]
  },

}