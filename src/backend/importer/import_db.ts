import '../loadenv';
import { closeKnex, openKnex } from '../util/db';
import commandLineArgs, { OptionDefinition as ArgsOptionDefinition } from 'command-line-args';
import commandLineUsage, { OptionDefinition as UsageOptionDefinition } from 'command-line-usage';
import { getGenshinDataFilePath, getStarRailDataFilePath, getZenlessDataFilePath } from '../loadenv';
import { humanTiming, isEmpty, timeConvert } from '../../shared/util/genericUtil';
import { promises as fs } from 'fs';
import ora from 'ora';
import { pathToFileURL } from 'url';
import chalk from 'chalk';
import { resolveObjectPath } from '../../shared/util/arrayUtil';
import { isStringBlank, ucFirst } from '../../shared/util/stringUtil';
import { LangCode } from '../../shared/types/lang-types';
import { genshinSchema } from './genshin/genshin.schema';
import { Knex } from 'knex';
import { starRailSchema } from './hsr/hsr.schema';
import { zenlessSchema } from './zenless/zenless.schema';

export type SchemaTableSet = {[tableName: string]: SchemaTable};

export type SchemaTable = {
  name: string,
  columns: SchemaColumn[],
  jsonFile: string,
  customRowResolve?: (row: any, allRows?: any[]) => any[],
  normalizeFixFields?: { [oldName: string]: string },
  singularize?: string[],
  isKvPair?: boolean,
  isDatFile?: boolean,
  noIncludeJson?: boolean,
};
export type SchemaColumnType =
  'string'
  | 'integer'
  | 'bigInteger'
  | 'boolean'
  | 'text'
  | 'float'
  | 'double'
  | 'decimal'
  | 'json'
  | 'jsonb'
  | 'uuid';
export type SchemaColumn = {
  name: string,
  type: SchemaColumnType,
  resolve?: string | Function,
  isIndex?: boolean,
  isPrimary?: boolean,
  defaultValue?: any,
};

export function schemaForDbName(dbName: 'genshin' | 'hsr' | 'zenless'): SchemaTableSet {
  if (dbName === 'genshin') {
    return genshinSchema;
  } else if (dbName === 'hsr') {
    return starRailSchema;
  } else if (dbName === 'zenless') {
    return zenlessSchema;
  } else {
    throw 'Implementation error';
  }
}

export function textMapSchema(langCode: LangCode, hashType: string = 'integer'): SchemaTable {
  return <SchemaTable> {
    name: 'TextMap' + langCode,
    jsonFile: './TextMap/TextMap'+langCode+'.json',
    columns: [
      {name: 'Hash', type: hashType, isPrimary: true, resolve: 'Key'},
      {name: 'Text', type: 'text', resolve: 'Value'}
    ],
    customRowResolve(row) {
      return [{Hash: row.Key, Text: row.Value}];
    },
    isKvPair: true
  };
}

export function plainLineMapSchema(langCode: LangCode, hashType: string = 'integer'): SchemaTable {
  return <SchemaTable> {
    name: 'PlainLineMap' + langCode,
    jsonFile: `./TextMap/Plain/PlainTextMap${langCode}_Hash.dat`,
    columns: [
      {name: 'Line', type: 'integer', isPrimary: true, resolve: 'LineNumber' },
      {name: 'Hash', type: hashType, resolve: 'LineText' }
    ],
    customRowResolve(row) {
      return [{Line: row.LineNumber, Hash: row.LineText}];
    },
    isDatFile: true,
  }
}

