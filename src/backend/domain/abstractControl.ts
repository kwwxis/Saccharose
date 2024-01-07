import { Knex } from 'knex';
import { DEFAULT_SEARCH_MODE, IdUsages, IdUsagesItem, SEARCH_MODES, SearchMode } from '../../shared/util/searchUtil.ts';
import { openSqlite, SaccharoseDb } from '../util/db.ts';
import {
  CLD2_TO_LANG_CODE,
  DEFAULT_LANG,
  LANG_CODES,
  LangCode,
  LangCodeMap, LangSuggest,
  NON_SPACE_DELIMITED_LANG_CODES, PlainLineMapItem,
  TextMapHash, TextMapSearchResult,
} from '../../shared/types/lang-types.ts';
import {
  normalizeRawJson,
  normalizeRawJsonKey,
  schemaForDbName,
  SchemaTable,
  SchemaTableSet,
} from '../importer/import_db.ts';
import fs, { promises as fsp } from 'fs';
import { getPlainTextMapRelPath, getTextIndexRelPath } from '../loadenv.ts';
import path, { basename } from 'path';
import { escapeRegExp, isStringBlank, titleCase, ucFirst } from '../../shared/util/stringUtil.ts';
import { isInt, maybeInt, toInt } from '../../shared/util/numberUtil.ts';
import {
  getLineNumberForLineText,
  grep,
  grepStream,
  langDetect,
  ShellFlags,
} from '../util/shellutil.ts';
import { NormTextOptions } from './generic/genericNormalizers.ts';
import { ExtractScalar } from '../../shared/types/utility-types.ts';
import { ArrayStream } from '../../shared/util/arrayUtil.ts';
import { Request } from 'express';
import { defaultMap } from '../../shared/util/genericUtil.ts';
import { LangDetectResult } from '../../shared/types/common-types.ts';

export abstract class AbstractControlState {
  public request: Request = null;

  /**
   * Disables establishing database connection on instance construction.
   *
   * This only has effect if it is set to true before the `Control` instance is created.
   * If it is changed the instance is created, then it has no effect.
   */
  public NoDbConnect: boolean = false;

  constructor(request?: Request) {
    this.request = request || null;
  }

  get inputLangCode(): LangCode {
    if (this.request) {
      if (typeof this.request.query['input'] === 'string' && (LANG_CODES as string[]).includes(this.request.query['input'])) {
        return this.request.query['input'] as LangCode;
      }
      return this.request.cookies['inputLangCode'] || DEFAULT_LANG;
    }
    return DEFAULT_LANG;
  }

  get outputLangCode(): LangCode {
    if (this.request) {
      if (typeof this.request.query['output'] === 'string' && (LANG_CODES as string[]).includes(this.request.query['output'])) {
        return this.request.query['output'] as LangCode;
      }
      return this.request.cookies['outputLangCode'] || DEFAULT_LANG;
    }
    return DEFAULT_LANG;
  }

  get searchMode(): SearchMode {
    if (this.request) {
      if (typeof this.request.query['searchMode'] === 'string' && (SEARCH_MODES as string[]).includes(this.request.query['searchMode'])) {
        return this.request.query['searchMode'] as SearchMode;
      }
      return this.request.cookies['search-mode'] || DEFAULT_SEARCH_MODE;
    }
    return DEFAULT_SEARCH_MODE;
  }

  abstract copy(): AbstractControlState;
}

export abstract class AbstractControl<T extends AbstractControlState = AbstractControlState>  {
  readonly state: T;
  readonly knex: Knex;

  readonly disabledLangCodes: Set<LangCode> = new Set<LangCode>();
  protected excelPath: string;
  protected schema: SchemaTableSet;
  protected IdComparator = (a: any, b: any) => a.Id === b.Id;
  protected sortByOrder = (a: any, b: any) => {
    return a.Order - b.Order || a.Order - b.Order;
  };

