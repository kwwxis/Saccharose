import { plainLineMapSchema, SchemaTable, textMapSchema } from '../import_db.ts';

export const wuwaSchema = {

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

  RoleInfo: <SchemaTable> {
    name: 'RoleInfo',
    jsonFile: './ConfigDB/RoleInfo.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'QualityId', type: 'integer', isIndex: true},
      {name: 'RoleType', type: 'integer', isIndex: true},
      {name: 'WeaponType', type: 'integer', isIndex: true},
    ]
  },

  ConditionGroup: <SchemaTable> {
    name: 'ConditionGroup',
    jsonFile: './ConfigDB/ConditionGroup.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
    ]
  },
  Condition: <SchemaTable> {
    name: 'Condition',
    jsonFile: './ConfigDB/Condition.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'Type', type: 'text', isIndex: true},
    ]
  },

  FavorGoods: <SchemaTable> {
    name: 'FavorGoods',
    jsonFile: './ConfigDB/FavorGoods.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'RoleId', type: 'integer', isIndex: true},
      {name: 'CondGroupId', type: 'integer', isIndex: true},
    ]
  },
  FavorRoleInfo: <SchemaTable> {
    name: 'FavorRoleInfo',
    jsonFile: './ConfigDB/FavorRoleInfo.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'RoleId', type: 'integer', isIndex: true},
    ]
  },
  FavorStory: <SchemaTable> {
    name: 'FavorStory',
    jsonFile: './ConfigDB/FavorStory.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'RoleId', type: 'integer', isIndex: true},
      {name: 'CondGroupId', type: 'integer', isIndex: true},
    ]
  },
  FavorWord: <SchemaTable> {
    name: 'FavorWord',
    jsonFile: './ConfigDB/FavorWord.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'RoleId', type: 'integer', isIndex: true},
      {name: 'Type', type: 'integer', isIndex: true},
      {name: 'CondGroupId', type: 'integer', isIndex: true},
    ]
  },




}
