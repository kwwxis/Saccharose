import '../../setup';
import {openKnex} from '@db';
import config from '@/config';
import objectPath from 'object-path';
import { SchemaTable, SEP } from './import_types';
import { TalkExcelConfigData, LANG_CODES, LangCode } from '@types';

function textMapSchema(langCode: LangCode, skip: boolean): SchemaTable {
  return <SchemaTable> {
    name: 'TextMap' + langCode,
    jsonFile: './TextMap/TextMap'+langCode+'.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true, resolve: 'Key'},
      {name: 'Text', type: 'text', resolve: 'Value'}
    ],
    useKeys: true,
    noIncludeJson: true,
    skip: skip
  };
}

const schema = {
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
    skip: false
  },
  ManualTextMapConfigData: <SchemaTable> {
    name: 'ManualTextMapConfigData',
    jsonFile: './ExcelBinOutput/ManualTextMapConfigData.json',
    columns: [
      {name: 'TextMapId', type: 'string', isPrimary: true},
      {name: 'TextMapContentTextMapHash', type: 'integer', isIndex: true},
    ],
    skip: false
  },
  NpcExcelConfigData: <SchemaTable> {
    name: 'NpcExcelConfigData',
    jsonFile: './ExcelBinOutput/NpcExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true}
    ],
    skip: false
  },
  TalkExcelConfigData: <SchemaTable> {
    name: 'TalkExcelConfigData',
    jsonFile: './ExcelBinOutput/TalkExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'InitDialog', type: 'integer', isIndex: true},
      {name: 'NpcId', type: 'integer', isIndex: true},
      {name: 'QuestId', type: 'integer', isIndex: true},
      {name: 'Priority', type: 'integer'},
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
    skip: false
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
    skip: false
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
    skip: false
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
    skip: false
  },
  LoadingTipsExcelConfigData: <SchemaTable> {
    name: 'LoadingTipsExcelConfigData',
    jsonFile: './ExcelBinOutput/LoadingTipsExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'TipsTitleTextMapHash', type: 'integer', isIndex: true},
      {name: 'TipsDescTextMapHash', type: 'integer', isIndex: true}
    ],
    skip: false
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
    skip: false
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
    skip: false
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
    skip: false
  },
  NpcFirstMetExcelConfigData: <SchemaTable> {
    name: 'NpcFirstMetExcelConfigData',
    jsonFile: './ExcelBinOutput/NpcFirstMetExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'AvatarID', type: 'integer', isIndex: true},
      {name: 'AvatarDescriptionTextMapHash', type: 'integer', isIndex: true},
    ],
    skip: false,
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
    skip: false,
  },
  // 'CHS' | 'CHT' | 'DE' | 'EN' | 'ES' | 'FR' | 'ID' | 'JP' | 'KR' | 'PT' | 'RU' | 'TH' | 'VI'
  // TextMapEN: textMapSchema('EN', true),
  // TextMapCHS: textMapSchema('CHS', false),
  // TextMapCHT: textMapSchema('CHT', false),
  // TextMapDE: textMapSchema('DE', false),
  // TextMapES: textMapSchema('ES', false),
  // TextMapFR: textMapSchema('FR', false),
  // TextMapID: textMapSchema('ID', false),
  // TextMapKR: textMapSchema('KR', false),
  // TextMapPT: textMapSchema('PT', false),
  // TextMapRU: textMapSchema('RU', false),
  // TextMapTH: textMapSchema('TH', false),
  // TextMapVI: textMapSchema('VI', false),
};

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
      if (!table.noIncludeJson) {
        builder.json('json_data');
      }
    }).then();
    console.log('  (done)');
  };

  function capitalizeFirstLetter(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function normalizeRawJson(row: any) {
    if (typeof row === 'undefined' || typeof row === null || typeof row !== 'object') {
      return row;
    }
    if (Array.isArray(row)) {
      let newArray = [];
      for (let item of row) {
        newArray.push(normalizeRawJson(item));
      }
      return newArray;
    }
    let newRow = {};
    for (let key of Object.keys(row)) {
      let originalKey = key;
      if (key.startsWith('_')) {
        key = key.slice(1);
      }
      key = capitalizeFirstLetter(key);
      newRow[key] = normalizeRawJson(row[originalKey]);
    }
    return newRow;
  }

  async function insertRow(table: SchemaTable, row: any) {
    row = normalizeRawJson(row);
    let payload = {};
    if (!table.noIncludeJson) {
      payload['json_data'] = JSON.stringify(row);
    }
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

  async function insertAll(table: SchemaTable) {
    console.log('Inserting data for: ' + table.name + ' from: ' + table.jsonFile);
    const json = require(config.database.getGenshinDataFilePath(table.jsonFile));
    if (table.useKeys) {
      for (let key in json) {
        await insertRow(table, {key, value: json[key]});
      }
    } else {
      for (let row of json) {
        await insertRow(table, row);
      }
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