  protected constructor(dbName: keyof SaccharoseDb, stateConstructor: {new(request?: Request): T}, requestOrState?: Request|T) {
    this.state = requestOrState instanceof AbstractControlState ? requestOrState : new stateConstructor(requestOrState);
    this.knex = this.state.NoDbConnect ? null : openSqlite()[dbName];
    this.schema = schemaForDbName(dbName);
  }

  abstract copy(): AbstractControl<T>;

  get inputLangCode(): LangCode {
    return this.state.inputLangCode;
  }

  get outputLangCode(): LangCode {
    return this.state.outputLangCode;
  }

  get searchMode(): SearchMode {
    return this.state.searchMode;
  }

  abstract i18n(key: string, vars?: Record<string, string>): string;

  langSuggest(query: string): LangSuggest {
    const result = langDetect(query);
    const code = CLD2_TO_LANG_CODE[result?.details?.[0]?.langCode?.toLowerCase()] ||
      result?.details?.[0]?.langCode?.toUpperCase();

    if (code === 'UN') { // UN is undefined/non-determinable
      return null;
    }

    let langName = result?.details?.[0]?.langName?.toLowerCase();

    if (langName === 'ChineseT'.toLowerCase()) {
      langName = 'Chinese (Traditional)';
    } else if (langName === 'Chinese'.toLowerCase()) {
      langName = 'Chinese (Simplified)';
    } else {
      langName = titleCase(langName);
    }

    return {
      matchesInputLangCode: code === this.inputLangCode,
      detected: {
        langCode: code,
        langName: langName,
        confidence: result?.details?.[0]?.confidence,
      },
      result
    };
  }

  get searchModeFlags(): string {
    let searchMode = this.searchMode;
    if (NON_SPACE_DELIMITED_LANG_CODES.includes(this.inputLangCode)) {
      if (searchMode === 'W') {
        searchMode = 'C';
      }
      if (searchMode === 'WI') {
        searchMode = 'CI';
      }
    }
    switch (searchMode) {
      case 'W':
        return '-w';
      case 'WI':
        return '-wi';
      case 'C':
        return '';
      case 'CI':
        return '-i';
      case 'R':
        return '-P';
      case 'RI':
        return '-Pi';
      default:
        return '-wi';
    }
  }

  abstract postProcess<T>(object: T, triggerNormalize?: SchemaTable|boolean, doNormText?: boolean): Promise<T>;

  readonly commonLoad = async (result: any[], triggerNormalize?: SchemaTable|boolean, doNormText: boolean = false) => await Promise.all(
    result.map(record => {
      return !record || !record.json_data
        ? this.postProcess(record, triggerNormalize, doNormText)
        : this.postProcess(JSON.parse(record.json_data), triggerNormalize, doNormText);
    })
  );

  readonly commonLoadFirst = async (record: any, triggerNormalize?: SchemaTable|boolean, doNormText: boolean = false) => {
    return !record || !record.json_data
      ? this.postProcess(record, triggerNormalize, doNormText)
      : await this.postProcess(JSON.parse(record.json_data), triggerNormalize, doNormText);
  };

  abstract getDataFilePath(file: string): string;

  abstract normText(text: string, langCode: LangCode, opts?: NormTextOptions): string;

  async getTextMapItem(langCode: LangCode, hash: TextMapHash): Promise<string> {
    if (typeof hash === 'number') {
      hash = String(hash);
    }
    if (typeof hash !== 'string') {
      return undefined;
    }
    if (langCode === 'CH') {
      langCode = 'CHS';
    }
    if (this.disabledLangCodes.has(langCode)) {
      return null;
    }
    return await this.knex.select('Text').from('TextMap'+langCode)
      .where({Hash: hash}).first().then(x => x?.Text);
  }

  async isEmptyTextMapItem(langCode: LangCode, hash: TextMapHash): Promise<boolean> {
    return isStringBlank(await this.getTextMapItem(langCode, hash));
  }

