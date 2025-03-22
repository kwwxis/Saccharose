import { getGenshinDataFilePath } from '../../loadenv.ts';
import fs from 'fs';
import { SchemaTable, textMapSchema, plainLineMapSchema, normalizeRawJson } from '../import_db.ts';
import {
  ReminderExcelConfigData,
  TalkExcelConfigData,
} from '../../../shared/types/genshin/dialogue-types.ts';
import {
  CombineExcelConfigData,
  CompoundExcelConfigData,
  CookRecipeExcelConfigData,
  ForgeExcelConfigData,
  MaterialExcelConfigData,
  MaterialRelation,
} from '../../../shared/types/genshin/material-types.ts';
import { FurnitureMakeExcelConfigData } from '../../../shared/types/genshin/homeworld-types.ts';
import { GCGCharacterLevelExcelConfigData, GCGWeekLevelExcelConfigData } from '../../../shared/types/genshin/gcg-types.ts';
import { DocumentExcelConfigData } from '../../../shared/types/genshin/readable-types.ts';
import { toInt } from '../../../shared/util/numberUtil.ts';

export const RAW_MANUAL_TEXTMAP_ID_PROP: string = 'textMapId';

const propertySchemaPath = getGenshinDataFilePath('./PropertySchema.json');
const propertySchema: {[tableName: string]: {[key: string]: string}} =
  fs.existsSync(propertySchemaPath)
    ? JSON.parse(fs.readFileSync(propertySchemaPath, { encoding: 'utf8' }))
    : {};

export type GenshinSchemaNames = keyof typeof genshinSchema;

