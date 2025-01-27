import { plainLineMapSchema, SchemaTable, textMapSchema } from '../import_db.ts';

const hashType = 'text';

export const zenlessSchema = {

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

  // Archive Quest & Archive Perform
  // --------------------------------------------------------------------------------------------------------------
  ArchiveFileQuestTemplateTb: <SchemaTable> {
    name: 'ArchiveFileQuestTemplateTb',
    jsonFile: './FileCfg/ArchiveFileQuestTemplateTb.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'ArchiveFileNum', type: 'string', isIndex: true }
    ],
    renameFields: {
      PDJOCPDOOAA: 'Id',
      GLLGBBPCAGO: 'ArchiveFileNum',
      LMFFGDMMMCM: 'QuestNameTextMapHash',
      KECJPCINIOB: 'QuestNum',
      LEFBFCNLCKE: 'ArchivePerformTemplateIds'
    },
  },
  ArchivePerformTemplateTb: <SchemaTable> {
    name: 'ArchivePerformTemplateTb',
    jsonFile: './FileCfg/ArchivePerformTemplateTb.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'NameTextMapHash', type: 'string', isIndex: true },
      { name: 'DescTextMapHash', type: 'string', isIndex: true },
      { name: 'TargetTextMapHash', type: 'string', isIndex: true },
      { name: 'PerformTemplateId', type: 'integer', isIndex: true },
    ],
    renameFields: {
      PDJOCPDOOAA: 'Id',
      OOIJPMBPKOI: 'NameTextMapHash',
      HDPAMHDDFME: 'DescTextMapHash',
      MAADHAONDGI: 'TargetTextMapHash',
      CCJHJFMALEA: 'PerformTemplateId'
    },
  },

  // Quest & Perform
  // --------------------------------------------------------------------------------------------------------------
  QuestConfigTemplateTb: <SchemaTable> {
    name: 'QuestConfigTemplateTb',
    jsonFile: './FileCfg/QuestConfigTemplateTb.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'NameTextMapHash', type: 'string', isIndex: true },
      { name: 'DescTextMapHash', type: 'string', isIndex: true },
      { name: 'TargetTextMapHash', type: 'string', isIndex: true },
      { name: 'FinishDescTextMapHash', type: 'string', isIndex: true }
    ],
    renameFields: {
      GAKPNBMEMNG: 'Id',
      OOIJPMBPKOI: 'NameTextMapHash',
      MBBBAGJBGFJ: 'DescTextMapHash',
      LGDDKFKADOA: 'TargetTextMapHash',
      HDPAMHDDFME: 'FinishDescTextMapHash',
    },
  },
  PerformTemplateTb: <SchemaTable> {
    name: 'PerformTemplateTb',
    jsonFile: './FileCfg/PerformTemplateTb.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
    ],
    renameFields: {
      PDJOCPDOOAA: 'Id',
      KACBJMGKCBB: 'MalePath',
      BBGLFLFMDAD: 'FemalePath',
    },
  },

  // Dialogue Node
  // --------------------------------------------------------------------------------------------------------------
  DialogueNodeTemplateTb: <SchemaTable> {
    name: 'DialogueNodeTemplateTb',
    jsonFile: './FileCfg/DialogueNodeTemplateTb.json',
    columns: [
      { name: 'NodeId', type: 'string', isPrimary: true },
      { name: 'NodeType', type: 'integer', isIndex: true },
      { name: 'ScriptConfigName', type: 'string', isIndex: true },
      { name: 'AvatarNameKey', type: 'string', isIndex: true },
      { name: 'DialogueKey', type: 'string', isIndex: true },
      { name: 'AvatarId', type: 'integer', isIndex: true },
    ]
  },
}
