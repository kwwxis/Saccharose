import { plainLineMapSchema, SchemaTable, textMapSchema } from '../import_db.ts';

export const zenlessSchema = {

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

  // Archive Quest & Archive Perform
  // --------------------------------------------------------------------------------------------------------------
  // ArchiveFileQuestTemplateTb: <SchemaTable> {
  //   name: 'ArchiveFileQuestTemplateTb',
  //   jsonFile: './FileCfg/ArchiveFileQuestTemplateTb.json',
  //   columns: [
  //     { name: 'Id', type: 'integer', isPrimary: true },
  //     { name: 'ArchiveFileNum', type: 'text', isIndex: true }
  //   ],
  //   renameFields: {
  //     PDJOCPDOOAA: 'Id',
  //     GLLGBBPCAGO: 'ArchiveFileNum',
  //     LMFFGDMMMCM: 'QuestNameTextMapHash',
  //     KECJPCINIOB: 'QuestNum',
  //     LEFBFCNLCKE: 'ArchivePerformTemplateIds'
  //   },
  // },
  // ArchivePerformTemplateTb: <SchemaTable> {
  //   name: 'ArchivePerformTemplateTb',
  //   jsonFile: './FileCfg/ArchivePerformTemplateTb.json',
  //   columns: [
  //     { name: 'Id', type: 'integer', isPrimary: true },
  //     { name: 'NameTextMapHash', type: 'text', isIndex: true },
  //     { name: 'DescTextMapHash', type: 'text', isIndex: true },
  //     { name: 'TargetTextMapHash', type: 'text', isIndex: true },
  //     { name: 'PerformTemplateId', type: 'integer', isIndex: true },
  //   ],
  //   renameFields: {
  //     PDJOCPDOOAA: 'Id',
  //     OOIJPMBPKOI: 'NameTextMapHash',
  //     HDPAMHDDFME: 'DescTextMapHash',
  //     MAADHAONDGI: 'TargetTextMapHash',
  //     CCJHJFMALEA: 'PerformTemplateId'
  //   },
  // },

  // Quest & Perform
  // --------------------------------------------------------------------------------------------------------------
  // QuestConfigTemplateTb: <SchemaTable> {
  //   name: 'QuestConfigTemplateTb',
  //   jsonFile: './FileCfg/QuestConfigTemplateTb.json',
  //   columns: [
  //     { name: 'Id', type: 'integer', isPrimary: true },
  //     { name: 'NameTextMapHash', type: 'text', isIndex: true },
  //     { name: 'DescTextMapHash', type: 'text', isIndex: true },
  //     { name: 'TargetTextMapHash', type: 'text', isIndex: true },
  //     { name: 'FinishDescTextMapHash', type: 'text', isIndex: true }
  //   ],
  //   renameFields: {
  //     GAKPNBMEMNG: 'Id',
  //     OOIJPMBPKOI: 'NameTextMapHash',
  //     MBBBAGJBGFJ: 'DescTextMapHash',
  //     LGDDKFKADOA: 'TargetTextMapHash',
  //     HDPAMHDDFME: 'FinishDescTextMapHash',
  //   },
  // },
  // PerformTemplateTb: <SchemaTable> {
  //   name: 'PerformTemplateTb',
  //   jsonFile: './FileCfg/PerformTemplateTb.json',
  //   columns: [
  //     { name: 'Id', type: 'integer', isPrimary: true },
  //   ],
  //   renameFields: {
  //     PDJOCPDOOAA: 'Id',
  //     KACBJMGKCBB: 'MalePath',
  //     BBGLFLFMDAD: 'FemalePath',
  //   },
  // },

  // Dialogue Node
  // --------------------------------------------------------------------------------------------------------------
  DialogueNodeTemplateTb: <SchemaTable> {
    name: 'DialogueNodeTemplateTb',
    jsonFile: './FileCfg/DialogueNodeTemplateTb.json',
    columns: [
      { name: 'NodeId', type: 'text', isPrimary: true },
      { name: 'NodeType', type: 'integer', isIndex: true },
      { name: 'ScriptConfigName', type: 'text', isIndex: true },
      { name: 'AvatarNameKey', type: 'text', isIndex: true },
      { name: 'DialogueKey', type: 'text', isIndex: true },
      { name: 'AvatarId', type: 'integer', isIndex: true },
    ]
  },
  Relation_DialogToNext: <SchemaTable> {
    name: 'Relation_DialogToNext',
    jsonFile: './FileCfg/DialogueNodeTemplateTb.json',
    columns: [
      { name: 'NodeId', type: 'text', isIndex: true },
      { name: 'NextNodeId', type: 'text', isIndex: true },
    ],
    customRowResolveProvider: async () => {
      // Cannot import ZenlessControl from this file (zenless.schema.ts) which is why we're using a dynamic import.
      return (await import('./zenless.customRowResolvers.ts')).relation_DialogToNext_resolver;
    }
  },
}
