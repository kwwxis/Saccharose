import '../../setup';
import {openKnex} from '@db';
import config from '@/config';
import objectPath from 'object-path';
import { SchemaTable, SEP } from './import_types';
import { TalkExcelConfigData, MaterialExcelConfigData } from '@types';

export const schema = {
  DialogExcelConfigData: <SchemaTable> {
    name: 'DialogExcelConfigData',
    jsonFile: './ExcelBinOutput/DialogExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'TalkRoleType', type: 'string', resolve: 'TalkRole.Type', isIndex: true},
      {name: 'TalkRoleId', type: 'string', resolve: 'TalkRole.Id', isIndex: true},
      {name: 'TalkContentTextMapHash', type: 'integer', isIndex: true},
      {name: 'TalkTitleTextMapHash', type: 'integer', isIndex: true},
      {name: 'TalkRoleNameTextMapHash', type: 'integer', isIndex: true},
    ],
    skip: true
  },
  ManualTextMapConfigData: <SchemaTable> {
    name: 'ManualTextMapConfigData',
    jsonFile: './ExcelBinOutput/ManualTextMapConfigData.json',
    columns: [
      {name: 'TextMapId', type: 'string', isPrimary: true},
      {name: 'TextMapContentTextMapHash', type: 'integer', isIndex: true},
    ],
    skip: true
  },
  NpcExcelConfigData: <SchemaTable> {
    name: 'NpcExcelConfigData',
    jsonFile: './ExcelBinOutput/NpcExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true}
    ],
    skip: true
  },
  TalkExcelConfigData: <SchemaTable> {
    name: 'TalkExcelConfigData',
    jsonFile: './ExcelBinOutput/TalkExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'InitDialog', type: 'integer', isIndex: true},
      {name: 'QuestId', type: 'integer', isIndex: true},
      {name: 'QuestCondStateEqualFirst', type: 'integer', isIndex: true, resolve(row: TalkExcelConfigData) {
        if (row.BeginCond) {
          let questCondStateEqual = row.BeginCond.find(cond => cond.Type === 'QUEST_COND_STATE_EQUAL');
          if (questCondStateEqual && Array.isArray(questCondStateEqual.Param)) {
            try {
              if (typeof questCondStateEqual.Param[0] === 'string') {
                return parseInt(questCondStateEqual.Param[0]);
              } else {
                return questCondStateEqual.Param[0];
              }
            } catch (e) {
              return null;
            }
          }
        }
        return null;
      }}
    ],
    skip: true
  },
  Relation_NpcToTalk: <SchemaTable> {
    name: 'Relation_NpcToTalk',
    jsonFile: './ExcelBinOutput/TalkExcelConfigData.json',
    columns: [
      {name: 'NpcId', type: 'integer', isIndex: true},
      {name: 'TalkId', type: 'integer'},
    ],
    customRowResolve: (row: TalkExcelConfigData) => {
      if (row.NpcId && row.NpcId.length) {
        return row.NpcId.map(npcId => ({NpcId: npcId, TalkId: row.Id}));
      }
      return [];
    },
    skip: true
  },
  MainQuestExcelConfigData: <SchemaTable> {
    name: 'MainQuestExcelConfigData',
    jsonFile: './ExcelBinOutput/MainQuestExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'Series', type: 'integer', isIndex: true},
      {name: 'ChapterId', type: 'integer', isIndex: true},
      {name: 'TitleTextMapHash', type: 'integer', isIndex: true},
      {name: 'DescTextMapHash', type: 'integer', isIndex: true}
    ],
    skip: true
  },
  ChapterExcelConfigData: <SchemaTable> {
    name: 'ChapterExcelConfigData',
    jsonFile: './ExcelBinOutput/ChapterExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'BeginQuestId', type: 'integer', isIndex: true},
      {name: 'EndQuestId', type: 'integer', isIndex: true},
      {name: 'ChapterNumTextMapHash', type: 'integer', isIndex: true},
      {name: 'ChapterTitleTextMapHash', type: 'integer', isIndex: true}
    ],
    skip: true
  },
  QuestExcelConfigData: <SchemaTable> {
    name: 'QuestExcelConfigData',
    jsonFile: './ExcelBinOutput/QuestExcelConfigData.json',
    columns: [
      {name: 'SubId', type: 'integer', isPrimary: true},
      {name: 'MainId', type: 'integer', isIndex: true},
      {name: 'Order', type: 'integer'},
      {name: 'DescTextMapHash', type: 'integer', isIndex: true},
      {name: 'StepDescTextMapHash', type: 'integer', isIndex: true},
      {name: 'GuideTipsTextMapHash', type: 'integer', isIndex: true}
    ],
    skip: true
  },
  LoadingTipsExcelConfigData: <SchemaTable> {
    name: 'LoadingTipsExcelConfigData',
    jsonFile: './ExcelBinOutput/LoadingTipsExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'TipsTitleTextMapHash', type: 'integer', isIndex: true},
      {name: 'TipsDescTextMapHash', type: 'integer', isIndex: true}
    ],
    skip: true
  },
  ReminderExcelConfigData: <SchemaTable> {
    name: 'ReminderExcelConfigData',
    jsonFile: './ExcelBinOutput/ReminderExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'SpeakerTextMapHash', type: 'integer', isIndex: true},
      {name: 'ContentTextMapHash', type: 'integer', isIndex: true},
      {name: 'NextReminderId', type: 'integer', isIndex: true},
    ],
    skip: true
  },
  MaterialExcelConfigData: <SchemaTable> {
    name: 'MaterialExcelConfigData',
    jsonFile: './ExcelBinOutput/MaterialExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'InteractionTitleTextMapHash', type: 'integer', isIndex: true},
      {name: 'EffectDescTextMapHash', type: 'integer', isIndex: true},
      {name: 'SpecialDescTextMapHash', type: 'integer', isIndex: true},
      {name: 'TypeDescTextMapHash', type: 'integer', isIndex: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
      {name: 'DescTextMapHash', type: 'integer', isIndex: true},
      {name: 'Icon', type: 'string'},
      {name: 'ItemType', type: 'string'},
      {name: 'RankLevel', type: 'string'},
    ],
    skip: true
  },
  Relation_FurnitureToMaterial: <SchemaTable> {
    name: 'Relation_FurnitureToMaterial',
    jsonFile: './ExcelBinOutput/MaterialExcelConfigData.json',
    columns: [
      {name: 'FurnitureId', type: 'integer', isPrimary: true},
      {name: 'MaterialId', type: 'integer'},
    ],
    customRowResolve: (row: MaterialExcelConfigData) => {
      if (row.MaterialType === 'MATERIAL_FURNITURE_FORMULA' && row.ItemUse && row.ItemUse.length) {
        let furnitureId = row.ItemUse.find(x => x.UseOp === 'ITEM_USE_UNLOCK_FURNITURE_FORMULA').UseParam.find(x => !!x);
        return furnitureId ? [{FurnitureId: furnitureId, MaterialId: row.Id}] : [];
      } else {
        return [];
      }
    },
    skip: true
  },
  Relation_FurnitureSuiteToMaterial: <SchemaTable> {
    name: 'Relation_FurnitureSuiteToMaterial',
    jsonFile: './ExcelBinOutput/MaterialExcelConfigData.json',
    columns: [
      {name: 'FurnitureSuiteId', type: 'integer', isPrimary: true},
      {name: 'MaterialId', type: 'integer'},
    ],
    customRowResolve: (row: MaterialExcelConfigData) => {
      if (row.MaterialType === 'MATERIAL_FURNITURE_SUITE_FORMULA' && row.ItemUse && row.ItemUse.length) {
        let furnitureSuiteId = row.ItemUse.find(x => x.UseOp === 'ITEM_USE_UNLOCK_FURNITURE_SUITE').UseParam.find(x => !!x);
        return furnitureSuiteId ? [{FurnitureSuiteId: furnitureSuiteId, MaterialId: row.Id}] : [];
      } else {
        return [];
      }
    },
    skip: true
  },
  Relation_CodexToMaterial: <SchemaTable> {
    name: 'Relation_CodexToMaterial',
    jsonFile: './ExcelBinOutput/MaterialExcelConfigData.json',
    columns: [
      {name: 'CodexId', type: 'integer', isPrimary: true},
      {name: 'MaterialId', type: 'integer'},
    ],
    customRowResolve: (row: MaterialExcelConfigData) => {
      if (row.ItemUse && row.ItemUse.length) {
        let codexId = row.ItemUse.find(x => x.UseOp === 'ITEM_USE_UNLOCK_CODEX')?.UseParam.find(x => !!x);
        return codexId ? [{CodexId: codexId, MaterialId: row.Id}] : [];
      } else {
        return [];
      }
    },
    skip: false
  },
  MaterialSourceDataExcelConfigData: <SchemaTable> {
    name: 'MaterialSourceDataExcelConfigData',
    jsonFile: './ExcelBinOutput/MaterialSourceDataExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
    ],
    skip: true
  },
  DailyTaskExcelConfigData: <SchemaTable> {
    name: 'DailyTaskExcelConfigData',
    jsonFile: './ExcelBinOutput/DailyTaskExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'CityId', type: 'integer', isIndex: true},
      {name: 'PoolId', type: 'integer', isIndex: true},
      {name: 'QuestId', type: 'integer', isIndex: true},
      {name: 'TitleTextMapHash', type: 'integer', isIndex: true},
      {name: 'DescriptionTextMapHash', type: 'integer', isIndex: true},
      {name: 'TargetTextMapHash', type: 'integer', isIndex: true},
    ],
    skip: true
  },
  NpcFirstMetExcelConfigData: <SchemaTable> {
    name: 'NpcFirstMetExcelConfigData',
    jsonFile: './ExcelBinOutput/NpcFirstMetExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'AvatarID', type: 'integer', isIndex: true},
      {name: 'AvatarDescriptionTextMapHash', type: 'integer', isIndex: true},
    ],
    skip: true,
  },
  AvatarExcelConfigData: <SchemaTable> {
    name: 'AvatarExcelConfigData',
    jsonFile: './ExcelBinOutput/AvatarExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
      {name: 'DescTextMapHash', type: 'integer', isIndex: true},
      {name: 'WeaponType', type: 'string', isIndex: true},
      {name: 'BodyType', type: 'string', isIndex: true},
      {name: 'IconName', type: 'string'},
      {name: 'SideIconName', type: 'string'},
    ],
    skip: true,
  },
  RewardExcelConfigData: <SchemaTable> {
    name: 'RewardExcelConfigData',
    jsonFile: './ExcelBinOutput/RewardExcelConfigData.json',
    columns: [
      {name: 'RewardId', type: 'integer', isPrimary: true},
    ],
    skip: true,
  },
  HomeWorldFurnitureExcelConfigData: <SchemaTable> {
    name: 'HomeWorldFurnitureExcelConfigData',
    jsonFile: './ExcelBinOutput/HomeWorldFurnitureExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
      {name: 'DescTextMapHash', type: 'integer', isIndex: true},
      {name: 'SurfaceType', type: 'string', isIndex: true},
      {name: 'GridStyle', type: 'integer'},
      {name: 'Comfort', type: 'integer'},
      {name: 'StackLimit', type: 'integer'},
      {name: 'Cost', type: 'integer'},
      {name: 'Rank', type: 'integer', isIndex: true},
      {name: 'RankLevel', type: 'integer', isIndex: true},
      {name: 'ItemType', type: 'string', isIndex: true},
    ],
    normalizeFixFields: {
      'CBLENIDCKGG': 'DiscountCost',
      'FurnitureNameTextMapHash': 'EditorClampDistance'
    },
    skip: true,
  },
  HomeWorldFurnitureTypeExcelConfigData: <SchemaTable> {
    name: 'HomeWorldFurnitureTypeExcelConfigData',
    jsonFile: './ExcelBinOutput/HomeWorldFurnitureTypeExcelConfigData.json',
    columns: [
      {name: 'TypeID', type: 'integer', isPrimary: true},
      {name: 'TypeNameTextMapHash', type: 'integer', isIndex: true},
      {name: 'TypeName2TextMapHash', type: 'integer', isIndex: true},
      {name: 'TabIcon', type: 'integer'},
      {name: 'SceneType', type: 'string'},
    ],
    skip: true,
  },
  HomeWorldEventExcelConfigData: <SchemaTable> {
    name: 'HomeWorldEventExcelConfigData',
    jsonFile: './ExcelBinOutput/HomeWorldEventExcelConfigData.json',
    columns: [
      {name: 'EventID', type: 'integer', isPrimary: true},
      {name: 'EventType', type: 'string', isIndex: true},
      {name: 'AvatarID', type: 'integer', isIndex: true},
      {name: 'TalkID', type: 'integer', isIndex: true},
      {name: 'RewardID', type: 'integer', isIndex: true},
      {name: 'FurnitureSuiteID', type: 'integer', isIndex: true},
    ],
    normalizeFixFields: {
      'NGEGGCCMGOB': 'EventID',
      'LKMNANNKCCA': 'EventType',
      'ABLPIKPBBGL': 'TalkID',
      'FCNLCDBIEBJ': 'FurnitureSuiteID',
      'FurnitureSuitID': 'FurnitureSuiteID',
    },
    skip: true,
  }
  // FurnitureSuiteExcelConfigData
  // FurnitureMakeExcelConfigData
  // Dungeon...
};

