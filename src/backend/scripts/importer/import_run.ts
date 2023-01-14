import '../../loadenv';
import { openKnex } from '../../util/db';
import objectPath from 'object-path';
import { SchemaTable, SEP } from './import_types';
import { DialogExcelConfigData, TalkExcelConfigData } from '../../../shared/types/dialogue-types';
import { MaterialExcelConfigData } from '../../../shared/types/material-types';
import commandLineArgs, { OptionDefinition as ArgsOptionDefinition } from 'command-line-args';
import commandLineUsage, { OptionDefinition as UsageOptionDefinition } from 'command-line-usage';
import { getGenshinDataFilePath } from '../../loadenv';
import { humanTiming, timeConvert } from '../../../shared/util/genericUtil';
import { promises as fs } from 'fs';
import ora from 'ora';
import { pathToFileURL } from 'url';
import { ReliquaryCodexExcelConfigData, ReliquaryExcelConfigData } from '../../../shared/types/artifact-types';
import { WeaponCodexExcelConfigData, WeaponExcelConfigData } from '../../../shared/types/weapon-types';

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
    ]
  },
  Relation_DialogToNext: <SchemaTable> {
    name: 'Relation_DialogToNext',
    jsonFile: './ExcelBinOutput/DialogExcelConfigData.json',
    columns: [
      {name: 'DialogId', type: 'integer', isIndex: true},
      {name: 'NextId', type: 'integer', isIndex: true},
    ],
    customRowResolve: (row: DialogExcelConfigData) => {
      if (row.NextDialogs && row.NextDialogs.length) {
        return row.NextDialogs.map(nextDialogId => ({
          DialogId: row.Id,
          NextId: nextDialogId,
        }));
      } else {
        return [];
      }
    }
  },
  ManualTextMapConfigData: <SchemaTable> {
    name: 'ManualTextMapConfigData',
    jsonFile: './ExcelBinOutput/ManualTextMapConfigData.json',
    columns: [
      {name: 'TextMapId', type: 'string', isPrimary: true},
      {name: 'TextMapContentTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  NpcExcelConfigData: <SchemaTable> {
    name: 'NpcExcelConfigData',
    jsonFile: './ExcelBinOutput/NpcExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true}
    ]
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
    ]
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
    }
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
    ]
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
    ]
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
    ]
  },
  LoadingTipsExcelConfigData: <SchemaTable> {
    name: 'LoadingTipsExcelConfigData',
    jsonFile: './ExcelBinOutput/LoadingTipsExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'TipsTitleTextMapHash', type: 'integer', isIndex: true},
      {name: 'TipsDescTextMapHash', type: 'integer', isIndex: true}
    ]
  },
  ReminderExcelConfigData: <SchemaTable> {
    name: 'ReminderExcelConfigData',
    jsonFile: './ExcelBinOutput/ReminderExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'SpeakerTextMapHash', type: 'integer', isIndex: true},
      {name: 'ContentTextMapHash', type: 'integer', isIndex: true},
      {name: 'NextReminderId', type: 'integer', isIndex: true},
    ]
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
    ]
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
    }
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
    }
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
    }
  },
  MaterialSourceDataExcelConfigData: <SchemaTable> {
    name: 'MaterialSourceDataExcelConfigData',
    jsonFile: './ExcelBinOutput/MaterialSourceDataExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
    ]
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
    ]
  },
  NpcFirstMetExcelConfigData: <SchemaTable> {
    name: 'NpcFirstMetExcelConfigData',
    jsonFile: './ExcelBinOutput/NpcFirstMetExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'AvatarId', type: 'integer', isIndex: true},
      {name: 'AvatarDescriptionTextMapHash', type: 'integer', isIndex: true},
    ]
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
    ]
  },
  RewardExcelConfigData: <SchemaTable> {
    name: 'RewardExcelConfigData',
    jsonFile: './ExcelBinOutput/RewardExcelConfigData.json',
    columns: [
      {name: 'RewardId', type: 'integer', isPrimary: true},
    ]
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
    ]
  },
  HomeWorldFurnitureTypeExcelConfigData: <SchemaTable> {
    name: 'HomeWorldFurnitureTypeExcelConfigData',
    jsonFile: './ExcelBinOutput/HomeWorldFurnitureTypeExcelConfigData.json',
    columns: [
      {name: 'TypeId', type: 'integer', isPrimary: true},
      {name: 'TypeNameTextMapHash', type: 'integer', isIndex: true},
      {name: 'TypeName2TextMapHash', type: 'integer', isIndex: true},
      {name: 'TabIcon', type: 'integer'},
      {name: 'SceneType', type: 'string'},
    ]
  },
  HomeWorldEventExcelConfigData: <SchemaTable> {
    name: 'HomeWorldEventExcelConfigData',
    jsonFile: './ExcelBinOutput/HomeWorldEventExcelConfigData.json',
    columns: [
      {name: 'EventId', type: 'integer', isPrimary: true},
      {name: 'EventType', type: 'string', isIndex: true},
      {name: 'AvatarId', type: 'integer', isIndex: true},
      {name: 'TalkId', type: 'integer', isIndex: true},
      {name: 'RewardId', type: 'integer', isIndex: true},
      {name: 'FurnitureSuiteId', type: 'integer', isIndex: true},
    ]
  },
  HomeWorldNPCExcelConfigData: <SchemaTable> {
    name: 'HomeWorldNPCExcelConfigData',
    jsonFile: './ExcelBinOutput/HomeWorldNPCExcelConfigData.json',
    columns: [
      {name: 'FurnitureId', type: 'integer', isPrimary: true},
      {name: 'AvatarId', type: 'string', isIndex: true},
      {name: 'NpcId', type: 'integer', isIndex: true},
      {name: 'ShowNameTextMapHash', type: 'integer', isIndex: true},
      {name: 'DescTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  ReputationQuestExcelConfigData: <SchemaTable> {
    name: 'ReputationQuestExcelConfigData',
    jsonFile: './ExcelBinOutput/ReputationQuestExcelConfigData.json',
    columns: [
      {name: 'ParentQuestId', type: 'integer', isPrimary: true},
      {name: 'CityId', type: 'integer', isIndex: true},
      {name: 'RewardId', type: 'integer'},
      {name: 'TitleTextMapHash', type: 'integer', isIndex: true},
      {name: 'Order', type: 'integer'},
    ]
  },
  CityConfigData: <SchemaTable> {
    name: 'CityConfigData',
    jsonFile: './ExcelBinOutput/CityConfigData.json',
    columns: [
      {name: 'CityId', type: 'integer', isPrimary: true},
      {name: 'CityNameTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  FurnitureSuiteExcelConfigData: <SchemaTable> {
    name: 'FurnitureSuiteExcelConfigData',
    jsonFile: './ExcelBinOutput/FurnitureSuiteExcelConfigData.json',
    columns: [
      {name: 'SuiteId', type: 'integer', isPrimary: true},
      {name: 'SuiteNameText', type: 'integer', isIndex: true},
    ]
  },
  FurnitureMakeExcelConfigData: <SchemaTable> {
    name: 'FurnitureMakeExcelConfigData',
    jsonFile: './ExcelBinOutput/FurnitureMakeExcelConfigData.json',
    columns: [
      {name: 'FurnitureItemId', type: 'integer', isIndex: true},
      {name: 'ConfigId', type: 'integer', isIndex: true},
    ]
  },
  BooksCodexExcelConfigData: <SchemaTable> {
    name: 'BooksCodexExcelConfigData',
    jsonFile: './ExcelBinOutput/BooksCodexExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'MaterialId', type: 'integer', isIndex: true},
    ]
  },
  BookSuitExcelConfigData: <SchemaTable> {
    name: 'BookSuitExcelConfigData',
    jsonFile: './ExcelBinOutput/BookSuitExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'SuitNameTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  LocalizationExcelConfigData: <SchemaTable> {
    name: 'LocalizationExcelConfigData',
    jsonFile: './ExcelBinOutput/LocalizationExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'AssetType', type: 'string', isIndex: true},
    ]
  },
  DocumentExcelConfigData: <SchemaTable> {
    name: 'DocumentExcelConfigData',
    jsonFile: './ExcelBinOutput/DocumentExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'ContentLocalizedId', type: 'integer', isIndex: true},
      {name: 'TitleTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  ReliquaryExcelConfigData: <SchemaTable> {
    name: 'ReliquaryExcelConfigData',
    jsonFile: './ExcelBinOutput/ReliquaryExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'SetId', type: 'integer', isIndex: true},
      {name: 'EquipType', type: 'string', isIndex: true},
      {name: 'StoryId', type: 'integer', isIndex: true}
    ]
  },
  ReliquaryCodexExcelConfigData: <SchemaTable> {
    name: 'ReliquaryCodexExcelConfigData',
    jsonFile: './ExcelBinOutput/ReliquaryCodexExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'SuitId', type: 'integer', isIndex: true},
    ]
  },
  ReliquarySetExcelConfigData: <SchemaTable> {
    name: 'ReliquarySetExcelConfigData',
    jsonFile: './ExcelBinOutput/ReliquarySetExcelConfigData.json',
    columns: [
      {name: 'SetId', type: 'integer', isPrimary: true},
    ]
  },
  WeaponExcelConfigData: <SchemaTable> {
    name: 'WeaponExcelConfigData',
    jsonFile: './ExcelBinOutput/WeaponExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'WeaponType', type: 'integer', isIndex: true},
      {name: 'StoryId', type: 'integer', isIndex: true}
    ]
  },
  WeaponCodexExcelConfigData: <SchemaTable> {
    name: 'WeaponCodexExcelConfigData',
    jsonFile: './ExcelBinOutput/WeaponCodexExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'WeaponId', type: 'integer', isIndex: true},
    ]
  },
};

