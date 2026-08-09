// Loadenv:
import '../loadenv.ts';
import {
  getGenshinDataFilePath,
  getStarRailDataFilePath,
  getWuwaDataFilePath,
  getZenlessDataFilePath,
} from '../loadenv.ts';

// Third-Party:
import fs from 'fs';
import ora from 'ora';
import { pathToFileURL } from 'url';
import chalk from 'chalk';
import commandLineArgs, { OptionDefinition as ArgsOptionDefinition } from 'command-line-args';
import commandLineUsage, { OptionDefinition as UsageOptionDefinition } from 'command-line-usage';
import { Knex } from 'knex';

// DB Interface:
import { closeKnex, openPgGamedata } from '../util/db.ts';

// Shared Types:
import { LangCode } from '../../shared/types/lang-types.ts';

// Shared Util:
import { humanTiming, isEmpty, isPromise, isset, isUnset, timeConvert } from '../../shared/util/genericUtil.ts';
import { resolveObjectPath, walkObject } from '../../shared/util/arrayUtil.ts';
import { isStringBlank, ucFirst } from '../../shared/util/stringUtil.ts';

// Schema:
import { genshinSchema } from './genshin/genshin.schema.ts';
import { starRailSchema } from './hsr/hsr.schema.ts';
import { zenlessSchema } from './zenless/zenless.schema.ts';
import { wuwaSchema } from './wuwa/wuwa.schema.ts';

export type SchemaTableSet = {[tableName: string]: SchemaTable};

export type SchemaTableCustomRowResolver = (row: any, allRows?: any[], acc?: Record<string, any>) => any[]|Promise<any>;
export type SchemaTableCustomRowResolverProvider = () => SchemaTableCustomRowResolver|Promise<SchemaTableCustomRowResolver>;

let skipTableCreation: boolean = false;

export type SchemaTable = {
  name: string,
  jsonFile: string,

  /**
   * How the file is read in (default: `record_array`)
   */
  jsonFileType?: 'record_array' | 'kv_pairs' | 'line_dat',

  /**
   * (Only used for schemas for TextMap tables)
   *
   * The lang code of the TextMap.
   */
  textMapSchemaLangCode?: LangCode,

  // Schema Options
  // --------------------------------------------------------------------------------------------------------------

  /**
   * Table creation schema.
   */
  columns: SchemaColumn[],

  /**
   * By default, a `json_data` column is always added to the table. Setting this option to false will prevent that.
   *
   * Note: if `customRowResolve` is implemented, that also disables the `json_data` column.
   */
  noIncludeJson?: boolean,

  /**
   * Custom row resolve. Gets passed in the current row and may return one or more rows to insert.
   *
   * The row passed in already has had `propertySchema` and `renameFields` applied to it.
   *
   * @param row The current row
   * @param allRows The list of all rows
   * @param acc An accumulator object. It starts off as an empty object, and the same object is passed to every call
   * to `customRowResolve`. What is done with this object is up to the implementer.
   */
  customRowResolve?: SchemaTableCustomRowResolver,

  /**
   * Essentially the same as `customRowResolve`, but this is a provider function that returns the resolver function. This is useful
   * if the resolver function needs to be `async`, or if it needs to import other modules that may cause circular dependencies.
   */
  customRowResolveProvider?: SchemaTableCustomRowResolverProvider,

  /**
   * Set to true to skip the call to normalizeRawJson() - this option could be used when high performance is needed
   * alongside customRowResolve().
   */
  skipNormalizeRawJson?: boolean,

  /**
   * A function that is called after the table has been created but before any data is inserted.
   * This can be used to create additional indexes or modifications to the table that cannot be done through the
   * {@link SchemaTable} or {@link SchemaColumn} definitions. For some things, Knex.JS itself cannot handle it either,
   * in which case you should use the `knex.raw()` function to execute raw SQL statements.
   */
  afterCreate?: (knex: Knex) => Promise<void>,

  // Rename Options
  // --------------------------------------------------------------------------------------------------------------

  /**
   * Recursively renames any fields in the payload.
   */
  renameFields?: { [oldName: string]: string },

  /**
   * Has the same functionality as renameFields, but this will be applied first before renameFields.
   */
  propertySchema?: { [oldName: string]: string },

  /**
   * When a field with a name in this object is encountered, and if the value of that
   * field is an array, then the value of that field will be converted to the first non-falsy value in that array and
   * will be set to the field with the corresponding value in this object.
   */
  singularize?: { [fieldName: string]: string },

  // Changelog Options
  // --------------------------------------------------------------------------------------------------------------
  changelog?: {
    excluded?: boolean,
    metadataOnly?: boolean,
    excludeAdded?: boolean,
    excludeUpdated?: boolean,
    excludeRemoved?: boolean,
  }
};