export const genshinSchema = {

  TextMapCHS: textMapSchema('CHS'),
  TextMapCHT: textMapSchema('CHT'),
  TextMapDE: textMapSchema('DE'),
  TextMapEN: textMapSchema('EN'),
  TextMapES: textMapSchema('ES'),
  TextMapFR: textMapSchema('FR'),
  TextMapID: textMapSchema('ID'),
  TextMapIT: textMapSchema('IT'),
  TextMapJP: textMapSchema('JP'),
  TextMapKR: textMapSchema('KR'),
  TextMapPT: textMapSchema('PT'),
  TextMapRU: textMapSchema('RU'),
  TextMapTH: textMapSchema('TH'),
  TextMapTR: textMapSchema('TR'),
  TextMapVI: textMapSchema('VI'),

  PlainLineMapCHS: plainLineMapSchema('CHS'),
  PlainLineMapCHT: plainLineMapSchema('CHT'),
  PlainLineMapDE: plainLineMapSchema('DE'),
  PlainLineMapEN: plainLineMapSchema('EN'),
  PlainLineMapES: plainLineMapSchema('ES'),
  PlainLineMapFR: plainLineMapSchema('FR'),
  PlainLineMapID: plainLineMapSchema('ID'),
  PlainLineMapIT: plainLineMapSchema('IT'),
  PlainLineMapJP: plainLineMapSchema('JP'),
  PlainLineMapKR: plainLineMapSchema('KR'),
  PlainLineMapPT: plainLineMapSchema('PT'),
  PlainLineMapRU: plainLineMapSchema('RU'),
  PlainLineMapTH: plainLineMapSchema('TH'),
  PlainLineMapTR: plainLineMapSchema('TR'),
  PlainLineMapVI: plainLineMapSchema('VI'),

  DialogExcelConfigData: <SchemaTable> {
    name: 'DialogExcelConfigData',
    jsonFile: './ExcelBinOutput/DialogExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'TalkRoleType', type: 'string', resolve: 'TalkRole.Type', isIndex: true },
      { name: 'TalkRoleId', type: 'string', resolve: 'TalkRole.Id', isIndex: true },
      { name: 'TalkContentTextMapHash', type: 'integer', isIndex: true },
      { name: 'TalkRoleNameTextMapHash', type: 'integer', isIndex: true },
      { name: 'TalkId', type: 'integer', isIndex: true },
      { name: 'TalkType', type: 'string', isIndex: true },
    ]
  },
  DialogUnparentedExcelConfigData: <SchemaTable> {
    name: 'DialogUnparentedExcelConfigData',
    jsonFile: './ExcelBinOutput/DialogUnparentedExcelConfigData.json',
    columns: [
      { name: 'MainQuestId', type: 'integer', isIndex: true },
      { name: 'DialogId', type: 'integer', isIndex: true },
    ]
  },
  Relation_DialogToNext: <SchemaTable> {
    name: 'Relation_DialogToNext',
    jsonFile: './ExcelBinOutput/DialogExcelConfigData.json',
    columns: [
      { name: 'DialogId', type: 'integer', isIndex: true },
      { name: 'NextId', type: 'integer', isIndex: true },
    ],
    customRowResolveProvider: async () => {
      // Cannot import GenshinControl from this file (genshin.schema.ts) which is why we're using a dynamic import.
      return (await import('./genshin.customRowResolvers.ts')).relation_DialogToNext_resolver;
    }
  },
  ManualTextMapConfigData: <SchemaTable> {
    name: 'ManualTextMapConfigData',
    jsonFile: './ExcelBinOutput/ManualTextMapConfigData.json',
    columns: [
      { name: 'TextMapId', type: 'string', isPrimary: true },
      { name: 'TextMapContentTextMapHash', type: 'integer', isIndex: true },
    ],
  },
  NpcExcelConfigData: <SchemaTable> {
    name: 'NpcExcelConfigData',
    jsonFile: './ExcelBinOutput/NpcExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'NameTextMapHash', type: 'integer', isIndex: true },
    ],
  },
  TalkExcelConfigData: <SchemaTable> {
    name: 'TalkExcelConfigData',
    jsonFile: './ExcelBinOutput/TalkExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'InitDialog', type: 'integer', isIndex: true },
      { name: 'LoadType', type: 'string', isIndex: true, defaultValue: 'TALK_DEFAULT' },
      { name: 'QuestId', type: 'integer', isIndex: true },
      {
        name: 'QuestCondStateEqualFirst', type: 'integer', isIndex: true, resolve(row: TalkExcelConfigData) {
          if (row.BeginCond) {
            let questCondStateEqual = row.BeginCond.find(cond => cond.Type === 'QUEST_COND_STATE_EQUAL');
            if (questCondStateEqual && Array.isArray(questCondStateEqual.Param)) {
              try {
                if (typeof questCondStateEqual.Param[0] === 'string') {
                  return toInt(questCondStateEqual.Param[0]);
                } else {
                  return questCondStateEqual.Param[0];
                }
              } catch (e) {
                return null;
              }
            }
          }
          return null;
        },
      },
    ],
  },
  Relation_NpcToTalk: <SchemaTable> {
    name: 'Relation_NpcToTalk',
    jsonFile: './ExcelBinOutput/TalkExcelConfigData.json',
    columns: [
      { name: 'NpcId', type: 'integer', isIndex: true },
      { name: 'TalkId', type: 'integer' },
      { name: 'TalkLoadType', type: 'string', isIndex: true },
    ],
    customRowResolve: (row: TalkExcelConfigData) => {
      if (row.NpcId && row.NpcId.length) {
        return row.NpcId.map(npcId => ({ NpcId: npcId, TalkId: row.Id, TalkLoadType: row.LoadType || 'TALK_DEFAULT' }));
      }
      return [];
    },
  },
  MainQuestExcelConfigData: <SchemaTable> {
    name: 'MainQuestExcelConfigData',
    jsonFile: './ExcelBinOutput/MainQuestExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'Series', type: 'integer', isIndex: true },
      { name: 'ChapterId', type: 'integer', isIndex: true },
      { name: 'TitleTextMapHash', type: 'integer', isIndex: true },
      { name: 'DescTextMapHash', type: 'integer', isIndex: true },
    ]
  },
  ChapterExcelConfigData: <SchemaTable> {
    name: 'ChapterExcelConfigData',
    jsonFile: './ExcelBinOutput/ChapterExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'BeginQuestId', type: 'integer', isIndex: true },
      { name: 'EndQuestId', type: 'integer', isIndex: true },
      { name: 'ChapterNumTextMapHash', type: 'integer', isIndex: true },
      { name: 'ChapterTitleTextMapHash', type: 'integer', isIndex: true },
    ],
  },
  QuestExcelConfigData: <SchemaTable> {
    name: 'QuestExcelConfigData',
    jsonFile: './ExcelBinOutput/QuestExcelConfigData.json',
    columns: [
      { name: 'SubId', type: 'integer', isPrimary: true },
      { name: 'MainId', type: 'integer', isIndex: true },
      { name: 'Order', type: 'integer' },
      { name: 'DescTextMapHash', type: 'integer', isIndex: true },
      { name: 'StepDescTextMapHash', type: 'integer', isIndex: true },
      { name: 'GuideTipsTextMapHash', type: 'integer', isIndex: true },
    ]
  },
  LoadingTipsExcelConfigData: <SchemaTable> {
    name: 'LoadingTipsExcelConfigData',
    jsonFile: './ExcelBinOutput/LoadingTipsExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'TipsTitleTextMapHash', type: 'integer', isIndex: true },
      { name: 'TipsDescTextMapHash', type: 'integer', isIndex: true },
      { name: 'StageId', type: 'string', isIndex: true },
      { name: 'MinLevel', type: 'integer', isIndex: true },
    ],
  },
  LoadingSituationExcelConfigData: <SchemaTable> {
    name: 'LoadingSituationExcelConfigData',
    jsonFile: './ExcelBinOutput/LoadingSituationExcelConfigData.json',
    columns: [
      { name: 'StageId', type: 'integer', isPrimary: true },
      { name: 'LoadingSituationType', type: 'string', isIndex: true },
      { name: 'AreaTerrainType', type: 'string', isIndex: true },
    ]
  },
  ReminderExcelConfigData: <SchemaTable> {
    name: 'ReminderExcelConfigData',
    jsonFile: './ExcelBinOutput/ReminderExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'SpeakerTextMapHash', type: 'integer', isIndex: true },
      { name: 'ContentTextMapHash', type: 'integer', isIndex: true },
      { name: 'NextReminderId', type: 'integer', isIndex: true },
    ],
  },
  Relation_ReminderToNext: <SchemaTable> {
    name: 'Relation_ReminderToNext',
    jsonFile: './ExcelBinOutput/ReminderExcelConfigData.json',
    columns: [
      { name: 'ReminderId', type: 'integer', isIndex: true },
      { name: 'NextReminderId', type: 'integer', isIndex: true },
    ],
    customRowResolve: (row: ReminderExcelConfigData) => {
      if (row.NextReminderId && row.NextReminderId) {
        return [{ReminderId: row.Id, NextReminderId: row.NextReminderId}];
      } else {
        return [];
      }
    }
  },
  MaterialExcelConfigData: <SchemaTable> {
    name: 'MaterialExcelConfigData',
    jsonFile: './ExcelBinOutput/MaterialExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'InteractionTitleTextMapHash', type: 'integer', isIndex: true },
      { name: 'EffectDescTextMapHash', type: 'integer', isIndex: true },
      { name: 'SpecialDescTextMapHash', type: 'integer', isIndex: true },
      { name: 'TypeDescTextMapHash', type: 'integer', isIndex: true },
      { name: 'NameTextMapHash', type: 'integer', isIndex: true },
      { name: 'DescTextMapHash', type: 'integer', isIndex: true },
      { name: 'Icon', type: 'string' },
      { name: 'ItemType', type: 'string' },
      { name: 'RankLevel', type: 'string' },
    ],
  },
  MaterialCodexExcelConfigData: <SchemaTable> {
    name: 'MaterialCodexExcelConfigData',
    jsonFile: './ExcelBinOutput/MaterialCodexExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'MaterialId', type: 'integer', isIndex: true},
      {name: 'SortOrder', type: 'integer', isIndex: true},
      {name: 'Type', type: 'string', isIndex: true},
      {name: 'NameTextMapHash', type: 'decimal', isIndex: true},
      {name: 'DescTextMapHash', type: 'decimal', isIndex: true},
    ]
  },
  Relation_FurnitureToMaterial: <SchemaTable> {
    name: 'Relation_FurnitureToMaterial',
    jsonFile: './ExcelBinOutput/MaterialExcelConfigData.json',
    columns: [
      { name: 'FurnitureId', type: 'integer', isPrimary: true },
      { name: 'MaterialId', type: 'integer' },
    ],
    customRowResolve: (row: MaterialExcelConfigData) => {
      if (row.MaterialType === 'MATERIAL_FURNITURE_FORMULA' && row.ItemUse && row.ItemUse.length) {
        let furnitureId = row.ItemUse.find(x => x.UseOp === 'ITEM_USE_UNLOCK_FURNITURE_FORMULA').UseParam.find(x => !!x);
        return furnitureId ? [{ FurnitureId: furnitureId, MaterialId: row.Id }] : [];
      } else {
        return [];
      }
    },
  },
  Relation_FurnitureSuiteToMaterial: <SchemaTable> {
    name: 'Relation_FurnitureSuiteToMaterial',
    jsonFile: './ExcelBinOutput/MaterialExcelConfigData.json',
    columns: [
      { name: 'FurnitureSuiteId', type: 'integer', isPrimary: true },
      { name: 'MaterialId', type: 'integer' },
    ],
    customRowResolve: (row: MaterialExcelConfigData) => {
      if (row.MaterialType === 'MATERIAL_FURNITURE_SUITE_FORMULA' && row.ItemUse && row.ItemUse.length) {
        let furnitureSuiteId = row.ItemUse.find(x => x.UseOp === 'ITEM_USE_UNLOCK_FURNITURE_SUITE').UseParam.find(x => !!x);
        return furnitureSuiteId ? [{ FurnitureSuiteId: furnitureSuiteId, MaterialId: row.Id }] : [];
      } else {
        return [];
      }
    },
  },
  Relation_CodexToMaterial: <SchemaTable> {
    name: 'Relation_CodexToMaterial',
    jsonFile: './ExcelBinOutput/MaterialExcelConfigData.json',
    columns: [
      { name: 'CodexId', type: 'integer', isPrimary: true },
      { name: 'MaterialId', type: 'integer' },
    ],
    customRowResolve: (row: MaterialExcelConfigData) => {
      if (row.ItemUse && row.ItemUse.length) {
        let codexId = row.ItemUse.find(x => x.UseOp === 'ITEM_USE_UNLOCK_CODEX')?.UseParam.find(x => !!x);
        return codexId ? [{ CodexId: codexId, MaterialId: row.Id }] : [];
      } else {
        return [];
      }
    },
  },
  MaterialSourceDataExcelConfigData: <SchemaTable> {
    name: 'MaterialSourceDataExcelConfigData',
    jsonFile: './ExcelBinOutput/MaterialSourceDataExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
    ]
  },
  DailyTaskExcelConfigData: <SchemaTable> {
    name: 'DailyTaskExcelConfigData',
    jsonFile: './ExcelBinOutput/DailyTaskExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'CityId', type: 'integer', isIndex: true },
      { name: 'PoolId', type: 'integer', isIndex: true },
      { name: 'QuestId', type: 'integer', isIndex: true },
      { name: 'TitleTextMapHash', type: 'integer', isIndex: true },
      { name: 'DescriptionTextMapHash', type: 'integer', isIndex: true },
      { name: 'TargetTextMapHash', type: 'integer', isIndex: true },
    ],
  },
  NpcFirstMetExcelConfigData: <SchemaTable> {
    name: 'NpcFirstMetExcelConfigData',
    jsonFile: './ExcelBinOutput/NpcFirstMetExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'AvatarId', type: 'integer', isIndex: true },
      { name: 'AvatarDescriptionTextMapHash', type: 'integer', isIndex: true },
    ],
  },
  AvatarExcelConfigData: <SchemaTable> {
    name: 'AvatarExcelConfigData',
    jsonFile: './ExcelBinOutput/AvatarExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'NameTextMapHash', type: 'integer', isIndex: true },
      { name: 'DescTextMapHash', type: 'integer', isIndex: true },
      { name: 'WeaponType', type: 'string', isIndex: true },
      { name: 'BodyType', type: 'string', isIndex: true },
      { name: 'IconName', type: 'string' },
      { name: 'SideIconName', type: 'string' },
    ],
  },
  RewardExcelConfigData: <SchemaTable> {
    name: 'RewardExcelConfigData',
    jsonFile: './ExcelBinOutput/RewardExcelConfigData.json',
    columns: [
      { name: 'RewardId', type: 'integer', isPrimary: true },
    ],
  },
  HomeWorldFurnitureExcelConfigData: <SchemaTable> {
    name: 'HomeWorldFurnitureExcelConfigData',
    jsonFile: './ExcelBinOutput/HomeWorldFurnitureExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'NameTextMapHash', type: 'integer', isIndex: true },
      { name: 'DescTextMapHash', type: 'integer', isIndex: true },
      { name: 'SurfaceType', type: 'string', isIndex: true },
      { name: 'GridStyle', type: 'integer' },
      { name: 'Comfort', type: 'integer' },
      { name: 'StackLimit', type: 'integer' },
      { name: 'Cost', type: 'integer' },
      { name: 'Rank', type: 'integer', isIndex: true },
      { name: 'RankLevel', type: 'integer', isIndex: true },
      { name: 'ItemType', type: 'string', isIndex: true },
    ]
  },
  HomeWorldFurnitureTypeExcelConfigData: <SchemaTable> {
    name: 'HomeWorldFurnitureTypeExcelConfigData',
    jsonFile: './ExcelBinOutput/HomeWorldFurnitureTypeExcelConfigData.json',
    columns: [
      { name: 'TypeId', type: 'integer', isPrimary: true },
      { name: 'TypeNameTextMapHash', type: 'integer', isIndex: true },
      { name: 'TypeName2TextMapHash', type: 'integer', isIndex: true },
      { name: 'TabIcon', type: 'integer' },
      { name: 'SceneType', type: 'string' },
    ]
  },
  HomeWorldPlantExcelConfigData: <SchemaTable> {
    name: 'HomeWorldPlantExcelConfigData',
    jsonFile: './ExcelBinOutput/HomeWorldPlantExcelConfigData.json',
    columns: [
      { name: 'SeedId', type: 'integer', isPrimary: true },
      { name: 'BundleId', type: 'integer', isIndex: true },
      { name: 'SproutGadgetId', type: 'integer', isIndex: true },
      { name: 'FieldId', type: 'integer', isIndex: true },
      { name: 'HomeGatherId', type: 'integer', isIndex: true },
      { name: 'InteeNameTextMapHash', type: 'integer', isIndex: true },
    ]
  },
  HomeWorldEventExcelConfigData: <SchemaTable> {
    name: 'HomeWorldEventExcelConfigData',
    jsonFile: './ExcelBinOutput/HomeWorldEventExcelConfigData.json',
    columns: [
      { name: 'EventId', type: 'integer', isPrimary: true },
      { name: 'EventType', type: 'string', isIndex: true },
      { name: 'AvatarId', type: 'integer', isIndex: true },
      { name: 'TalkId', type: 'integer', isIndex: true },
      { name: 'RewardId', type: 'integer', isIndex: true },
      { name: 'FurnitureSuiteId', type: 'integer', isIndex: true },
    ],
  },
  HomeWorldNPCExcelConfigData: <SchemaTable> {
    name: 'HomeWorldNPCExcelConfigData',
    jsonFile: './ExcelBinOutput/HomeWorldNPCExcelConfigData.json',
    columns: [
      { name: 'FurnitureId', type: 'integer', isPrimary: true },
      { name: 'AvatarId', type: 'string', isIndex: true },
      { name: 'NpcId', type: 'integer', isIndex: true },
      { name: 'ShowNameTextMapHash', type: 'integer', isIndex: true },
      { name: 'DescTextMapHash', type: 'integer', isIndex: true },
    ]
  },
  HomeworldAnimalExcelConfigData: <SchemaTable> {
    name: 'HomeworldAnimalExcelConfigData',
    jsonFile: './ExcelBinOutput/HomeworldAnimalExcelConfigData.json',
    columns: [
      {name: 'FurnitureId', type: 'integer', isPrimary: true},
      {name: 'MonsterId', type: 'integer', isIndex: true},
    ]
  },
  AnimalDescribeExcelConfigData: <SchemaTable> {
    name: 'AnimalDescribeExcelConfigData',
    jsonFile: './ExcelBinOutput/AnimalDescribeExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'NameTextMapHash', type: 'decimal', isIndex: true},
    ]
  },
  AnimalCodexExcelConfigData: <SchemaTable> {
    name: 'AnimalCodexExcelConfigData',
    jsonFile: './ExcelBinOutput/AnimalCodexExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'Type', type: 'string', isIndex: true},
      {name: 'SubType', type: 'string', isIndex: true},
      {name: 'CountType', type: 'string', isIndex: true},
      {name: 'DescribeId', type: 'integer', isIndex: true},
      {name: 'SortOrder', type: 'integer', isIndex: true},
      {name: 'DescTextMapHash', type: 'decimal', isIndex: true},
      {name: 'PushTipsCodexId', type: 'integer', isIndex: true},
    ],
    renameFields: {
      // TODO: This needs to be updated with each new Genshin version!
      OKJGFOKCJNI: 'AltDescTextQuestCondIds', // Version 4.8
      FHNNPAGOHAJ: 'AltDescTextMapHashList',  // Version 4.8

      NBNIFMKJGPA: 'AltDescTextQuestCondIds', // Version 5.0
      NJPCJCOBFMG: 'AltDescTextMapHashList',  // Version 5.0

      OMCFKEGPHCE: 'AltDescTextQuestCondIds', // Version 5.1
      DGCGCIKKNOC: 'AltDescTextMapHashList',  // Version 5.1

      KJCLGJGJGAO: 'AltDescTextQuestCondIds', // Version 5.2
      IPCMEDGHJBB: 'AltDescTextMapHashList',  // Version 5.2

      HJBADDKPFIG: 'AltDescTextQuestCondIds', // Version 5.3
      JFFJEGAKDGC: 'AltDescTextMapHashList',  // Version 5.3

      OOPFECJHJPI: 'AltDescTextQuestCondIds', // Version 5.4
      MGAGMPNHKLF: 'AltDescTextMapHashList',  // Version 5.4
    }
  },
  ReputationQuestExcelConfigData: <SchemaTable> {
    name: 'ReputationQuestExcelConfigData',
    jsonFile: './ExcelBinOutput/ReputationQuestExcelConfigData.json',
    columns: [
      { name: 'ParentQuestId', type: 'integer', isPrimary: true },
      { name: 'CityId', type: 'integer', isIndex: true },
      { name: 'RewardId', type: 'integer' },
      { name: 'TitleTextMapHash', type: 'integer', isIndex: true },
      { name: 'Order', type: 'integer' },
    ],
  },
  CityConfigData: <SchemaTable> {
    name: 'CityConfigData',
    jsonFile: './ExcelBinOutput/CityConfigData.json',
    columns: [
      { name: 'CityId', type: 'integer', isPrimary: true },
      { name: 'CityNameTextMapHash', type: 'integer', isIndex: true },
      { name: 'CityGoddnessNameTextMapHash', type: 'integer', isIndex: true },
      { name: 'CityGoddnessDescTextMapHash', type: 'integer', isIndex: true },
    ],
  },
  FurnitureSuiteExcelConfigData: <SchemaTable> {
    name: 'FurnitureSuiteExcelConfigData',
    jsonFile: './ExcelBinOutput/FurnitureSuiteExcelConfigData.json',
    columns: [
      { name: 'SuiteId', type: 'integer', isPrimary: true },
      { name: 'SuiteNameText', type: 'integer', isIndex: true },
    ],
  },
  FurnitureMakeExcelConfigData: <SchemaTable> {
    name: 'FurnitureMakeExcelConfigData',
    jsonFile: './ExcelBinOutput/FurnitureMakeExcelConfigData.json',
    columns: [
      { name: 'FurnitureItemId', type: 'integer', isPrimary: true },
      { name: 'ConfigId', type: 'integer', isIndex: true },
    ],
  },
  Relation_FurnitureMakeExcelConfigData: <SchemaTable> {
    name: 'Relation_FurnitureMakeExcelConfigData',
    jsonFile: './ExcelBinOutput/FurnitureMakeExcelConfigData.json',
    columns: [
      { name: 'RelationId', type: 'integer', isIndex: true },
      { name: 'RoleId', type: 'integer', isIndex: true },
      { name: 'RoleType', type: 'string', isIndex: true },
    ],
    customRowResolve: (row: FurnitureMakeExcelConfigData) => {
      let ret: MaterialRelation[] = [];
      if (row.FurnitureItemId) {
        ret.push({ RelationId: row.ConfigId, RoleId: row.FurnitureItemId, RoleType: 'output' });
      }
      for (let item of row.MaterialItems) {
        if (item.Id) {
          ret.push({ RelationId: row.ConfigId, RoleId: item.Id, RoleType: 'input' });
        }
      }
      return ret;
    },
  },
  BooksCodexExcelConfigData: <SchemaTable> {
    name: 'BooksCodexExcelConfigData',
    jsonFile: './ExcelBinOutput/BooksCodexExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'MaterialId', type: 'integer', isIndex: true },
    ],
  },
  BookSuitExcelConfigData: <SchemaTable> {
    name: 'BookSuitExcelConfigData',
    jsonFile: './ExcelBinOutput/BookSuitExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'SuitNameTextMapHash', type: 'integer', isIndex: true },
    ],
  },
  LocalizationExcelConfigData: <SchemaTable> {
    name: 'LocalizationExcelConfigData',
    jsonFile: './ExcelBinOutput/LocalizationExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'AssetType', type: 'string', isIndex: true },
      { name: 'ScPath', type: 'string', isIndex: true },
      { name: 'TcPath', type: 'string', isIndex: true },
      { name: 'EnPath', type: 'string', isIndex: true },
      { name: 'KrPath', type: 'string', isIndex: true },
      { name: 'JpPath', type: 'string', isIndex: true },
      { name: 'EsPath', type: 'string', isIndex: true },
      { name: 'FrPath', type: 'string', isIndex: true },
      { name: 'IdPath', type: 'string', isIndex: true },
      { name: 'PtPath', type: 'string', isIndex: true },
      { name: 'RuPath', type: 'string', isIndex: true },
      { name: 'ThPath', type: 'string', isIndex: true },
      { name: 'ViPath', type: 'string', isIndex: true },
      { name: 'DePath', type: 'string', isIndex: true },
      { name: 'TrPath', type: 'string', isIndex: true },
      { name: 'ItPath', type: 'string', isIndex: true },
    ],
  },
  DocumentExcelConfigData: <SchemaTable> {
    name: 'DocumentExcelConfigData',
    jsonFile: './ExcelBinOutput/DocumentExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'TitleTextMapHash', type: 'integer', isIndex: true },
    ],
    renameFields: {
      ContentLocalizedId: 'ContentLocalizedIds',
      QuestContentLocalizedId: 'QuestContentLocalizedIds',
    },
  },
  Relation_LocalizationIdToDocumentId: <SchemaTable> {
    name: 'Relation_LocalizationIdToDocumentId',
    jsonFile: './ExcelBinOutput/DocumentExcelConfigData.json',
    columns: [
      { name: 'LocalizationId', type: 'integer', isIndex: true },
      { name: 'DocumentId', type: 'integer', isIndex: true },
    ],
    renameFields: {
      ContentLocalizedId: 'ContentLocalizedIds',
      QuestContentLocalizedId: 'QuestContentLocalizedIds',
    },
    customRowResolve: (row: DocumentExcelConfigData) => {
      let ret = [];
      if (row.ContentLocalizedIds) {
        for (let contentLocalizedId of row.ContentLocalizedIds) {
          ret.push({LocalizationId: contentLocalizedId, DocumentId: row.Id});
        }
      }
      if (row.QuestContentLocalizedIds) {
        for (let contentLocalizedId of row.QuestContentLocalizedIds) {
          ret.push({LocalizationId: contentLocalizedId, DocumentId: row.Id});
        }
      }
      return ret;
    }
  },
  ReliquaryExcelConfigData: <SchemaTable> {
    name: 'ReliquaryExcelConfigData',
    jsonFile: './ExcelBinOutput/ReliquaryExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'SetId', type: 'integer', isIndex: true },
      { name: 'EquipType', type: 'string', isIndex: true },
      { name: 'StoryId', type: 'integer', isIndex: true },
    ],
  },
  ReliquaryCodexExcelConfigData: <SchemaTable> {
    name: 'ReliquaryCodexExcelConfigData',
    jsonFile: './ExcelBinOutput/ReliquaryCodexExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'SuitId', type: 'integer', isIndex: true },
    ],
  },
  ReliquarySetExcelConfigData: <SchemaTable> {
    name: 'ReliquarySetExcelConfigData',
    jsonFile: './ExcelBinOutput/ReliquarySetExcelConfigData.json',
    columns: [
      { name: 'SetId', type: 'integer', isPrimary: true },
    ],
  },
  WeaponExcelConfigData: <SchemaTable> {
    name: 'WeaponExcelConfigData',
    jsonFile: './ExcelBinOutput/WeaponExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'WeaponType', type: 'integer', isIndex: true },
      { name: 'StoryId', type: 'integer', isIndex: true },
    ],
  },
  WeaponCodexExcelConfigData: <SchemaTable> {
    name: 'WeaponCodexExcelConfigData',
    jsonFile: './ExcelBinOutput/WeaponCodexExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'WeaponId', type: 'integer', isIndex: true },
    ],
  },
  EquipAffixExcelConfigData: <SchemaTable> {
    name: 'EquipAffixExcelConfigData',
    jsonFile: './ExcelBinOutput/EquipAffixExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isIndex: true},
      {name: 'AffixId', type: 'integer', isPrimary: true},
      {name: 'NameTextMapHash', type: 'decimal', isIndex: true},
      {name: 'DescTextMapHash', type: 'decimal', isIndex: true},
      {name: 'Level', type: 'integer', isIndex: true},
    ]
  },
  AchievementExcelConfigData: <SchemaTable> {
    name: 'AchievementExcelConfigData',
    jsonFile: './ExcelBinOutput/AchievementExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'TitleTextMapHash', type: 'integer', isIndex: true },
      { name: 'DescTextMapHash', type: 'integer', isIndex: true },
      { name: 'Ps5TitleTextMapHash', type: 'integer', isIndex: true },
      { name: 'PreStageAchievementId', type: 'integer', isIndex: true },
      { name: 'FinishRewardId', type: 'integer', isIndex: true },
    ],
  },
  AchievementGoalExcelConfigData: <SchemaTable> {
    name: 'AchievementGoalExcelConfigData',
    jsonFile: './ExcelBinOutput/AchievementGoalExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isIndex: true },
      { name: 'NameTextMapHash', type: 'integer', isIndex: true },
      { name: 'FinishRewardId', type: 'integer', isIndex: true },
    ],
  },


  MonsterExcelConfigData: <SchemaTable> {
    name: 'MonsterExcelConfigData',
    jsonFile: './ExcelBinOutput/MonsterExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'Type', type: 'string', isIndex: true },
      { name: 'DescribeId', type: 'integer', isIndex: true },
      { name: 'NameTextMapHash', type: 'integer', isIndex: true },
      { name: 'SecurityLevel', type: 'string', isIndex: true },
      { name: 'VisionLevel', type: 'string', isIndex: true },
    ],
  },
  MonsterDescribeExcelConfigData: <SchemaTable> {
    name: 'MonsterDescribeExcelConfigData',
    jsonFile: './ExcelBinOutput/MonsterDescribeExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'NameTextMapHash', type: 'decimal', isIndex: true },
      { name: 'TitleId', type: 'integer', isIndex: true },
      { name: 'SpecialNameLabId', type: 'integer', isIndex: true },
    ],
  },
  MonsterSpecialNameExcelConfigData: <SchemaTable> {
    name: 'MonsterSpecialNameExcelConfigData',
    jsonFile: './ExcelBinOutput/MonsterSpecialNameExcelConfigData.json',
    columns: [
      { name: 'SpecialNameId', type: 'integer', isPrimary: true },
      { name: 'SpecialNameLabId', type: 'integer', isIndex: true },
      { name: 'SpecialNameTextMapHash', type: 'decimal', isIndex: true },
    ],
  },
  MonsterTitleExcelConfigData: <SchemaTable> {
    name: 'MonsterTitleExcelConfigData',
    jsonFile: './ExcelBinOutput/MonsterTitleExcelConfigData.json',
    columns: [
      { name: 'TitleId', type: 'integer', isPrimary: true },
      { name: 'TitleNameTextMapHash', type: 'decimal', isIndex: true },
    ],
  },

  AvatarCodexExcelConfigData: <SchemaTable> {
    name: 'AvatarCodexExcelConfigData',
    jsonFile: './ExcelBinOutput/AvatarCodexExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'SortFactor', type: 'integer', isIndex: true },
      { name: 'AvatarId', type: 'integer', isIndex: true },
    ],
  },
  AvatarFlycloakExcelConfigData: <SchemaTable> {
    name: 'AvatarFlycloakExcelConfigData',
    jsonFile: './ExcelBinOutput/AvatarFlycloakExcelConfigData.json',
    columns: [
      { name: 'FlycloakId', type: 'integer', isPrimary: true },
      { name: 'NameTextMapHash', type: 'integer', isIndex: true },
      { name: 'DescTextMapHash', type: 'integer', isIndex: true },
      { name: 'MaterialId', type: 'integer', isIndex: true },
    ],
  },
  AvatarCostumeExcelConfigData: <SchemaTable> {
    name: 'AvatarCostumeExcelConfigData',
    jsonFile: './ExcelBinOutput/AvatarCostumeExcelConfigData.json',
    columns: [
      { name: 'SkinId', type: 'integer', isPrimary: true },
      { name: 'IndexId', type: 'integer', isIndex: true },
      { name: 'NameTextMapHash', type: 'decimal', isIndex: true },
      { name: 'DescTextMapHash', type: 'decimal', isIndex: true },
      { name: 'ItemId', type: 'integer', isIndex: true },
      { name: 'CharacterId', type: 'integer', isIndex: true },
      { name: 'Quality', type: 'integer', isIndex: true },
    ],
  },
  GCGTalkExcelConfigData: <SchemaTable> {
    name: 'GCGTalkExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGTalkExcelConfigData.json',
    columns: [
      { name: 'GameId', type: 'integer', isPrimary: true },
      { name: 'HappyTalkId', type: 'integer', isIndex: true },
      { name: 'SadTalkId', type: 'integer', isIndex: true },
      { name: 'ToughTalkId', type: 'integer', isIndex: true },
      { name: 'ElementBurstTalkId', type: 'integer', isIndex: true },
      { name: 'HighHealthTalkId', type: 'integer', isIndex: true },
      { name: 'HighHealthConfigId', type: 'integer', isIndex: true },
      { name: 'LowHealthTalkId', type: 'integer', isIndex: true },
      { name: 'LowHealthConfigId', type: 'integer', isIndex: true },
    ],
    renameFields: {
      ElementBrustTalkId: 'ElementBurstTalkId',
      ElementBrustTalkAppearCount: 'ElementBurstTalkAppearCount',
    },
  },
  GCGTalkDetailExcelConfigData: <SchemaTable> {
    name: 'GCGTalkDetailExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGTalkDetailExcelConfigData.json',
    columns: [
      { name: 'TalkDetailId', type: 'integer', isPrimary: true },
      { name: 'TalkDetailIconId', type: 'integer', isIndex: true },
    ],
    renameFields: {
      TalkCharacterId: 'TalkDetailIconId',
      TalkContent: 'TalkContentTextMapHash'
    },
    singularize: {'TalkDetailIconId': 'TalkDetailIconId'},
  },
  GCGTalkDetailIconExcelConfigData: <SchemaTable> {
    name: 'GCGTalkDetailIconExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGTalkDetailIconExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'Type', type: 'string', isIndex: true },
    ],
  },
  GCGGameExcelConfigData: <SchemaTable> {
    name: 'GCGGameExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGGameExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'RuleId', type: 'integer', isIndex: true },
      { name: 'CardGroupId', type: 'integer', isIndex: true },
      { name: 'EnemyCardGroupId', type: 'integer', isIndex: true },
      { name: 'GameType', type: 'string', isIndex: true },
    ]
  },
  GCGBossLevelExcelConfigData: <SchemaTable> {
    name: 'GCGBossLevelExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGBossLevelExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'NormalLevelId', type: 'integer', isIndex: true },
      { name: 'HardLevelId', type: 'integer', isIndex: true },
      { name: 'UnlockParam', type: 'integer', isIndex: true },
      { name: 'UnlockDecTextMapHash', type: 'integer', isIndex: true },
      { name: 'NpcId', type: 'integer', isIndex: true },
      { name: 'MonsterId', type: 'integer', isIndex: true },
      { name: 'MonsterTitleTextMapHash', type: 'integer', isIndex: true },
    ],
    renameFields: {
      CatId: 'NpcId',
      CatDescTextMapHash: 'MonsterTitleTextMapHash',
    },
  },
  GCGGameRewardExcelConfigData: <SchemaTable> {
    name: 'GCGGameRewardExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGGameRewardExcelConfigData.json',
    columns: [
      { name: 'LevelId', type: 'integer', isPrimary: true },
      { name: 'LevelNameTextMapHash', type: 'integer', isIndex: true },
      { name: 'LevelDecTextMapHash', type: 'integer', isIndex: true },
      { name: 'GroupId', type: 'integer', isIndex: true },
    ],
    renameFields: {
      OppoAvatarPicId: 'TalkDetailIconId',
      RewardDec: 'ObjectiveTextMapHashList',
    },
  },
  GCGChallengeExcelConfigData: <SchemaTable> {
    name: 'GCGChallengeExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGChallengeExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'Type', type: 'string', isIndex: true },
    ]
  },
  GCGTutorialTextExcelConfigData: <SchemaTable> {
    name: 'GCGTutorialTextExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGTutorialTextExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'TutorialTextId', type: 'integer', isIndex: true },
      { name: 'TutorialTextMapHash', type: 'integer', isIndex: true },
    ],
    renameFields: {
      Id: 'TutorialTextId',
      CommentTextMapHash: 'TutorialTextMapHash',
    },
  },
  GCGRuleExcelConfigData: <SchemaTable> {
    name: 'GCGRuleExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGRuleExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
    ],
  },
  GCGRuleTextExcelConfigData: <SchemaTable> {
    name: 'GCGRuleTextExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGRuleTextExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'TitleTextMapHash', type: 'integer', isIndex: true },
    ],
  },
  GCGRuleTextDetailExcelConfigData: <SchemaTable> {
    name: 'GCGRuleTextDetailExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGRuleTextDetailExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'TitleTextMapHash', type: 'integer', isIndex: true },
      { name: 'ContentTextMapHash', type: 'integer', isIndex: true },
    ],
    renameFields: {
      PicName: 'Icon',
    },
  },
  GCGLevelLockExcelConfigData: <SchemaTable> {
    name: 'GCGLevelLockExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGLevelLockExcelConfigData.json',
    columns: [
      { name: 'LevelId', type: 'integer', isPrimary: true },
      { name: 'UnlockLevel', type: 'integer', isIndex: true },
      { name: 'UnlockMainQuestId', type: 'integer', isIndex: true },
      { name: 'UnlockDescTextMapHash', type: 'integer', isIndex: true },
      { name: 'QuestTitleTextMapHash', type: 'integer', isIndex: true },
      { name: 'QuestDescTextMapHash', type: 'integer', isIndex: true },
    ],
  },
  GcgOtherLevelExcelConfigData: <SchemaTable> {
    name: 'GcgOtherLevelExcelConfigData',
    jsonFile: './ExcelBinOutput/GcgOtherLevelExcelConfigData.json',
    columns: [
      { name: 'LevelId', type: 'integer', isPrimary: true },
    ],
  },
  GCGQuestLevelExcelConfigData: <SchemaTable> {
    name: 'GCGQuestLevelExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGQuestLevelExcelConfigData.json',
    columns: [
      { name: 'LevelId', type: 'integer', isPrimary: true },
      { name: 'QuestId', type: 'integer', isIndex: true },
    ],
  },
  GCGWorldLevelExcelConfigData: <SchemaTable> {
    name: 'GCGWorldLevelExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGWorldLevelExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'NpcId', type: 'integer', isIndex: true },
      { name: 'LevelId', type: 'integer', isIndex: true },
      { name: 'LevelTitleTextMapHash', type: 'integer', isIndex: true },
      { name: 'MapDescTextMapHash', type: 'integer', isIndex: true },
      { name: 'TalkId', type: 'integer', isIndex: true },
    ],
    renameFields: {
      LevelDecTextMapHash: 'MapDescTextMapHash',
    },
  },
  GcgWorldWorkTimeExcelConfigData: <SchemaTable> {
    name: 'GcgWorldWorkTimeExcelConfigData',
    jsonFile: './ExcelBinOutput/GcgWorldWorkTimeExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
    ]
  },
  GCGWeekLevelExcelConfigData: <SchemaTable> {
    name: 'GCGWeekLevelExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGWeekLevelExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'NpcId', type: 'integer', isIndex: true },
      { name: 'NpcType', type: 'string', isIndex: true },
      { name: 'OpenQuestId', type: 'integer', isIndex: true },
    ]
  },
  GCGCardExcelConfigData: <SchemaTable> {
    name: 'GCGCardExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGCardExcelConfigData.json',
    columns: [
      { name: 'CardType', type: 'string', isIndex: true },
      { name: 'ChooseTargetType', type: 'string', isIndex: true },
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'NameTextMapHash', type: 'integer', isIndex: true },
      { name: 'DescTextMapHash', type: 'integer', isIndex: true },
    ],
  },
  GCGCardFaceExcelConfigData: <SchemaTable> {
    name: 'GCGCardFaceExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGCardFaceExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'ItemId', type: 'integer', isIndex: true },
      { name: 'CardId', type: 'integer', isIndex: true },
      { name: 'ShopGoodId', type: 'integer', isIndex: true },
      { name: 'NameTextMapHash', type: 'integer', isIndex: true },
      { name: 'DescTextMapHash', type: 'integer', isIndex: true },
    ],
  },
  GCGCardViewExcelConfigData: <SchemaTable> {
    name: 'GCGCardViewExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGCardViewExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
    ]
  },
  GCGCharExcelConfigData: <SchemaTable> {
    name: 'GCGCharExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGCharExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'NameTextMapHash', type: 'integer', isIndex: true },
      { name: 'DescTextMapHash', type: 'integer', isIndex: true },
    ]
  },
  GCGCharacterLevelExcelConfigData: <SchemaTable> {
    name: 'GCGCharacterLevelExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGCharacterLevelExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'NpcId', type: 'integer', isIndex: true },
      { name: 'AvatarId', type: 'integer', isIndex: true },
      { name: 'NormalLevelId', type: 'integer', isIndex: true },
      { name: 'HardLevelId', type: 'integer', isIndex: true },
      { name: 'WinNormalLevelTalkId', type: 'integer', isIndex: true },
      { name: 'LoseNormalLevelTalkId', type: 'integer', isIndex: true },
      { name: 'WinHardLevelTalkId', type: 'integer', isIndex: true },
      { name: 'LoseHardLevelTalkId', type: 'integer', isIndex: true },
    ],
    renameFields: {
      NormalWinTalk: 'WinNormalLevelTalkId',
      NormalLossTalk: 'LoseNormalLevelTalkId',
      HardWinTalk: 'WinHardLevelTalkId',
      HardLossTalk: 'LoseHardLevelTalkId',
    },
  },
  Relation_GCGGameToWeekLevel: <SchemaTable> {
    name: 'Relation_GCGGameToWeekLevel',
    jsonFile: './ExcelBinOutput/GCGWeekLevelExcelConfigData.json',
    columns: [
      { name: 'LevelId', type: 'integer', isIndex: true },
      { name: 'WeekLevelId', type: 'integer', isIndex: true },
      { name: 'GcgLevel', type: 'integer', isIndex: true },
    ],
    customRowResolve: (row: GCGWeekLevelExcelConfigData) => {
      let ret = [];
      if (row.LevelCondList) {
        for (let levelCond of row.LevelCondList) {
          ret.push({ LevelId: levelCond.LevelId, WeekLevelId: row.Id, GcgLevel: levelCond.GcgLevel });
        }
      }
      return ret;
    }
  },
  Relation_GCGCharacterLevel: <SchemaTable> {
    name: 'Relation_GCGCharacterLevel',
    jsonFile: './ExcelBinOutput/GCGCharacterLevelExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isIndex: true },
      { name: 'LevelId', type: 'integer', isIndex: true },
    ],
    customRowResolve: (row: GCGCharacterLevelExcelConfigData) => {
      let ret = [];
      if (row.NormalLevelId) {
        ret.push({ Id: row.Id, LevelId: row.NormalLevelId });
      }
      if (row.HardLevelId) {
        ret.push({ Id: row.Id, LevelId: row.HardLevelId });
      }
      if (row.NormalLevelList && row.NormalLevelList.length) {
        for (let level of row.NormalLevelList) {
          if (level.LevelId !== row.NormalLevelId) {
            ret.push({ Id: row.Id, LevelId: level.LevelId });
          }
        }
      }
      return ret;
    },
  },
  GCGElementReactionExcelConfigData: <SchemaTable> {
    name: 'GCGElementReactionExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGElementReactionExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'ElementType1', type: 'string', isIndex: true },
      { name: 'ElementType2', type: 'string', isIndex: true },
      { name: 'SkillId', type: 'integer', isIndex: true },
    ],
  },
  GCGSkillExcelConfigData: <SchemaTable> {
    name: 'GCGSkillExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGSkillExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'NameTextMapHash', type: 'integer', isIndex: true },
      { name: 'DescTextMapHash', type: 'integer', isIndex: true },
    ]
  },
  GCGChooseExcelConfigData: <SchemaTable> {
    name: 'GCGChooseExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGChooseExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'CardType', type: 'string', isIndex: true },
      { name: 'TargetCamp', type: 'string', isIndex: true },
      { name: 'ChooseType', type: 'string', isIndex: true },
    ],
    renameFields: {
      TargetHintTextMapHash: 'ChooseTextMapHash',
      SelectIconType: 'ChooseType',
    },
  },
  GCGDeckExcelConfigData: <SchemaTable> {
    name: 'GCGDeckExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGDeckExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
    ],
    renameFields: {
      // TODO: This needs to be updated with each new Genshin version!
      NELFLFMMGAP: 'DeckNameTextMapHash', // Version 4.8
      BPNAAGAPHDJ: 'DeckNameTextMapHash', // Version 5.0
      LGIODDPABGJ: 'DeckNameTextMapHash', // Version 5.1
      JFEDJIADOFN: 'DeckNameTextMapHash', // Version 5.2
      GNLKCFEEANH: 'DeckNameTextMapHash', // Version 5.3
      OBKACJAAEJJ: 'DeckNameTextMapHash', // Version 5.4
    }
  },
  GCGDeckCardExcelConfigData: <SchemaTable> {
    name: 'GCGDeckCardExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGDeckCardExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
    ],
    renameFields: {
      FaceIdList: 'CardFaceIdList',
      StoryDescTextMapHash: 'StoryContextTextMapHash',
      AccessDescTextMapHash: 'SourceTextMapHash'
    },
  },
  GCGProficiencyRewardExcelConfigData: <SchemaTable> {
    name: 'GCGProficiencyRewardExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGProficiencyRewardExcelConfigData.json',
    columns: [
      { name: 'CardId', type: 'integer', isPrimary: true },
    ],
  },
  GCGDeckFaceLinkExcelConfigData: <SchemaTable> {
    name: 'GCGDeckFaceLinkExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGDeckFaceLinkExcelConfigData.json',
    columns: [
      { name: 'CardId', type: 'integer', isIndex: true },
      { name: 'DeckCardId', type: 'integer', isIndex: true },
    ],
    renameFields: {
      MasterCardId: 'DeckCardId',
    },
  },
  GCGTokenDescConfigData: <SchemaTable> {
    name: 'GCGTokenDescConfigData',
    jsonFile: './ExcelBinOutput/GCGTokenDescConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'NameTextMapHash', type: 'integer', isIndex: true },
    ],
  },
  GCGSkillTagExcelConfigData: <SchemaTable> {
    name: 'GCGSkillTagExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGSkillTagExcelConfigData.json',
    columns: [
      { name: 'Type', type: 'string', isPrimary: true },
      { name: 'NameTextMapHash', type: 'integer', isIndex: true },
      { name: 'KeywordId', type: 'integer', isIndex: true },
    ]
  },
  GCGTagExcelConfigData: <SchemaTable> {
    name: 'GCGTagExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGTagExcelConfigData.json',
    columns: [
      { name: 'Type', type: 'string', isPrimary: true },
      { name: 'CategoryType', type: 'string', isIndex: true },
      { name: 'NameTextMapHash', type: 'integer', isIndex: true },
    ],
    renameFields: {
      Identifier: 'CategoryType'
    },
    singularize: {'CategoryType': 'CategoryType'},
  },
  GCGKeywordExcelConfigData: <SchemaTable> {
    name: 'GCGKeywordExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGKeywordExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'TitleTextMapHash', type: 'integer', isIndex: true },
      { name: 'DescTextMapHash', type: 'integer', isIndex: true },
    ],
  },
  GCGCostExcelConfigData: <SchemaTable> {
    name: 'GCGCostExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGCostExcelConfigData.json',
    columns: [
      { name: 'Type', type: 'string', isPrimary: true },
      { name: 'KeywordId', type: 'integer', isIndex: true },
    ]
  },
  GCGDeckStorageExcelConfigData: <SchemaTable> { // Configuration for deck-saving slots for player level rewards
    name: 'GCGDeckStorageExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGDeckStorageExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'UnlockCond', type: 'string', isIndex: true },
      { name: 'UnlockParam', type: 'integer', isIndex: true },
      { name: 'UnlockCondTextTextMapHash', type: 'integer', isIndex: true },
    ],
    renameFields: {
      UnlockCondTextTextMapHash: 'UnlockCondTextMapHash'
    }
  },
  GCGDeckBackExcelConfigData: <SchemaTable> { // "Card Back" items, e.g. [[Dandelion_Seed_(Card_Back)]] or [[Legend]]
    name: 'GCGDeckBackExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGDeckBackExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'ItemId', type: 'integer', isIndex: true },
      { name: 'NameTextMapHash', type: 'integer', isIndex: true },
      { name: 'DescTextMapHash', type: 'integer', isIndex: true },
      { name: 'Order', type: 'integer', isIndex: true },
    ]
  },
  GCGDeckFieldExcelConfigData: <SchemaTable> { // "Card Box" items, e.g. [[Liyue_(Card_Box)]]
    name: 'GCGDeckFieldExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGDeckFieldExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'ItemId', type: 'integer', isIndex: true },
      { name: 'NameTextMapHash', type: 'integer', isIndex: true },
      { name: 'DescTextMapHash', type: 'integer', isIndex: true },
      { name: 'UnlockCondTextMapHash', type: 'integer', isIndex: true },
      { name: 'Order', type: 'integer', isIndex: true },
      { name: 'BattleTableId', type: 'integer', isIndex: true },
      { name: 'DiceTableId', type: 'integer', isIndex: true },
    ],
    renameFields: {
      UnlockCondTextTextMapHash: 'UnlockCondTextMapHash'
    }
  },
  FettersExcelConfigData: <SchemaTable> {
    name: 'FettersExcelConfigData',
    jsonFile: './ExcelBinOutput/FettersExcelConfigData.json',
    columns: [
      { name: 'Type', type: 'integer', isIndex: true },
      { name: 'VoiceTitleTextMapHash', type: 'integer', isIndex: true },
      { name: 'VoiceFileTextMapHash', type: 'integer', isIndex: true },
      { name: 'VoiceTitleLockedTextMapHash', type: 'integer', isIndex: true },
      { name: 'FetterId', type: 'integer', isPrimary: true },
      { name: 'AvatarId', type: 'integer', isIndex: true },
    ],
    renameFields: {
      IsHiden: 'IsHidden'
    },
  },
  FetterStoryExcelConfigData: <SchemaTable> {
    name: 'FetterStoryExcelConfigData',
    jsonFile: './ExcelBinOutput/FetterStoryExcelConfigData.json',
    columns: [
      { name: 'Type', type: 'integer', isIndex: true },
      { name: 'VoiceTitleTextMapHash', type: 'integer', isIndex: true },
      { name: 'VoiceFileTextMapHash', type: 'integer', isIndex: true },
      { name: 'VoiceTitleLockedTextMapHash', type: 'integer', isIndex: true },
      { name: 'FetterId', type: 'integer', isPrimary: true },
      { name: 'AvatarId', type: 'integer', isIndex: true },
    ]
  },
  TutorialExcelConfigData: <SchemaTable> {
    name: 'TutorialExcelConfigData',
    jsonFile: './ExcelBinOutput/TutorialExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
    ],
  },
  TutorialDetailExcelConfigData: <SchemaTable> {
    name: 'TutorialDetailExcelConfigData',
    jsonFile: './ExcelBinOutput/TutorialDetailExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'DescriptTextMapHash', type: 'integer', isIndex: true },
    ],
  },
  TutorialCatalogExcelConfigData: <SchemaTable> {
    name: 'TutorialCatalogExcelConfigData',
    jsonFile: './ExcelBinOutput/TutorialCatalogExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'PushTipsId', type: 'integer', isIndex: true },
      { name: 'TitleTextMapHash', type: 'integer', isIndex: true },
    ],
  },

  PushTipsConfigData: <SchemaTable> {
    name: 'PushTipsConfigData',
    jsonFile: './ExcelBinOutput/PushTipsConfigData.json',
    columns: [
      { name: 'PushTipsId', type: 'integer', isPrimary: true },
      { name: 'PushTipsType', type: 'string', isIndex: true },
      { name: 'CodexType', type: 'string', isIndex: true },
      { name: 'TitleTextMapHash', type: 'integer', isIndex: true },
      { name: 'SubtitleTextMapHash', type: 'integer', isIndex: true },
      { name: 'TutorialId', type: 'integer', isIndex: true },
      { name: 'GroupId', type: 'integer', isIndex: true },
    ],
  },
  PushTipsCodexExcelConfigData: <SchemaTable> {
    name: 'PushTipsCodexExcelConfigData',
    jsonFile: './ExcelBinOutput/PushTipsCodexExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'PushTipId', type: 'integer', isIndex: true },
      { name: 'SortOrder', type: 'integer', isIndex: true },
    ],
  },
  ViewCodexExcelConfigData: <SchemaTable> {
    name: 'ViewCodexExcelConfigData',
    jsonFile: './ExcelBinOutput/ViewCodexExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'SceneId', type: 'integer', isIndex: true },
      { name: 'GroupId', type: 'integer', isIndex: true },
      { name: 'ConfigId', type: 'integer', isIndex: true },
      { name: 'NameTextMapHash', type: 'integer', isIndex: true },
      { name: 'DescTextMapHash', type: 'integer', isIndex: true },
      { name: 'CityId', type: 'integer', isIndex: true },
      { name: 'WorldAreaId', type: 'integer', isIndex: true },
      { name: 'SortOrder', type: 'integer', isIndex: true },
    ],
  },
  WorldAreaConfigData: <SchemaTable> {
    name: 'WorldAreaConfigData',
    jsonFile: './ExcelBinOutput/WorldAreaConfigData.json',
    columns: [
      { name: 'ElementType', type: 'string', isIndex: true },
      { name: 'TerrainType', type: 'string', isIndex: true },
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'SceneId', type: 'integer', isIndex: true },
      { name: 'AreaType', type: 'string', isIndex: true },
      { name: 'AreaNameTextMapHash', type: 'integer', isIndex: true },
      { name: 'TowerPointId', type: 'integer', isIndex: true },
    ],
  },
  NewActivityExcelConfigData: <SchemaTable> {
    name: 'NewActivityExcelConfigData',
    jsonFile: './ExcelBinOutput/NewActivityExcelConfigData.json',
    columns: [
      { name: 'ActivityId', type: 'integer', isPrimary: true },
      { name: 'ActivityType', type: 'string', isIndex: true },
      { name: 'NameTextMapHash', type: 'integer', isIndex: true },
    ],
  },
  NewActivityEntryConfigData: <SchemaTable> {
    name: 'NewActivityEntryConfigData',
    jsonFile: './ExcelBinOutput/NewActivityEntryConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'ActivityType', type: 'string', isIndex: true },
      { name: 'TabNameTextMapHash', type: 'integer', isIndex: true },
    ],
  },
  FetterInfoExcelConfigData: <SchemaTable> {
    name: 'FetterInfoExcelConfigData',
    jsonFile: './ExcelBinOutput/FetterInfoExcelConfigData.json',
    columns: [
      { name: 'FetterId', type: 'integer', isPrimary: true },
      { name: 'AvatarId', type: 'integer', isIndex: true },
      { name: 'AvatarNativeTextMapHash', type: 'integer', isIndex: true },
      { name: 'AvatarVisionBeforTextMapHash', type: 'integer', isIndex: true },
      { name: 'AvatarConstellationBeforTextMapHash', type: 'integer', isIndex: true },
      { name: 'AvatarTitleTextMapHash', type: 'integer', isIndex: true },
      { name: 'AvatarDetailTextMapHash', type: 'integer', isIndex: true },
      { name: 'AvatarAssocType', type: 'string', isIndex: true },
      { name: 'CvChineseTextMapHash', type: 'integer', isIndex: true },
      { name: 'CvJapaneseTextMapHash', type: 'integer', isIndex: true },
      { name: 'CvEnglishTextMapHash', type: 'integer', isIndex: true },
      { name: 'CvKoreanTextMapHash', type: 'integer', isIndex: true },
      { name: 'AvatarVisionAfterTextMapHash', type: 'integer', isIndex: true },
      { name: 'AvatarConstellationAfterTextMapHash', type: 'integer', isIndex: true },
    ],
    renameFields: {
      'AvatarVisionBeforText': 'AvatarVisionBeforeText',
      'AvatarConstellationBeforText': 'AvatarConstellationBeforeText',
    },
  },
  DungeonExcelConfigData: <SchemaTable> {
    name: 'DungeonExcelConfigData',
    jsonFile: './ExcelBinOutput/DungeonExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'Type', type: 'string', isIndex: true },
      { name: 'SubType', type: 'string', isIndex: true },
      { name: 'InvolveType', type: 'string', isIndex: true },
      { name: 'SettleUIType', type: 'string', isIndex: true },
      { name: 'StateType', type: 'string', isIndex: true },
      { name: 'PlayType', type: 'string', isIndex: true },
      { name: 'NameTextMapHash', type: 'integer', isIndex: true },
      { name: 'DisplayNameTextMapHash', type: 'integer', isIndex: true },
      { name: 'DescTextMapHash', type: 'integer', isIndex: true },
      { name: 'SceneId', type: 'integer', isIndex: true },
      { name: 'ShowLevel', type: 'integer', isIndex: true },
      { name: 'LimitLevel', type: 'integer', isIndex: true },
      { name: 'GearDescTextMapHash', type: 'integer', isIndex: true },
      { name: 'CityId', type: 'integer', isIndex: true },
      { name: 'PassRewardPreviewId', type: 'integer', isIndex: true },
      { name: 'FirstPassRewardPreviewId', type: 'integer', isIndex: true },
    ],
  },
  DungeonPassExcelConfigData: <SchemaTable> {
    name: 'DungeonPassExcelConfigData',
    jsonFile: './ExcelBinOutput/DungeonPassExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'LogicType', type: 'string', isIndex: true },
    ],
  },
  DungeonEntryExcelConfigData: <SchemaTable> {
    name: 'DungeonEntryExcelConfigData',
    jsonFile: './ExcelBinOutput/DungeonEntryExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'Type', type: 'string', isIndex: true },
      { name: 'DungeonEntryId', type: 'integer', isIndex: true },
      { name: 'DescTextMapHash', type: 'integer', isIndex: true },
      { name: 'SystemOpenUiId', type: 'integer', isIndex: true },
      { name: 'RewardDataId', type: 'integer', isIndex: true },
    ],
  },
  DungeonElementChallengeExcelConfigData: <SchemaTable> {
    name: 'DungeonElementChallengeExcelConfigData',
    jsonFile: './ExcelBinOutput/DungeonElementChallengeExcelConfigData.json',
    columns: [
      { name: 'DungeonId', type: 'integer', isPrimary: true },
      { name: 'TutorialId', type: 'integer', isIndex: true },
    ],
  },
  DungeonChallengeConfigData: <SchemaTable> {
    name: 'DungeonChallengeConfigData',
    jsonFile: './ExcelBinOutput/DungeonChallengeConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'ChallengeType', type: 'string', isIndex: true },
      { name: 'TargetTextTemplateTextMapHash', type: 'integer', isIndex: true },
      { name: 'SubTargetTextTemplateTextMapHash', type: 'integer', isIndex: true },
      { name: 'ProgressTextTemplateTextMapHash', type: 'integer', isIndex: true },
      { name: 'SubProgressTextTemplateTextMapHash', type: 'integer', isIndex: true },
      { name: 'InterruptButtonType', type: 'string', isIndex: true },
    ],
  },
  DungeonLevelEntityConfigData: <SchemaTable> {
    name: 'DungeonLevelEntityConfigData',
    jsonFile: './ExcelBinOutput/DungeonLevelEntityConfigData.json',
    columns: [
      { name: 'ClientId', type: 'integer', isPrimary: true },
      { name: 'Id', type: 'integer', isIndex: true },
      { name: 'DescTextMapHash', type: 'integer', isIndex: true },
      { name: 'SwitchTitleTextMapHash', type: 'integer', isIndex: true },
    ],
  },
  SpriteTagExcelConfigData: <SchemaTable> {
    name: 'SpriteTagExcelConfigData',
    jsonFile: './ExcelBinOutput/SpriteTagExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'Image', type: 'string' },
    ],
    renameFields: {
      'SpritePath': 'Image',
    },
  },

  CombineExcelConfigData: <SchemaTable> {
    name: 'CombineExcelConfigData',
    jsonFile: './ExcelBinOutput/CombineExcelConfigData.json',
    columns: [
      { name: 'CombineId', type: 'integer', isPrimary: true },

      { name: 'RecipeType', type: 'string', isIndex: true },
      { name: 'PlayerLevel', type: 'integer', isIndex: true },
      { name: 'CombineType', type: 'integer', isIndex: true },
      { name: 'SubCombineType', type: 'integer', isIndex: true },
      { name: 'ResultItemId', type: 'integer', isIndex: true },
      { name: 'EffectDescTextMapHash', type: 'integer', isIndex: true },
    ],
  },
  Relation_CombineExcelConfigData: <SchemaTable> {
    name: 'Relation_CombineExcelConfigData',
    jsonFile: './ExcelBinOutput/CombineExcelConfigData.json',
    columns: [
      { name: 'RelationId', type: 'integer', isIndex: true },
      { name: 'RoleId', type: 'integer', isIndex: true },
      { name: 'RoleType', type: 'string', isIndex: true },
    ],
    customRowResolve: (row: CombineExcelConfigData) => {
      let ret: MaterialRelation[] = [];
      if (row.ResultItemId) {
        ret.push({ RelationId: row.CombineId, RoleId: row.ResultItemId, RoleType: 'output' });
      }
      for (let item of row.MaterialItems) {
        if (item.Id) {
          ret.push({ RelationId: row.CombineId, RoleId: item.Id, RoleType: 'input' });
        }
      }
      return ret;
    },
  },
  CompoundExcelConfigData: <SchemaTable> {
    name: 'CompoundExcelConfigData',
    jsonFile: './ExcelBinOutput/CompoundExcelConfigData.json',
    columns: [
      { name: 'Type', type: 'string', isIndex: true },
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'GroupId', type: 'integer', isIndex: true },
      { name: 'NameTextMapHash', type: 'integer', isIndex: true },
      { name: 'RankLevel', type: 'integer', isIndex: true },
      { name: 'DescTextMapHash', type: 'integer', isIndex: true },
      { name: 'CountDescTextMapHash', type: 'integer', isIndex: true },
    ],
  },
  Relation_CompoundExcelConfigData: <SchemaTable> {
    name: 'Relation_CompoundExcelConfigData',
    jsonFile: './ExcelBinOutput/CompoundExcelConfigData.json',
    columns: [
      { name: 'RelationId', type: 'integer', isIndex: true },
      { name: 'RoleId', type: 'integer', isIndex: true },
      { name: 'RoleType', type: 'string', isIndex: true },
    ],
    customRowResolve: (row: CompoundExcelConfigData) => {
      let ret: MaterialRelation[] = [];
      for (let item of row.InputVec) {
        if (item.Id) {
          ret.push({ RelationId: row.Id, RoleId: item.Id, RoleType: 'input' });
        }
      }
      for (let item of row.OutputVec) {
        if (item.Id) {
          ret.push({ RelationId: row.Id, RoleId: item.Id, RoleType: 'output' });
        }
      }
      return ret;
    },
  },
  CookRecipeExcelConfigData: <SchemaTable> {
    name: 'CookRecipeExcelConfigData',
    jsonFile: './ExcelBinOutput/CookRecipeExcelConfigData.json',
    columns: [
      { name: 'FoodType', type: 'string', isIndex: true },
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'NameTextMapHash', type: 'integer', isIndex: true },
      { name: 'RankLevel', type: 'integer', isIndex: true },
      { name: 'DescTextMapHash', type: 'integer', isIndex: true },
    ],
  },
  CookBonusExcelConfigData: <SchemaTable> {
    name: 'CookBonusExcelConfigData',
    jsonFile: './ExcelBinOutput/CookBonusExcelConfigData.json',
    columns: [
      { name: 'RecipeId', type: 'integer', isPrimary: true },
      { name: 'AvatarId', type: 'integer', isIndex: true },
      { name: 'ResultItemId', type: 'integer', isIndex: true },
    ],
    singularize: {
      ParamVec: 'ResultItemId'
    }
  },
  Relation_CookRecipeExcelConfigData: <SchemaTable> {
    name: 'Relation_CookRecipeExcelConfigData',
    jsonFile: './ExcelBinOutput/CookRecipeExcelConfigData.json',
    columns: [
      { name: 'RelationId', type: 'integer', isIndex: true },
      { name: 'RoleId', type: 'integer', isIndex: true },
      { name: 'RoleType', type: 'string', isIndex: true },
    ],
    customRowResolve: (row: CookRecipeExcelConfigData) => {
      let ret: MaterialRelation[] = [];
      for (let item of row.InputVec) {
        if (item.Id) {
          ret.push({ RelationId: row.Id, RoleId: item.Id, RoleType: 'input' });
        }
      }
      for (let item of row.QualityOutputVec) {
        if (item.Id) {
          ret.push({ RelationId: row.Id, RoleId: item.Id, RoleType: 'output' });
        }
      }
      return ret;
    },
  },
  Relation_CookBonusExcelConfigData: <SchemaTable> {
    name: 'Relation_CookBonusExcelConfigData',
    jsonFile: './ExcelBinOutput/CookBonusExcelConfigData.json',
    columns: [
      { name: 'RelationId', type: 'integer', isIndex: true },
      { name: 'RoleId', type: 'integer', isIndex: true },
      { name: 'RoleType', type: 'string', isIndex: true },
    ],
    customRowResolveProvider: async () => {
      // Cannot import GenshinControl from this file (genshin.schema.ts) which is why we're using a dynamic import.
      return (await import('./genshin.customRowResolvers')).Relation_CookBonusExcelConfigData_resolver;
    },
  },
  ForgeExcelConfigData: <SchemaTable> {
    name: 'ForgeExcelConfigData',
    jsonFile: './ExcelBinOutput/ForgeExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'PlayerLevel', type: 'integer', isIndex: true },
      { name: 'ForgeType', type: 'integer', isIndex: true },
      { name: 'ShowItemId', type: 'integer', isIndex: true },
      { name: 'ShowConsumeItemId', type: 'integer', isIndex: true },
      { name: 'ResultItemId', type: 'integer', isIndex: true },
      { name: 'ForgePointNoticeTextMapHash', type: 'integer', isIndex: true },
    ],
  },
  Relation_ForgeExcelConfigData: <SchemaTable> {
    name: 'Relation_ForgeExcelConfigData',
    jsonFile: './ExcelBinOutput/ForgeExcelConfigData.json',
    columns: [
      { name: 'RelationId', type: 'integer', isIndex: true },
      { name: 'RoleId', type: 'integer', isIndex: true },
      { name: 'RoleType', type: 'string', isIndex: true },
    ],
    customRowResolve: (row: ForgeExcelConfigData) => {
      let ret: MaterialRelation[] = [];
      if (row.ResultItemId) {
        ret.push({ RelationId: row.Id, RoleId: row.ResultItemId, RoleType: 'output' });
      }
      for (let item of row.MaterialItems) {
        if (item.Id) {
          ret.push({ RelationId: row.Id, RoleId: item.Id, RoleType: 'input' });
        }
      }
      return ret;
    },
  },
  CodexQuestExcelConfigData: <SchemaTable> {
    name: 'CodexQuestExcelConfigData',
    jsonFile: './ExcelBinOutput/CodexQuestExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'string', isPrimary: true},
      {name: 'MainQuestId', type: 'integer', isIndex: true},
    ]
  },
  GivingExcelConfigData: <SchemaTable> {
    name: 'GivingExcelConfigData',
    jsonFile: './ExcelBinOutput/GivingExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'GivingType', type: 'string', isIndex: true},
      {name: 'TalkId', type: 'integer', isIndex: true},
      {name: 'MistakeTalkId', type: 'integer', isIndex: true},
      {name: 'ExactFinishTalkId', type: 'integer', isIndex: true},
    ]
  },
  GivingGroupExcelConfigData: <SchemaTable> {
    name: 'GivingGroupExcelConfigData',
    jsonFile: './ExcelBinOutput/GivingGroupExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'FinishTalkId', type: 'integer', isIndex: true},
      {name: 'MistakeTalkId', type: 'integer', isIndex: true},
      {name: 'FinishDialogId', type: 'integer', isIndex: true},
    ]
  },
};

for (let [tableName, propertySchemaData] of Object.entries(propertySchema)) {
  if (!Object.keys(propertySchemaData).length) {
    continue;
  }

  for (let schemaTable of Object.values(genshinSchema)) {
    if (schemaTable.name === tableName) {
      schemaTable.propertySchema = propertySchemaData;
    } else if (schemaTable.jsonFile.endsWith('/' + tableName + '.json')) {
      schemaTable.propertySchema = propertySchemaData;
    }
  }
}