export function capitalizeFirstLetter(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function normalizeRawJson(row: any, table?: SchemaTable) {
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
    key = key.replace(/ID/g, 'Id');
    key = key.replace(/TextText/g, 'Text');
    if (table && table.normalizeFixFields && table.normalizeFixFields[key]) {
      key = table.normalizeFixFields[key];
    }
    newRow[key] = normalizeRawJson(row[originalKey], table);
  }
  return newRow;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const knex = openKnex();

    async function createTable(table: SchemaTable) {
      console.log('Creating table: ' + table.name);
      if (await knex.schema.hasTable(table.name)) {
        console.log('  Table already exists - dropping and recreating...')
      }
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
    }

    function createRowPayload(table: SchemaTable, row: any, allRows: any[]): any[] {
      row = normalizeRawJson(row, table);
      if (table.customRowResolve) {
        return table.customRowResolve(row, allRows);
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
        return [payload];
      }
    }

    async function insertAll(table: SchemaTable) {
      let timeStart = Date.now();
      console.log('Inserting data for: ' + table.name + ' from: ' + table.jsonFile);
      console.log('  Starting at ' + timeConvert(timeStart));

      const spinner = ora('Processing...').start();
      spinner.indent = 2;

      const fileContents: string = await fs.readFile(getGenshinDataFilePath(table.jsonFile), {encoding: 'utf8'});
      const json: any[] = JSON.parse(fileContents);
      const totalRows: number = json.length;

      let batch: any[] = [];
      let batchNum = 1;
      let batchMax = 200;

      async function commitBatch() {
        await knex.transaction(function(tx) {
          return knex.batchInsert(table.name, batch).transacting(tx);
        }).then();
        batch = [];
        batchNum++;
      }

      let currentRow = 1;
      for (let row of json) {
        batch.push(... createRowPayload(table, row, json));
        if (batch.length >= batchMax) {
          await commitBatch();
        }

        let percent = ((currentRow / totalRows) * 100.0) | 0;
        spinner.text = `Processed ${currentRow} rows of ${totalRows} (${percent}%) (B${batchNum})`;
        currentRow++;
      }

      if (batch.length) {
        await commitBatch();
      }

      let timeEnd = Date.now();
      spinner.succeed('Finished at ' + timeConvert(timeEnd) + ' (took '+humanTiming(timeStart, '', timeEnd)+')');
      console.log('  (done)');
    }

    const optionDefinitions: (ArgsOptionDefinition & UsageOptionDefinition)[] = [
      {name: 'run-only', alias: 'o', type: String, multiple: true, description: 'Import only the specified tables (comma-separated).', typeLabel: '<tables>'},
      {name: 'run-all-except', alias: 'e', type: String, multiple: true, description: 'Import all tables except the specified (comma-separated).', typeLabel: '<tables>'},
      {name: 'run-all', alias: 'a', type: Boolean, description: 'Import all tables.'},
      {name: 'list', alias: 'l', type: Boolean, description: 'List all table names.'},
      {name: 'help', alias: 'h', type: Boolean, description: 'Display this usage guide.'},
    ];

    const options = commandLineArgs(optionDefinitions);

    if (Object.keys(options).filter(k => k.startsWith('run')).length > 1) {
      console.error('\x1b[31m', '\nThese options are mutually exclusive: --run-only, --run-all-except, or --run-all', '\x1b[0m');
      options.help = true;
    } else if (!Object.keys(options).length) {
      console.error('\x1b[31m', '\nMust specify one of: --run-only, --run-all-except, or --run-all', '\x1b[0m');
      options.help = true;
    }

    if (options.list) {
      console.log();
      console.log('\x1b[4m\x1b[1mAvailable Tables:\x1b[0m');
      for (let tableName of Object.keys(schema)) {
        console.log('  ' + tableName);
      }
      console.log();
      return;
    }

    if (options.help) {
      const usage = commandLineUsage([
        {
          header: 'Genshin Data Importer',
          content: 'Imports Genshin Data json into a sqlite database for this application.'
        },
        {
          header: 'Options',
          optionList: optionDefinitions
        }
      ])
      console.log(usage);
      return;
    }

    let tablesToRun: string[];
    if (options['run-all']) {
      tablesToRun = Object.keys(schema);
    } else if (options['run-all-except']) {
      let input = (options['run-all-except'] as string[]).map(s => s.split(/[,;]/g)).flat(Infinity) as string[];
      for (let table of input) {
        if (!schema.hasOwnProperty(table)) {
          console.error('\x1b[31m', '\nNot a valid table name: ' + table + '\n', '\x1b[0m');
          return;
        }
      }
      tablesToRun = Object.keys(schema).filter(x => !input.includes(x));
    } else if (options['run-only']) {
      let input = (options['run-only'] as string[]).map(s => s.split(/[,;]/g)).flat(Infinity) as string[];
      for (let table of input) {
        if (!schema.hasOwnProperty(table)) {
          console.error('\x1b[31m', '\nNot a valid table name: ' + table + '\n', '\x1b[0m');
          return;
        }
      }
      tablesToRun = input;
    } else {
      throw 'Implementation exception.';
    }

    for (let tableName of tablesToRun) {
      let table: SchemaTable = schema[tableName];
      await createTable(table);
      await insertAll(table);
      console.log(SEP);
    }

    console.log('Complete at ')

    console.log('Shutting down...');
    await knex.destroy();
  })();
}