/**
 * Get the primary key column name of a schema table.
 * @param schemaTable The schema table to get the primary key column name from.
 * @return The primary key column name, or undefined if there is no primary key column.
 */
export function schemaPrimaryKey(schemaTable: SchemaTable): string {
  if (!schemaTable?.columns) {
    return undefined;
  }
  for (let column of schemaTable.columns) {
    if (column.isPrimary) {
      return column.name;
    }
  }
  return undefined;
}

export type SchemaColumnType =
  'string'
  | 'integer'
  | 'bigint'
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
  /**
   * The name of the column in the database table, and the property to be used to resolve the value from the row
   * (unless `resolve` or `resolveByValueExample` is specified).
   */
  name: string,

  /**
   * The type of the column in the database table.
   */
  type: SchemaColumnType,

  /**
   * Rather than using the `name` of the column to resolve the value from the row,
   * this property can be used to specify a different property name (for only resolve purpose)
   * or a function to resolve the value.
   */
  resolve?: string | ((row: any) => any),

  /**
   * If the property name is unknown or dynamic, this property can be used to specify an example value to resolve the value from the row.
   *
   * It assumes that only one property in the row has the same value as the example value, and that property that is found
   * will be used to resolve all values for this column across all rows.
   *
   * - If multiple properties among the row(s) have the
   *   same value as the example value, the first property that is found will be used.
   *
   * - Multiple columns for the same table cannot use the same example value, as that would cause ambiguity in which property to resolve.
   *   If multiple columns are using the same example value, the behavior is undefined.
   *
   * This column's `resolve` property will be set to the result, overwriting any existing value in `resolve` if it was already set.
   */
  resolveByValueExample?: any,

  /**
   * Optional group number for usage with `resolveByValueExample`. For columns sharing the same group number,
   * the `resolveByValueExample` will only match upon a row if all columns of the same group matched an example value
   * in that row.
   *
   * If even one column of the same group does not match an example value in that row, then none of the columns of that group will be resolved for that row.
   *
   * Group number be at least 1.
   */
  resolveByValueExampleGroup?: number,

  /**
   * This column should be an index column. (default: false)
   */
  isIndex?: boolean,

  /**
   * This column should be the primary column. (default: false)
   * Only one column can be the primary column. If multiple columns are marked as primary, the behavior is undefined.
   */
  isPrimary?: boolean,

  /**
   * This column should be a unique column. (default: false)
   */
  isUnique?: boolean,

  /**
   * If the value is undefined or null, should it be set to this default value? (default: undefined)
   */
  defaultValue?: any,

  /**
   * If the value is `0`, should it be converted to null? (default: false)
   */
  allowZero?: boolean,

  /**
   * If the value is an empty string, should it be converted to null? (default: false)
   */
  allowEmptyString?: boolean,
};

export function schemaForDbName(dbName: 'genshin' | 'hsr' | 'zenless' | 'wuwa'): SchemaTableSet {
  if (dbName === 'genshin') {
    return genshinSchema;
  } else if (dbName === 'hsr') {
    return starRailSchema;
  } else if (dbName === 'zenless') {
    return zenlessSchema;
  } else if (dbName === 'wuwa') {
    return wuwaSchema;
  } else {
    throw 'Implementation error';
  }
}

export function textMapSchema(langCode: LangCode): SchemaTable {
  return <SchemaTable> {
    name: 'TextMap' + langCode,
    jsonFile: './TextMap/TextMap'+langCode+'.json',
    jsonFileType: 'kv_pairs',
    textMapSchemaLangCode: langCode,
    skipNormalizeRawJson: true,
    columns: [
      {name: 'Hash', type: 'text', isPrimary: true},
      {name: 'Text', type: 'text'}
    ],
    customRowResolve(row) {
      return [{Hash: row.Key, Text: row.Value}];
    },
    changelog: {
      excluded: true
    }
  };
}