  async createLangCodeMap(hash: TextMapHash, doNormText: boolean = true): Promise<LangCodeMap> {
    let map = {};
    let promises: Promise<void>[] = [];
    for (let langCode of LANG_CODES) {
      if (this.disabledLangCodes.has(langCode)) {
        continue;
      }
      promises.push(this.getTextMapItem(langCode, hash).then(text => {
        map[langCode] = text;
        if (doNormText) {
          map[langCode] = this.normText(map[langCode], langCode);
        }
      }))
    }
    await Promise.all(promises);
    return map as LangCodeMap;
  }

  async selectPlainLineMapItem(langCode: LangCode, lineNum: number): Promise<PlainLineMapItem> {
    if (langCode === 'CH') {
      langCode = 'CHS';
    }
    if (this.disabledLangCodes.has(langCode)) {
      return {Hash: 0, Line: 0, LineType: null};
    }
    return await this.knex.select('*').from('PlainLineMap'+langCode)
      .where({Line: lineNum}).first().then();
  }

  getExcelPath(): string {
    return this.excelPath;
  }

  fileExists(filePath: string): boolean {
    return fs.existsSync(this.getDataFilePath(filePath));
  }

  async readJsonFile<T>(filePath: string): Promise<any> {
    return JSON.parse(await fsp.readFile(this.getDataFilePath(filePath), {encoding: 'utf8'}));
  }

  async readDataFile<T>(filePath: string, doNormText: boolean = false): Promise<ExtractScalar<T>[]> {
    let json = await this.readJsonFile(filePath);
    if (!Array.isArray(json)) {
      json = Object.values(json);
    }
    let fileBaseName = '/' + basename(filePath);
    let schemaTable = Object.values(this.schema).find(s => s.jsonFile.endsWith(fileBaseName));
    json = normalizeRawJson(json, schemaTable);
    if (Array.isArray(json)) {
      json = await this.commonLoad(json, null, doNormText);
    } else {
      json = await this.commonLoadFirst(json, null, doNormText);
    }
    return json;
  }

  async readExcelDataFile<T>(filePath: string, doNormText: boolean = false): Promise<ExtractScalar<T>[]> {
    return this.readDataFile(path.join(this.excelPath, filePath), doNormText);
  }

  readExcelDataFileToStream<T>(filePath: string, doNormText: boolean = false): ArrayStream<ExtractScalar<T>> {
    return new ArrayStream<ExtractScalar<T>>(this.readDataFile(path.join(this.excelPath, filePath), doNormText));
  }

  async getDataFileSize(filePath: string): Promise<number> {
    return fsp.stat(this.getDataFilePath(filePath)).then(ret => ret.size);
  }

  async getTextMapMatches(langCode: LangCode, searchText: string, flags?: string, startFromLine?: number, isRawInput?: boolean): Promise<TextMapSearchResult[]> {
    if (isStringBlank(searchText)) {
      return [];
    }

    const hashSeen: Set<TextMapHash> = new Set();
    const out: TextMapSearchResult[] = [];

    {
      const hash: TextMapHash = maybeInt(searchText.trim());
      const text = await this.getTextMapItem(langCode, searchText);
      if (text) {
        out.push({ hash, text, line: await getLineNumberForLineText(String(hash), this.getDataFilePath(getPlainTextMapRelPath(langCode, 'Hash'))) });
      }
    }

    const textFile = getPlainTextMapRelPath(langCode, 'Text');
    const max = toInt(ShellFlags.parseFlags(flags).getFlagValue('-m'));

    outerLoop: while (true) {
      const matches = await grep(searchText, this.getDataFilePath(textFile), flags + ' -n', true, startFromLine);
      let numAdded = 0;
      let lastLineNum = 0;

      for (let match of matches) {
        if (!match)
          continue;

        let lineNum = toInt(match.split(':', 2)[0]);
        lastLineNum = lineNum;

        if (isNaN(lineNum))
          continue;

        const { Hash: textMapHash, LineType: lineType } = await this.selectPlainLineMapItem(langCode, lineNum);

        if (isRawInput && lineType !== 'raw') {
          continue;
        }

        if (hashSeen.has(textMapHash)) {
          continue;
        } else {
          hashSeen.add(textMapHash);
        }

        out.push({ hash: textMapHash, text: await this.getTextMapItem(langCode, textMapHash), line: lineNum });
        numAdded++;

        if (!isNaN(max) && out.length >= max) {
          break outerLoop;
        }
      }

      if (!isNaN(max) && matches.length > 0 && matches.length === max && numAdded < matches.length && out.length < max) {
        startFromLine = lastLineNum + 1;
        continue;
      }

      break;
    }
    return out;
  }