export function normalizeRawJsonKey(key: string, table: SchemaTable) {
  if (key.startsWith('_')) {
    key = key.slice(1);
  }
  key = ucFirst(key);
  if (!(key.length === 11 && /^[A-Z]+$/.test(key))) {
    key = key.replace(/ID/g, 'Id');
  }
  key = key.replace(/TextText/g, 'Text');
  key = key.replace(/_(\w)/g, (fm: string, g: string) => g.toUpperCase()); // snake to camel
  if (table && table.normalizeFixFields) {
    if (key in table.normalizeFixFields) {
      key = table.normalizeFixFields[key];
    }
    if (key.toUpperCase() in table.normalizeFixFields) {
      key = table.normalizeFixFields[key.toUpperCase()];
    }
  }
  return key;
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
    key = normalizeRawJsonKey(key, table);
    newRow[key] = normalizeRawJson(row[originalKey], table);
    if (table && table.singularize && table.singularize.includes(key) && Array.isArray(newRow[key])) {
      newRow[key] = newRow[key].find(x => !!x);
    }
  }
  return newRow;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const databases = openKnex();
    let knex: Knex;
    let schemaSet: SchemaTableSet;
    let getDataFilePath: (relPath: string) => string = null;

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
        if (!table.customRowResolve && !table.noIncludeJson) {
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
        if (!table.noIncludeJson) {
          payload['json_data'] = JSON.stringify(row);
        }
        for (let col of table.columns) {
          if (col.resolve) {
            if (typeof col.resolve === 'string') {
              payload[col.name] = resolveObjectPath(row, col.resolve);
            } else if (typeof col.resolve === 'function') {
              payload[col.name] = col.resolve(row);
            }
          } else {
            payload[col.name] = row[col.name];
          }
          if (col.defaultValue && (typeof payload[col.name] === 'undefined' || payload[col.name] === null)) {
            payload[col.name] = col.defaultValue;
          }
        }
        return [payload];
      }
    }

    async function insertAll(table: SchemaTable) {
      let timeStart = Date.now();
      console.log('Inserting data for: ' + table.name + ' from: ' + table.jsonFile);
      console.log('  Starting at ' + timeConvert(timeStart));

      const spinner = ora('Starting...').start();
      spinner.indent = 2;

      const fileContents: string = await fs.readFile(getDataFilePath(table.jsonFile), {encoding: 'utf8'});
      let json: any[];
      let totalRows: number;

      if (table.isKvPair) {
        json = Object.entries(JSON.parse(fileContents)).map(([Key, Value]) => ({Key, Value}));
        totalRows = json.length;
      } else if (table.isDatFile) {
        let lines: string[] = fileContents.split(/\n/g);
        json = [];
        
        for (let i: number = 0; i < lines.length; i++) {
          json.push({LineNumber: i + 1, LineText: lines[i]});
        }
        totalRows = json.length;
      } else {
        json = JSON.parse(fileContents);
        totalRows = json.length;
      }

      let batch: any[] = [];
      let batchNum = 1;
      let batchMax = 500;

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
      spinner.succeed('Finished at ' + timeConvert(timeEnd) + ' (took '+humanTiming(timeStart, '', timeEnd, '0 seconds')+')');
      console.log('  (done)');
    }

    const optionDefinitions: (ArgsOptionDefinition & UsageOptionDefinition)[] = [
      {name: 'game', alias: 'g', type: String, description: 'One of "genshin", "hsr", or "zenless"', typeLabel: '<game>'},
      {name: 'run-only', alias: 'o', type: String, multiple: true, description: 'Import only the specified tables (comma-separated).', typeLabel: '<tables>'},
      {name: 'run-includes', alias: 'i', type: String, multiple: true, description: 'Import only tables whose name contains any one of the specified texts (comma-separated, case-insensitive, not a regex).', typeLabel: '<texts>'},
      {name: 'run-all-except', alias: 'e', type: String, multiple: true, description: 'Import all tables except the specified (comma-separated).', typeLabel: '<tables>'},
      {name: 'run-all', alias: 'a', type: Boolean, description: 'Import all tables.'},
      {name: 'run-vacuum', alias: 'v', type: Boolean, description: 'Vacuum the database'},
      {name: 'list', alias: 'l', type: Boolean, description: 'List all table names.'},
      {name: 'help', alias: 'h', type: Boolean, description: 'Display this usage guide.'},
    ];

    const options = commandLineArgs(optionDefinitions);

    if (Object.keys(options).filter(k => k.startsWith('run')).length > 1) {
      console.error(chalk.red('\nThese options are mutually exclusive: --run-only, --run-includes, --run-all-except, --run-all, --run-vacuum'));
      options.help = true;
    } else if (!Object.keys(options).length) {
      console.warn(chalk.yellow('\nMust specify one of: --run-only, --run-includes, --run-all-except, --run-all, or --run-vacuum'));
      options.help = true;
    }

    if (options.help) {
      const usage: string = commandLineUsage([
        {
          header: 'Saccharose DB Importer',
          content: 'Imports game data json into a sqlite database for this application.'
        },
        {
          header: 'Options',
          optionList: optionDefinitions
        }
      ])
      console.log(usage);
      return;
    }

    switch (options['game']?.toLowerCase()) {
      case 'gi':
      case 'genshin':
      case 'genshinimpact':
        if (isStringBlank(process.env.GENSHIN_DATA_ROOT)) {
          console.error(chalk.red('\n"GENSHIN_DATA_ROOT" must be set in .env\n'));
          return;
        }
        knex = databases.genshin;
        schemaSet = genshinSchema;
        getDataFilePath = getGenshinDataFilePath;
        break;
      case 'hsr':
      case 'starrail':
      case 'honkaistarrail':
        if (isStringBlank(process.env.HSR_DATA_ROOT)) {
          console.error(chalk.red('\n"HSR_DATA_ROOT" must be set in .env\n'));
          return;
        }
        knex = databases.hsr;
        schemaSet = starRailSchema;
        getDataFilePath = getStarRailDataFilePath;
        break;
      case 'zzz':
      case 'zenless':
      case 'zenlesszonezero':
        if (isStringBlank(process.env.ZENLESS_DATA_ROOT)) {
          console.error(chalk.red('\n"ZENLESS_DATA_ROOT" must be set in .env\n'));
          return;
        }
        knex = databases.zenless;
        schemaSet = zenlessSchema;
        getDataFilePath = getZenlessDataFilePath;
        break;
      default:
        console.error(chalk.red('\nInvalid value for "game" option.\n'));
        return;
    }

    if (options.list) {
      console.log();
      console.log(chalk.bold.underline('Available Tables:'));
      for (let tableName of Object.keys(schemaSet).sort()) {
        console.log('  ' + tableName);
      }
      console.log();
      return;
    }

    let tablesToRun: string[];

    if (options['run-all']) {
      tablesToRun = Object.keys(schemaSet);
    } else if (options['run-all-except']) {
      let input = (options['run-all-except'] as string[]).map(s => s.split(/[,;]/g)).flat(Infinity) as string[];
      for (let table of input) {
        if (!schemaSet.hasOwnProperty(table)) {
          console.error(chalk.red('\nNot a valid table name: ' + table + '\n'));
          return;
        }
      }
      tablesToRun = Object.keys(schemaSet).filter(x => !input.includes(x));
    } else if (options['run-only']) {
      let input = (options['run-only'] as string[]).map(s => s.split(/[,;]/g)).flat(Infinity) as string[];
      for (let table of input) {
        if (!schemaSet.hasOwnProperty(table)) {
          console.error(chalk.red('\nNot a valid table name: ' + table + '\n'));
          return;
        }
      }
      tablesToRun = input;
    } else if (options['run-includes']) {
      let input = (options['run-includes'] as string[]).map(s => s.split(/[,;]/g)).flat(Infinity) as string[];
      tablesToRun = [];
      for (let text of input) {
        for (let table of Object.values(schemaSet)) {
          if (table.name.toLowerCase().includes(text.toLowerCase())) {
            tablesToRun.push(table.name);
          }
        }
      }
    } else if (options['run-vacuum']) {
      await knex.raw('VACUUM').then();
      console.log('Vacuum complete, shutting down...');
      await closeKnex();
      return;
    } else {
      throw 'Implementation exception.';
    }

    if (!tablesToRun || !tablesToRun.length) {
      console.error(chalk.yellow('No tables selected.'));
    }

    for (let tableName of tablesToRun) {
      let table: SchemaTable = schemaSet[tableName];
      await createTable(table);
      await insertAll(table);
      console.log('-'.repeat(90));
    }

    console.log('Shutting down...');
    await closeKnex();
  })();
}