export function plainLineMapSchema(langCode: LangCode): SchemaTable {
  return <SchemaTable> {
    name: 'PlainLineMap' + langCode,
    jsonFile: `./TextMap/Plain/PlainTextMap${langCode}_Hash.dat`,
    jsonFileType: 'line_dat',
    skipNormalizeRawJson: true,
    columns: [
      {name: 'Line', type: 'integer', isPrimary: true },
      {name: 'Hash', type: 'text' },
      {name: 'LineType', type: 'text', isIndex: true }
    ],
    customRowResolve(row) {
      const linePair = row.LineText.split(',');
      return [{Line: row.LineNumber, Hash: linePair[0], LineType: linePair[1] || null}];
    },
    changelog: {
      excluded: true
    }
  }
}

export function normalizeRawJsonKey(key: string, table?: SchemaTable, propertyRenameMap?: {[key: string]: string}) {
  if (key.startsWith('_')) {
    key = key.slice(1);
  }
  key = ucFirst(key);
  if (!(key.length === 11 && /^[A-Z]+$/.test(key))) {
    key = key.replace(/ID/g, 'Id');
  }
  key = key.replace(/TextText/g, 'Text');
  key = key.replace(/_(\w)/g, (fm: string, g: string) => g.toUpperCase()); // snake to camel

  if (table && table.propertySchema) {
    if (key in table.propertySchema) {
      key = table.propertySchema[key];
    }
    if (key.toUpperCase() in table.propertySchema) {
      key = table.propertySchema[key.toUpperCase()];
    }
  }

  if (table && table.renameFields) {
    if (key in table.renameFields) {
      key = table.renameFields[key];
    }
    if (key.toUpperCase() in table.renameFields) {
      key = table.renameFields[key.toUpperCase()];
    }
  }

  if (propertyRenameMap) {
    if (key in propertyRenameMap) {
      key = propertyRenameMap[key];
    }
    if (key.toUpperCase() in propertyRenameMap) {
      key = propertyRenameMap[key.toUpperCase()];
    }
  }

  return key;
}

export function normalizeRawJson(row: any, table?: SchemaTable, propertyRenameMap?: {[key: string]: string}) {
  if (typeof row === 'undefined' || row === null || typeof row !== 'object') {
    return row;
  }
  if (Array.isArray(row)) {
    return row.map(item => normalizeRawJson(item, table, propertyRenameMap));
  }
  let newRow = {};
  for (let key of Object.keys(row)) {
    let originalKey = key;
    key = normalizeRawJsonKey(key, table, propertyRenameMap);
    newRow[key] = normalizeRawJson(row[originalKey], table, propertyRenameMap);
    if (table && table.singularize && table.singularize.hasOwnProperty(key) && Array.isArray(newRow[key])) {
      newRow[table.singularize[key]] = newRow[key].find(x => !!x);
    }
  }
  return newRow;
}