  async streamTextMapMatchesWithIndex(langCode: LangCode,
                                      searchText: string,
                                      textIndexName: string,
                                      stream: (entityId: number, textMapHash: TextMapHash) => void,
                                      flags?: string): Promise<number|Error> {
    const textIndexFile = getTextIndexRelPath(textIndexName);
    const promises: Promise<void>[] = [];
    const batchMax = 100;
    const hashSeen: Set<TextMapHash> = new Set();

    let batch = [];

    const processBatch = () => {
      if (!batch.length) {
        return;
      }
      const regex = `"(` + batch.join('|') + `)":`;
      batch = [];
      promises.push((async () => {
        const matches = await grep(regex, this.getDataFilePath(textIndexFile), '-E', false);
        for (let match of matches) {
          let parts = /"(.*?)":\s+(\d+),?$/.exec(match);
          let textMapHash = maybeInt(parts[1]);
          let entityId = toInt(parts[2]);
          if (hashSeen.has(textMapHash)) {
            continue;
          } else {
            hashSeen.add(textMapHash);
          }
          stream(entityId, textMapHash);
        }
      })());
    };

    const ret = await this.streamTextMapMatches(langCode, searchText, (textMapHash: TextMapHash, _text: string) => {
      batch.push(textMapHash);
      if (batch.length >= batchMax) {
        processBatch();
      }
    }, flags);

    processBatch();

    await Promise.all(promises);

    return ret;
  }

  async* generateTextMapMatches(searchText: string): AsyncGenerator<TextMapHash> {
    let textMapHashes: TextMapHash[] = [];

    await this.streamTextMapMatches(this.inputLangCode, searchText,
      (textMapHash: TextMapHash) => textMapHashes.push(textMapHash),
      this.searchModeFlags
    );

    for (let textMapHash of textMapHashes) {
      yield textMapHash;
    }
  }

  async streamTextMapMatches(langCode: LangCode,
                             searchText: string,
                             stream: (textMapHash: TextMapHash, text?: string, kill?: () => void) => void,
                             flags?: string,
                             isRawInput?: boolean): Promise<number|Error> {
    if (isStringBlank(searchText)) {
      return 0;
    }

    const hashSeen: Set<TextMapHash> = new Set();

    if (isInt(searchText.trim())) {
      let didKill = false;
      const hash = maybeInt(searchText.trim());
      const text = await this.getTextMapItem(langCode, searchText);
      if (text) {
        stream(hash, text, () => didKill = true);
      }
      if (didKill) {
        return 0;
      }
    }

    const textFile = getPlainTextMapRelPath(langCode, 'Text');

    return await grepStream(searchText, this.getDataFilePath(textFile), async (match: string, kill: () => void) => {
      if (!match)
        return;

      const lineNum = toInt(match.split(':', 2)[0]);
      if (isNaN(lineNum))
        return;

      const { Hash: textMapHash, LineType: lineType } = await this.selectPlainLineMapItem(langCode, lineNum);
      const text: string = await this.getTextMapItem(langCode, textMapHash);

      if (isRawInput && lineType !== 'raw') {
        return;
      }

      if (hashSeen.has(textMapHash)) {
        return;
      } else {
        hashSeen.add(textMapHash);
      }
      stream(textMapHash, text, kill);
    }, flags + ' -n');
  }

