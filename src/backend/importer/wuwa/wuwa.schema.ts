import { plainLineMapSchema, SchemaTable, textMapSchema } from '../import_db.ts';

const hashType = 'text';

export const wuwaSchema = {

  TextMapCHS: textMapSchema('CHS', hashType),
  TextMapCHT: textMapSchema('CHT', hashType),
  TextMapDE: textMapSchema('DE', hashType),
  TextMapEN: textMapSchema('EN', hashType),
  TextMapES: textMapSchema('ES', hashType),
  TextMapFR: textMapSchema('FR', hashType),
  TextMapID: textMapSchema('ID', hashType),
  TextMapJP: textMapSchema('JP', hashType),
  TextMapKR: textMapSchema('KR', hashType),
  TextMapPT: textMapSchema('PT', hashType),
  TextMapRU: textMapSchema('RU', hashType),
  TextMapTH: textMapSchema('TH', hashType),
  TextMapVI: textMapSchema('VI', hashType),

  PlainLineMapCHS: plainLineMapSchema('CHS', hashType),
  PlainLineMapCHT: plainLineMapSchema('CHT', hashType),
  PlainLineMapDE: plainLineMapSchema('DE', hashType),
  PlainLineMapEN: plainLineMapSchema('EN', hashType),
  PlainLineMapES: plainLineMapSchema('ES', hashType),
  PlainLineMapFR: plainLineMapSchema('FR', hashType),
  PlainLineMapID: plainLineMapSchema('ID', hashType),
  PlainLineMapJP: plainLineMapSchema('JP', hashType),
  PlainLineMapKR: plainLineMapSchema('KR', hashType),
  PlainLineMapPT: plainLineMapSchema('PT', hashType),
  PlainLineMapRU: plainLineMapSchema('RU', hashType),
  PlainLineMapTH: plainLineMapSchema('TH', hashType),
  PlainLineMapVI: plainLineMapSchema('VI', hashType),

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
      {name: 'Type', type: 'string', isIndex: true},
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