export function capitalizeFirstLetter(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function normalizeRawJson(row: any, table: SchemaTable) {
  if (typeof row === 'undefined' || typeof row === null || typeof row !== 'object') {
    return row;
  }
  if (Array.isArray(row)) {
    return row.map(item => normalizeRawJson(item, table));
  }
  let newRow = {};
  for (let key of Object.keys(row)) {
    let originalKey = key;
    if (key.startsWith('_')) {
      key = key.slice(1);
    }
    key = capitalizeFirstLetter(key);
    if (table.normalizeFixFields && table.normalizeFixFields[key]) {
      key = table.normalizeFixFields[key];
    }
    newRow[key] = normalizeRawJson(row[originalKey], table);
  }
  return newRow;
}

if (require.main === module) {
  (async () => {
    const knex = openKnex();

    async function createTable(table: SchemaTable) {
      console.log('Creating table: ' + table.name);
      await knex.schema.dropTableIfExists(table.name);
      await knex.schema.createTable(table.name, function(builder) {
        for (let col of table.columns) {
          builder[col.type](col.name);
          if (col.isPrimary) {
            builder.primary([col.name]);
          } else if (col.isIndex) {
            builder.index(col.name);
          }
        }
        if (!table.customRowResolve) {
          builder.json('json_data');
        }
      }).then();
      console.log('  (done)');
    };

    async function insertRow(table: SchemaTable, row: any) {
      row = normalizeRawJson(row, table);
      if (table.customRowResolve) {
        let payloads: any[] = table.customRowResolve(row);
        for (let payload of payloads) {
          await knex(table.name).insert(payload).then();
        }
      } else {
        let payload = {};
        payload['json_data'] = JSON.stringify(row);
        for (let col of table.columns) {
          if (col.resolve) {
            if (typeof col.resolve === 'string') {
              payload[col.name] = objectPath.get(row, col.resolve);
            } else if (typeof col.resolve === 'function') {
              payload[col.name] = col.resolve(row);
            }
          } else {
            payload[col.name] = row[col.name];
          }
        }
        await knex(table.name).insert(payload).then();
      }
    }

    async function insertAll(table: SchemaTable) {
      console.log('Inserting data for: ' + table.name + ' from: ' + table.jsonFile);
      const json = require(config.database.getGenshinDataFilePath(table.jsonFile));
      for (let row of json) {
        await insertRow(table, row);
      }
      console.log('  (done)');
    }

    for (let table of Object.values(schema).filter(x => !x.skip)) {
      await createTable(table);
      await insertAll(table);
      console.log(SEP);
    }

    console.log('Shutting down...');
    await knex.destroy();
  })();
}