  async findTextMapHashesByExactName(name: string): Promise<TextMapHash[]> {
    let results = [];

    const cmp = (a: string, b: string) => {
      return this.normText(a, this.inputLangCode, { plaintext: true, decolor: true })?.toLowerCase() ===
        this.normText(b, this.inputLangCode, { plaintext: true, decolor: true })?.toLowerCase();
    }

    await this.streamTextMapMatches(this.inputLangCode, name, (id: TextMapHash, value: string) => {
      if (cmp(value, name)) {
        results.push(id);
      }
    }, '-wi');

    if (!results.length) {
      let searchRegex = escapeRegExp(name).split(/\s+/g).join('.*?').split(/(')/g).join('.*?');

      await this.streamTextMapMatches(this.inputLangCode, searchRegex, (id: TextMapHash, value: string) => {
        if (cmp(value, name)) {
          results.push(id);
        }
      }, '-Pi');
    }

    return results;
  }

  async getExcelFileNames(): Promise<string[]> {
    return (await fsp.readdir(this.getDataFilePath(this.excelPath)))
      .filter(file => path.extname(file) === '.json')
      .map(file => file.slice(0, -5));
  }

  async getIdUsages(id: number|string): Promise<IdUsages> {
    let out: IdUsages = {};

    let decimalRegex = new RegExp(`(\\.${id}|${id}\\.)`)
    let fieldRegex = new RegExp(`(\\s*)"([^"]+)":\\s*["\\[]?`);

    let grepQuery = String(id);
    let grepFlags: string;

    if (grepQuery.startsWith('-')) {
      grepQuery = grepQuery.slice(1);
    }

    if (/^[a-zA-Z0-9_]+$/.test(grepQuery)) {
      grepFlags = '-wrn';
    } else {
      grepFlags = '-rn';
    }

    const unresolvedRefs: {[fileName: string]: Set<IdUsagesItem>} = defaultMap('Set');

    await grepStream(grepQuery, this.getDataFilePath(this.excelPath), async (result) => {
      if (decimalRegex.test(result)) {
        return;
      }

      let exec = /\/([^\/]+).json:(\d+)/.exec(result);
      if (exec && exec.length >= 3) {
        let fileName = exec[1];
        let lineNum = parseInt(exec[2]);
        if (!out[fileName]) {
          out[fileName] = [];
        }

        let fieldExec = fieldRegex.exec(result);
        let fieldWhitespace = fieldExec && fieldExec[1];
        let fieldName = fieldExec && fieldExec[2]; // doesn't include file extension
        let refObject: any = undefined;

        if (!fieldName) {
          return;
        }

        if (fieldName && this.schema[fileName]) {
          let table: SchemaTable = this.schema[fileName];
          let normFieldName = normalizeRawJsonKey(fieldName, table);
          for (let column of table.columns) {
            if (column.name === normFieldName && (column.isPrimary || column.isIndex)) {
              refObject = await this.knex.select('*').from(table.name)
                .where({[column.name]: id}).first().then(this.commonLoadFirst);
            }
          }
        }

        const outObj: IdUsagesItem = {
          lineNumber: lineNum,
          field: normalizeRawJsonKey(fieldName),
          originalField: fieldName,
          refObject: refObject,
        };

        out[fileName].push(outObj);

        // Check fieldWhitespace for only top-level field matches (4 spaces or fewer)
        if (!outObj.refObject && fieldWhitespace && fieldWhitespace.length <= 4) {
          unresolvedRefs[fileName].add(outObj);
        }
      }
    }, grepFlags);

    if (Object.keys(unresolvedRefs).length) {
      for (let fileName of Object.keys(unresolvedRefs)) {
        let json: any[] = await this.readJsonFile(path.join(this.excelPath, fileName + '.json'));
        let resolvedCount = 0;
        for (let obj of json) {
          for (let usageItem of unresolvedRefs[fileName]) {
            if (obj[usageItem.originalField] === id) {
              usageItem.refObject = await this.commonLoadFirst(obj, true);
              resolvedCount++;
              unresolvedRefs[fileName].delete(usageItem);
              break;
            }
          }
          if (resolvedCount === unresolvedRefs[fileName].size) {
            break;
          }
        }
      }
    }

    return out;
  }
}