export function renameFields(row: any, propertyRenameMap?: {[key: string]: string}): any {
  if (typeof row === 'undefined' || row === null || typeof row !== 'object') {
    return row;
  }
  if (Array.isArray(row)) {
    return row.map(item => renameFields(item, propertyRenameMap));
  }
  let newRow: any = {};
  for (let key of Object.keys(row)) {
    let originalKey = key;

    if (propertyRenameMap) {
      if (key in propertyRenameMap) {
        key = propertyRenameMap[key];
      }
      if (key.toUpperCase() in propertyRenameMap) {
        key = propertyRenameMap[key.toUpperCase()];
      }
    }

    newRow[key] = renameFields(row[originalKey], propertyRenameMap);
  }
  return newRow;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const databases = openPgGamedata();
    let knex: Knex;
    let schemaSet: SchemaTableSet;
    let getDataFilePath: (relPath: string) => string = null;

    async function createTable(table: SchemaTable) {
      if (!table.name) {
        throw 'Missing table name';
      }
      if (!table.columns || !Array.isArray(table.columns)) {
        throw 'Missing table columns';
      }
      if (!table.jsonFile) {
        throw 'Missing table jsonFile';
      }
      if (table.customRowResolve && table.customRowResolveProvider) {
        throw 'Cannot specify both customRowResolve and customRowResolveProvider';
      }

      if (skipTableCreation) {
        console.log('  (table creation skipped)');
        return;
      }
      console.log('Creating table: ' + table.name);
      if (await knex.schema.hasTable(table.name)) {
        console.log('  Table already exists - dropping and recreating...')
      }
      await knex.schema.dropTableIfExists(table.name);
      await knex.schema.createTable(table.name, function(builder) {
        for (let col of table.columns) {
          if (col.type === 'string')
            col.type = 'text';

          const colBuilder = builder[col.type](col.name);

          if (!col.isPrimary) {
            colBuilder.nullable();
          }

          if (col.isPrimary) {
            builder.primary([col.name]);
          } else if (col.isIndex) {
            builder.index(col.name);
          } else if (col.isUnique) {
            builder.unique(col.name);
          }
        }
        if (!table.customRowResolve && !table.customRowResolveProvider && !table.noIncludeJson) {
          builder.jsonb('json_data');
        }
      });
      if (table.afterCreate) {
        await table.afterCreate(knex);
      }
      console.log('  (done)');
    }

    async function createRowPayload(table: SchemaTable, row: any, allRows: any[], acc: Record<string, any>): Promise<any[]> {
      if (!row || isEmpty(row)) {
        return [];
      }

      if (!table.skipNormalizeRawJson)
        row = normalizeRawJson(row, table);

      if (!acc.customRowResolve) {
        if (table.customRowResolve) {
          acc.customRowResolve = table.customRowResolve;
        }
        if (table.customRowResolveProvider) {
          const ret = table.customRowResolveProvider();
          acc.customRowResolve = isPromise(ret) ? await ret : ret;
        }
      }

      if (acc.customRowResolve) {
        const ret: any|Promise<any> = acc.customRowResolve(row, allRows, acc);
        return isPromise(ret) ? ret : Promise.resolve(ret);
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
          if (!col.isPrimary && !col.allowZero && payload[col.name] === 0) {
            payload[col.name] = null;
          }
          if (!col.allowEmptyString && payload[col.name] === '') {
            payload[col.name] = null;
          }
          if (isset(col.defaultValue) && isUnset(payload[col.name])) {
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

      const fileContents: string = fs.readFileSync(getDataFilePath(table.jsonFile), {encoding: 'utf8'});
      let json: any[];
      let totalRows: number;

      if (table.jsonFileType === 'kv_pairs') {
        json = Object.entries(JSON.parse(fileContents)).map(([Key, Value]) => ({Key, Value}));
        totalRows = json.length;
      } else if (table.jsonFileType === 'line_dat') {
        let lines: string[] = fileContents.split(/\n/g);
        json = [];

        for (let i: number = 0; i < lines.length; i++) {
          json.push({LineNumber: i + 1, LineText: lines[i]});
        }
        totalRows = json.length;
      } else {
        json = JSON.parse(fileContents);
        if (!Array.isArray(json)) {
          json = Object.values(json);
        }
        totalRows = json.length;
      }

      const colsResolvedByExample: SchemaColumn[] = table.columns.filter(x => isset(x.resolveByValueExample));
      if (colsResolvedByExample.length) {
        const exampleValueToCol: Record<string, SchemaColumn> = {};

        for (let col of colsResolvedByExample) {
          exampleValueToCol[JSON.stringify(col.resolveByValueExample)] = col;
        }

        if (!table.propertySchema) {
          table.propertySchema = {};
        }

        for (let row of json) {
          // Only record the first match found per example value within this row
          const rowMatches: Record<string, string> = {};

          walkObject(row, prop => {
            if (prop.isLeaf) {
              const serializedValue = JSON.stringify(prop.value);

              if (exampleValueToCol.hasOwnProperty(serializedValue) && !rowMatches.hasOwnProperty(serializedValue)) {
                rowMatches[serializedValue] = prop.path;
              }
            }
          });

          // Split this row's matches into ungrouped (resolve immediately) and grouped
          // (only resolve if every pending column of the group matched in this row) keys:
          const ungroupedMatchedKeys: string[] = [];
          const groupedMatchedKeys: Record<number, string[]> = {};

          for (let key of Object.keys(rowMatches)) {
            const group = exampleValueToCol[key].resolveByValueExampleGroup;
            if (isset(group)) {
              (groupedMatchedKeys[group] = groupedMatchedKeys[group] || []).push(key);
            } else {
              ungroupedMatchedKeys.push(key);
            }
          }

          for (let key of ungroupedMatchedKeys) {
            table.propertySchema[rowMatches[key]] = exampleValueToCol[key].name;
            // exampleValueToCol[key].resolve = rowMatches[key];
            delete exampleValueToCol[key];
          }

          for (let group of Object.keys(groupedMatchedKeys).map(Number)) {
            const matchedKeys: string[] = groupedMatchedKeys[group];
            const pendingKeysInGroup: string[] = Object.keys(exampleValueToCol)
              .filter(key => exampleValueToCol[key].resolveByValueExampleGroup === group);

            if (matchedKeys.length === pendingKeysInGroup.length) {
              // Every column of this group matched an example value in this row, so resolve them all.
              for (let key of matchedKeys) {
                table.propertySchema[rowMatches[key]] = exampleValueToCol[key].name;
                // exampleValueToCol[key].resolve = rowMatches[key];
                delete exampleValueToCol[key];
              }
            }
            // Otherwise, not all columns of the group matched in this row, so discard these matches
            // and leave the group's columns unresolved for consideration in subsequent rows.
          }

          if (Object.keys(exampleValueToCol).length === 0) {
            break; // all example values have been resolved
          }
        }

        if (Object.keys(exampleValueToCol).length > 0) {
          throw 'Could not resolve all example values for table: ' + table.name + '.\n' +
          'Unresolved: ' + Object.keys(exampleValueToCol).map(x => JSON.parse(x)).join(', ');
        }
      }

      await knex.transaction(async (tx) =>  {
        let batch: any[] = [];
        let batchNum = 1;
        let batchMax = 500;

        if (table.name.startsWith('Relation')) {
          batchMax = 200;
        }

        async function addBatchToTransaction() {
          await knex.batchInsert(table.name, batch).transacting(tx);
          batch = [];
          batchNum++;
        }

        let currentRow = 1;
        let acc: Record<string, any> = {};
        let lastPercent: number = -1;

        for (let row of json) {
          batch.push(... (await createRowPayload(table, row, json, acc)));
          if (batch.length >= batchMax) {
            await addBatchToTransaction();
          }

          let percent = ((currentRow / totalRows) * 100.0) | 0;
          if (percent !== lastPercent) {
            lastPercent = percent;

            spinner.text = `Processed ${currentRow} rows of ${totalRows} (${percent}%) (B${batchNum})`;
          }
          currentRow++;
        }

        if (batch.length) {
          await addBatchToTransaction();
        }
      }).then();

      let timeEnd = Date.now();
      spinner.succeed('Finished at ' + timeConvert(timeEnd) + ' (took '+humanTiming(timeStart, {suffix: '', currentTime: timeEnd, justNowText: '0 seconds'})+')');
      console.log('  (done)');
    }

    const optionDefinitions: (ArgsOptionDefinition & UsageOptionDefinition)[] = [
      {name: 'game', alias: 'g', type: String, description: 'One of "genshin", "hsr", "zenless", "wuwa', typeLabel: '<game>'},
      {name: 'run-only', alias: 'o', type: String, multiple: true, description: 'Import only the specified tables (comma-separated).', typeLabel: '<tables>'},
      {name: 'run-includes', alias: 'i', type: String, multiple: true, description: 'Import only tables whose name contains any one of the specified texts (comma-separated, case-insensitive, not a regex).', typeLabel: '<texts>'},
      {name: 'run-excludes', alias: 'x', type: String, multiple: true, description: 'Import all tables except those whose name contains any one of the specified texts (comma-separated, case-insensitive, not a regex).', typeLabel: '<text>'},
      {name: 'run-all-except', alias: 'e', type: String, multiple: true, description: 'Import all tables except the specified exact table names (comma-separated, case-insensitive).', typeLabel: '<tables>'},
      {name: 'run-from', alias: 'f', type: String, description: 'Import all tables starting from a specific one in the import order.', typeLabel: '<tables>'},
      {name: 'run-all', alias: 'a', type: Boolean, description: 'Import all tables.'},
      {name: 'run-vacuum', alias: 'v', type: Boolean, description: 'Vacuum the database'},
      {name: 'list', alias: 'l', type: Boolean, description: 'List all table names.'},
      {name: 'help', alias: 'h', type: Boolean, description: 'Display this usage guide.'},
    ];

    let options: commandLineArgs.CommandLineOptions;
    try {
      options = commandLineArgs(optionDefinitions);
    } catch (e: any) {
      if (typeof e === 'object' && e.name === 'UNKNOWN_OPTION') {
        console.warn(chalk.red('\nUnknown option: ' + e.optionName));
      } else {
        console.error(chalk.red('\n' + e?.message || e));
      }
      options = { help: true };
    }

    if (Object.keys(options).filter(k => k.startsWith('run')).length > 1) {
      console.error(chalk.red('\nThese options are mutually exclusive: --run-only, --run-includes, --run-excludes, --run-all-except, --run-all, --run-vacuum'));
      options.help = true;
    } else if (!Object.keys(options).filter(x => x !== 'g' && x !== 'game').length) {
      console.warn(chalk.yellow('\nMust specify one of: --run-only, --run-includes, --run-excludes, --run-all-except, --run-from, --run-all, or --run-vacuum'));
      options.help = true;
    }

    if (options.help) {
      const usage: string = commandLineUsage([
        {
          header: 'Saccharose DB Importer',
          content: 'Imports game data json into a postgres database for this application.'
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
      case 'genshin-impact':
        if (isStringBlank(ENV.GENSHIN_DATA_ROOT)) {
          console.error(chalk.red('\n"GENSHIN_DATA_ROOT" must be set in .env\n'));
          return;
        }
        knex = databases.genshin;
        schemaSet = genshinSchema;
        getDataFilePath = getGenshinDataFilePath;
        break;
      case 'hsr':
      case 'starrail':
      case 'star-rail':
      case 'honkaistarrail':
        if (isStringBlank(ENV.HSR_DATA_ROOT)) {
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
        if (isStringBlank(ENV.ZENLESS_DATA_ROOT)) {
          console.error(chalk.red('\n"ZENLESS_DATA_ROOT" must be set in .env\n'));
          return;
        }
        knex = databases.zenless;
        schemaSet = zenlessSchema;
        getDataFilePath = getZenlessDataFilePath;
        break;
      case 'ww':
      case 'wuwa':
      case 'wuthering':
      case' wutheringwaves':
      case 'wuthering-waves':
        if (isStringBlank(ENV.WUWA_DATA_ROOT)) {
          console.error(chalk.red('\n"WUWA_DATA_ROOT" must be set in .env\n'));
          return;
        }
        knex = databases.wuwa;
        schemaSet = wuwaSchema;
        getDataFilePath = getWuwaDataFilePath;
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
    } else if (options['run-from']) {
      let table: string = options['run-from'];
      if (!schemaSet.hasOwnProperty(table)) {
        console.error(chalk.red('\nNot a valid table name: ' + table + '\n'));
        return;
      }

      let thresholdReached: boolean = false;
      tablesToRun = [];

      for (let schemaTable of Object.keys(schemaSet)) {
        if (schemaTable === table) {
          thresholdReached = true; // include self in threshold
        }
        if (thresholdReached) {
          tablesToRun.push(schemaTable);
        }
      }
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
    } else if (options['run-excludes']) {
      let input = (options['run-excludes'] as string[]).map(s => s.split(/[,;]/g)).flat(Infinity) as string[];
      tablesToRun = [];

      for (let table of Object.values(schemaSet)) {
        let anyExclude = input.find(x => table.name.toLowerCase().includes(x.toLowerCase()));

        if (!anyExclude) {
          tablesToRun.push(table.name);
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
