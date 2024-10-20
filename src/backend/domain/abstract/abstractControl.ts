// Loadenv:
import { getPlainTextMapRelPath, getTextIndexRelPath } from '../../loadenv.ts';

// Third-Party:
import { Knex } from 'knex';
import { Request } from 'express';
import fs, { promises as fsp } from 'fs';
import path, { basename } from 'path';

// Database:
import {
  normalizeRawJson,
  normalizeRawJsonKey,
  schemaForDbName,
  SchemaTable,
  SchemaTableSet,
} from '../../importer/import_db.ts';

// Backend Util:
import { openPg, openSqlite, SaccharoseDb } from '../../util/db.ts';
import { getLineNumberForLineText, grep, grepStream, langDetect, ShellFlags } from '../../util/shellutil.ts';
import { _cachedImpl } from '../../util/cache.ts';

// Share Types:
import {
  CLD2_TO_LANG_CODE,
  LANG_CODES,
  LangCode,
  LangCodeMap,
  LangSuggest,
  NON_SPACE_DELIMITED_LANG_CODES,
  PlainLineMapItem,
  TextMapHash, TextMapSearchOpts, TextMapSearchIndexStreamOpts,
  TextMapSearchResult, TextMapSearchStreamOpts,
} from '../../../shared/types/lang-types.ts';
import { ExtractScalar, FileAndSize } from '../../../shared/types/utility-types.ts';
import {
  ImageCategoryMap,
  ImageIndexEntity,
  ImageIndexSearchParams,
  ImageIndexSearchResult,
} from '../../../shared/types/image-index-types.ts';

// Shared Util:
import { ExcelUsages, SearchMode } from '../../../shared/util/searchUtil.ts';
import { escapeRegExp, isStringBlank, titleCase } from '../../../shared/util/stringUtil.ts';
import { isInt, maybeInt, toInt } from '../../../shared/util/numberUtil.ts';
import { ArrayStream, cleanEmpty, toArray, walkObject } from '../../../shared/util/arrayUtil.ts';
import { defaultMap, isUnset, toBoolean } from '../../../shared/util/genericUtil.ts';
import { Marker } from '../../../shared/util/highlightMarker.ts';
import { uuidv4 } from '../../../shared/util/uuidv4.ts';

// Same Directory Imports:
import { AbstractControlState } from './abstractControlState.ts';
import { NormTextOptions } from './genericNormalizers.ts';
import { ChangeRecordRef, FullChangelog, TextMapChangeRef } from '../../../shared/types/changelog-types.ts';
import { GameVersion } from '../../../shared/types/game-versions.ts';
import { ScriptJobActionArgs, ScriptJobCoordinator, ScriptJobPostResult } from '../../util/scriptJobs.ts';
import { RequestSiteMode } from '../../routing/requestContext.ts';

export abstract class AbstractControl<T extends AbstractControlState = AbstractControlState> {
  // region Fields
  readonly state: T;
  readonly knex: Knex;
  readonly dbName: keyof SaccharoseDb;
  readonly cachePrefix: string;
  readonly siteMode: RequestSiteMode;

  readonly disabledLangCodes: Set<LangCode> = new Set<LangCode>();
  protected excelPath: string;
  readonly schema: SchemaTableSet;
  protected IdComparator = (a: { Id: any }, b: { Id: any }) => a.Id === b.Id;
  protected sortByOrder = (a: { Order: number }, b: { Order: number }) => {
    return a.Order - b.Order || a.Order - b.Order;
  };
  // endregion

  // region Constructor / Copy
  protected constructor(siteMode: RequestSiteMode,
                        dbName: keyof SaccharoseDb,
                        cachePrefix: string,
                        stateConstructor: {new(request?: Request): T},
                        requestOrState?: Request|T) {
    this.siteMode = siteMode;
    this.state = requestOrState instanceof AbstractControlState ? requestOrState : new stateConstructor(requestOrState);
    this.knex = this.state.NoDbConnect ? null : openSqlite()[dbName];
    this.schema = schemaForDbName(dbName);
    this.dbName = dbName;
    this.cachePrefix = cachePrefix.endsWith(':') ? cachePrefix : cachePrefix + ':';
  }

  abstract copy(): AbstractControl<T>;

  abstract i18n(key: string, vars?: Record<string, string>): string;


  async cached(key: string, valueMode: 'string', supplierFn: (key?: string) => Promise<string>): Promise<string>
  async cached(key: string, valueMode: 'buffer', supplierFn: (key?: string) => Promise<Buffer>): Promise<Buffer>
  async cached(key: string, valueMode: 'boolean', supplierFn: (key?: string) => Promise<boolean>): Promise<boolean>
  async cached<T>(key: string, valueMode: 'memory', supplierFn: (key?: string) => Promise<T>): Promise<T>
  async cached<T>(key: string, valueMode: 'json', supplierFn: (key?: string) => Promise<T>): Promise<T>
  async cached<T>(key: string, valueMode: 'set', supplierFn: (key?: string) => Promise<Set<T>>): Promise<Set<T>>
  async cached<T>(key: string, valueMode: 'string' | 'buffer' | 'json' | 'set' | 'boolean' | 'memory', supplierFn: (key?: string) => Promise<T>): Promise<T> {
    return _cachedImpl(this.cachePrefix + key, valueMode, supplierFn);
  }
  // endregion

  // region State Property Aliases
  get inputLangCode(): LangCode {
    return this.state.inputLangCode;
  }

  get outputLangCode(): LangCode {
    return this.state.outputLangCode;
  }

  get searchMode(): SearchMode {
    return this.state.searchMode;
  }

  get searchModeIsRegex(): boolean {
    return this.searchMode === 'R' || this.searchMode === 'RI';
  }

  get searchModeReFlags(): string {
    return this.searchModeFlags.includes('i') ? 'gi' : 'g';
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

  // endregion

  // region Lang Suggest
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
      result,
    };
  }

  // endregion

  // region DB Post Process / Common Load
  abstract postProcess<T>(object: T, triggerNormalize?: SchemaTable | boolean, doNormText?: boolean): Promise<T>;

  readonly commonLoad = async (result: any[], triggerNormalize?: SchemaTable | boolean, doNormText: boolean = false) => await Promise.all(
    result.map(record => {
      return !record || !record.json_data
        ? this.postProcess(record, triggerNormalize, doNormText)
        : this.postProcess(JSON.parse(record.json_data), triggerNormalize, doNormText);
    }),
  );

  readonly commonLoadFirst = async (record: any, triggerNormalize?: SchemaTable | boolean, doNormText: boolean = false) => {
    return !record || !record.json_data
      ? this.postProcess(record, triggerNormalize, doNormText)
      : await this.postProcess(JSON.parse(record.json_data), triggerNormalize, doNormText);
  };
  // endregion

  // region TextMap Item
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
    return await this.knex.select('Text').from('TextMap' + langCode)
      .where({ Hash: hash }).first().then(x => x?.Text);
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
      }));
    }
    await Promise.all(promises);
    return map as LangCodeMap;
  }

  async selectPlainLineMapItem(langCode: LangCode, lineNum: number): Promise<PlainLineMapItem> {
    if (langCode === 'CH') {
      langCode = 'CHS';
    }
    if (this.disabledLangCodes.has(langCode)) {
      return { Hash: 0, Line: 0, LineType: null };
    }
    return await this.knex.select('*').from('PlainLineMap' + langCode)
      .where({ Line: lineNum }).first().then();
  }

  // endregion

  // region Data Directory
  abstract getDataFilePath(file: string): string;

  fileExists(filePath: string): boolean {
    return fs.existsSync(this.getDataFilePath(filePath));
  }

  getExcelPath(subPath?: string): string {
    return subPath ? path.join(this.excelPath, subPath) : this.excelPath;
  }

  async getExcelFileNames(): Promise<FileAndSize[]> {
    return (await fsp.readdir(this.getDataFilePath(this.excelPath)))
      .filter(file => path.extname(file) === '.json')
      .asyncMap(async file => ({
        name: file.slice(0, -5),
        size: await this.getDataFileSize(this.excelPath + '/' + file),
      }));
  }

  async readJsonFile<T>(filePath: string): Promise<any> {
    return JSON.parse(await fsp.readFile(this.getDataFilePath(filePath), { encoding: 'utf8' }));
  }

  async normalize(json: any | any[], schemaTable: string | SchemaTable, doNormText: boolean = false) {
    if (typeof schemaTable === 'string') {
      let fileBaseName = '/' + basename(schemaTable);
      schemaTable = Object.values(this.schema).find(s => s.jsonFile.endsWith(fileBaseName));
    }
    json = normalizeRawJson(json, schemaTable);
    if (Array.isArray(json)) {
      json = await this.commonLoad(json, null, doNormText);
    } else {
      json = await this.commonLoadFirst(json, null, doNormText);
    }
    return json;
  }

  async readDataFile<T>(filePath: string, doNormText: boolean = false): Promise<ExtractScalar<T>[]> {
    let json = await this.readJsonFile(filePath);
    if (!Array.isArray(json)) {
      json = Object.values(json);
    }
    return this.normalize(json, filePath, doNormText);
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

  // endregion

  // region Text Map Searching
  async getTextMapMatches(opts: TextMapSearchOpts): Promise<TextMapSearchResult[]> {
    if (isStringBlank(opts.searchText)) {
      return [];
    }
    if (!opts.searchAgainst) {
      opts.searchAgainst = 'Text';
    }

    const hashSeen: Set<TextMapHash> = new Set();
    const out: TextMapSearchResult[] = [];

    const shellFlags: ShellFlags = ShellFlags.parseFlags(opts.flags);
    const reFlags: string = shellFlags.has("-i") ? 'gi' : 'g';
    const hasRegexFlag = shellFlags.has('-P') || shellFlags.has('-e');
    const re = new RegExp(hasRegexFlag ? opts.searchText : escapeRegExp(opts.searchText), reFlags);

    {
      const possibleHashes: TextMapHash[] = [maybeInt(opts.searchText.trim())];
      if (opts.searchText.includes(',') || opts.searchText.includes(';')) {
        for (let sub of opts.searchText.split(/[,;]/)) {
          if (sub.trim().length) {
            possibleHashes.push(maybeInt(sub.trim()));
          }
        }
      }

      for (let possibleHash of possibleHashes) {
        if (!!possibleHash && /^[a-zA-Z0-9_\-]+$/.test(String(possibleHash))) {
          let text = await this.getTextMapItem(opts.outputLangCode, possibleHash);
          if (text) {
            if (opts.doNormText) {
              text = this.normText(text, opts.outputLangCode);
            }
            hashSeen.add(possibleHash);
            const version: string = (await this.selectTextMapChangeRefAdded(possibleHash, opts.outputLangCode))?.version;
            if (opts.versionFilter && (!version || !opts.versionFilter.has(version))) {
              continue;
            }
            out.push({
              hash: possibleHash,
              text,
              line: await getLineNumberForLineText(String(possibleHash), this.getDataFilePath(getPlainTextMapRelPath(opts.inputLangCode, 'Hash'))),
              hashMarkers: opts.searchAgainst === 'Hash' ? Marker.create(re, String(possibleHash)) : undefined,
              version
            });
          }
        }
      }
    }

    const textFile: string = getPlainTextMapRelPath(opts.inputLangCode, opts.searchAgainst);
    const max: number = toInt(shellFlags.getFlagValue('-m'));
    let startFromLine = opts.startFromLine;

    outerLoop: while (true) {
      const matches = await grep(opts.searchText, this.getDataFilePath(textFile),
        { flags: (opts.flags || '') + ' -n', startFromLine });
      let numAdded = 0;
      let lastLineNum = 0;

      for (let match of matches) {
        if (!match)
          continue;

        let lineNum = toInt(match.split(':', 2)[0]);
        lastLineNum = lineNum;

        if (isNaN(lineNum))
          continue;

        const { Hash: textMapHash, LineType: lineType } = await this.selectPlainLineMapItem(opts.inputLangCode, lineNum);

        if (opts.searchAgainst === 'Text' && opts.isRawInput && lineType !== 'raw') {
          continue;
        }

        if (hashSeen.has(textMapHash)) {
          continue;
        } else {
          hashSeen.add(textMapHash);
        }

        let text = await this.getTextMapItem(opts.outputLangCode, textMapHash);
        if (opts.doNormText) {
          text = this.normText(text, opts.outputLangCode);
        }

        const version: string = (await this.selectTextMapChangeRefAdded(textMapHash, opts.outputLangCode))?.version;
        if (opts.versionFilter && (!version || !opts.versionFilter.has(version))) {
          continue;
        }

        out.push({
          hash: textMapHash,
          text: text,
          line: lineNum,
          markers: opts.searchAgainst === 'Text' && opts.inputLangCode === opts.outputLangCode ? Marker.create(re, text) : undefined,
          hashMarkers: opts.searchAgainst === 'Hash' ? Marker.create(re, String(textMapHash)) : undefined,
          version,
        });
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

  async streamTextMapMatchesWithIndex(opts: TextMapSearchIndexStreamOpts): Promise<number | Error> {
    const textIndexFiles: { name: string, path: string }[] = toArray(opts.textIndexName).map(textIndexName => ({
      name: textIndexName,
      path: getTextIndexRelPath(textIndexName)
    }));

    const promises: Promise<void>[] = [];
    const batchMax: number = 100;
    const hashSeen: Set<TextMapHash> = new Set();

    let batch: TextMapHash[] = [];
    let batchHashToText: Record<TextMapHash, string> = {};

    const processBatch = () => {
      if (!batch.length) {
        return;
      }
      const regex = `"(` + batch.join('|') + `)":`;
      batch = [];
      promises.push((async () => {
        for (let textIndexFile of textIndexFiles) {
          const matches = await grep(regex, this.getDataFilePath(textIndexFile.path),
            { flags: '-P', escapeDoubleQuotes: false});
          for (let match of matches) {
            let parts = /"(.*?)":\s+(\d+),?$/.exec(match);
            let textMapHash = maybeInt(parts[1]);
            let entityId = toInt(parts[2]);
            if (hashSeen.has(textMapHash)) {
              continue;
            } else {
              hashSeen.add(textMapHash);
            }
            opts.stream(entityId, textIndexFile.name, textMapHash, batchHashToText[textMapHash]);
            delete batchHashToText[textMapHash];
          }
        }
      })());
    };

    const nonIndexStreamOpts: TextMapSearchStreamOpts = Object.assign({}, opts, <Partial<TextMapSearchStreamOpts>> {
      stream: (textMapHash: TextMapHash, text: string) => {
        batch.push(textMapHash);
        batchHashToText[textMapHash] = text;
        if (batch.length >= batchMax) {
          processBatch();
        }
      }
    });

    const ret = await this.streamTextMapMatches(nonIndexStreamOpts);

    processBatch();

    await Promise.all(promises);

    return ret;
  }

  async* generateTextMapMatches(opts: TextMapSearchOpts): AsyncGenerator<TextMapHash> {
    let textMapHashes: TextMapHash[] = [];

    await this.streamTextMapMatches({
      ... opts,
      stream: (textMapHash: TextMapHash) => textMapHashes.push(textMapHash),
    });

    for (let textMapHash of textMapHashes) {
      yield textMapHash;
    }
  }

  async streamTextMapMatches(opts: TextMapSearchStreamOpts): Promise<number | Error> {
    if (isStringBlank(opts.searchText)) {
      return 0;
    }
    if (!opts.searchAgainst) {
      opts.searchAgainst = 'Text';
    }

    const hashSeen: Set<TextMapHash> = new Set();

    if (isInt(opts.searchText.trim())) {
      let didKill = false;
      const hash = maybeInt(opts.searchText.trim());
      let text = await this.getTextMapItem(opts.inputLangCode, opts.searchText);

      if (text && opts.versionFilter) {
        const version: string = (await this.selectTextMapChangeRefAdded(hash, opts.outputLangCode))?.version;
        if (!version || !opts.versionFilter.has(version)) {
          text = null;
        }
      }

      if (text) {
        if (opts.doNormText) {
          text = this.normText(text, opts.outputLangCode);
        }
        hashSeen.add(hash);
        opts.stream(hash, text, () => didKill = true);
      }
      if (didKill) {
        return 0;
      }
    }

    const textFile = getPlainTextMapRelPath(opts.inputLangCode, opts.searchAgainst);

    return await grepStream(opts.searchText, this.getDataFilePath(textFile), async (match: string, kill: () => void) => {
      if (!match)
        return;

      const lineNum = toInt(match.split(':', 2)[0]);
      if (isNaN(lineNum))
        return;

      const { Hash: textMapHash, LineType: lineType } = await this.selectPlainLineMapItem(opts.inputLangCode, lineNum);
      let text: string = await this.getTextMapItem(opts.outputLangCode, textMapHash);

      if (opts.searchAgainst === 'Text' && opts.isRawInput && lineType !== 'raw') {
        return;
      }

      if (hashSeen.has(textMapHash)) {
        return;
      } else {
        hashSeen.add(textMapHash);
      }

      if (opts.versionFilter) {
        const version: string = (await this.selectTextMapChangeRefAdded(textMapHash, opts.outputLangCode))?.version;
        if (!version || !opts.versionFilter.has(version)) {
          return;
        }
      }

      if (opts.doNormText) {
        text = this.normText(text, opts.outputLangCode);
      }
      opts.stream(textMapHash, text, kill);
    }, { flags: (opts.flags || '') + ' -n', startFromLine: opts.startFromLine });
  }

  async findTextMapHashesByExactName(name: string): Promise<TextMapHash[]> {
    let results: TextMapHash[] = [];

    const cmp = (a: string, b: string) => {
      return this.normText(a, this.inputLangCode, { plaintext: true, decolor: true })?.toLowerCase() ===
        this.normText(b, this.inputLangCode, { plaintext: true, decolor: true })?.toLowerCase();
    };

    await this.streamTextMapMatches({
      inputLangCode: this.inputLangCode,
      outputLangCode: this.inputLangCode,
      searchText: name,
      stream: (id: TextMapHash, value: string) => {
        if (cmp(value, name)) {
          results.push(id);
        }
      },
      flags: '-wi'
    });

    if (!results.length) {
      let searchRegex = escapeRegExp(name).split(/\s+/g).join('.*?').split(/(')/g).join('.*?');

      await this.streamTextMapMatches({
        inputLangCode: this.inputLangCode,
        outputLangCode: this.inputLangCode,
        searchText: searchRegex,
        stream: (id: TextMapHash, value: string) => {
          if (cmp(value, name)) {
            results.push(id);
          }
        },
        flags: '-Pi'
      });
    }

    return results;
  }
  // endregion

  // region Excel Usages
  async getExcelUsages(id: number | string): Promise<ExcelUsages> {
    const out: ExcelUsages = defaultMap('Array');

    const filesFoundIn: {[fileName: string]: number} = defaultMap('Zero');

    {
      const decimalRegex = new RegExp(`(\\.${id}|${id}\\.)`);

      let grepQuery = String(id);
      let grepFlags: string;

      if (grepQuery.startsWith('-')) {
        grepQuery = grepQuery.slice(1);
      }

      if (/^[a-zA-Z0-9_]+$/.test(grepQuery)) {
        grepFlags = '-wn';
      } else {
        grepFlags = '-n';
      }

      await grepStream(grepQuery, this.getDataFilePath(this.excelPath), async (result) => {
        if (decimalRegex.test(result)) {
          return;
        }

        let exec = /\/([^\/]+).json:(\d+)/.exec(result);
        if (exec && exec.length >= 3) {
          let fileName = exec[1];
          filesFoundIn[fileName] += 1;
        }
      }, { flags: grepFlags });
    }

    for (let fileName of Object.keys(filesFoundIn)) {
      let json: any[] = await this.cached('ExcelUsagesFileRead:' + fileName, 'json', async () => {
        return await this.readJsonFile(path.join(this.excelPath, fileName + '.json'));
      });
      if (!Array.isArray(json)) {
        console.log('JSON', path.join(this.excelPath, fileName + '.json'));
      }

      const schemaTable: SchemaTable = this.schema[fileName];
      const promises: Promise<void>[] = [];

      const expectedNumResults = filesFoundIn[fileName];
      let currRefIndex: number = -1;
      let currNumResults: number = 0;

      for (let obj of json) {
        let myRefIndex = currRefIndex++;
        walkObject(obj, (curr) => {
          if (curr.isLeaf && curr.value === id) {
            currNumResults++;
            promises.push((async () => {
              const refObject: any = await this.commonLoadFirst(obj, schemaTable || true, true);
              const refObjectStringified: string = JSON.stringify(refObject, null, 2);
              const refObjectMarkers: Marker[] = Marker.create(
                new RegExp((String(id).startsWith('-') ? '' : '\\b') + escapeRegExp(String(id)) + '\\b', 'g'),
                refObjectStringified
              );

              out[fileName].push({
                field: curr.path.split('.').map(s => normalizeRawJsonKey(s)).join('.'),
                originalField: curr.path,
                refIndex: myRefIndex,
                refObject,
                refObjectStringified,
                refObjectMarkers,
              });
            })());
            return 'QUIT';
          }
        });
        if (currNumResults >= expectedNumResults) {
          break;
        }
      }
      await Promise.all(promises);
    }

    return out;
  }
  // endregion

  // region Changelog
  abstract selectVersions(): GameVersion[];

  abstract selectCurrentVersion(): GameVersion;

  async selectAllChangelogs(): Promise<Record<string, FullChangelog>> {
    return {};
  }

  async selectChangelog(version: GameVersion): Promise<FullChangelog> {
    return null;
  }

  async selectChangeRecordAdded(id: string|number): Promise<ChangeRecordRef[]>
  async selectChangeRecordAdded(id: string|number, excelFile: string): Promise<ChangeRecordRef>

  async selectChangeRecordAdded(id: string|number, excelFile?: string): Promise<ChangeRecordRef|ChangeRecordRef[]> {
    return excelFile ? null : [];
  }

  async selectChangeRecords(id: string|number, excelFile?: string): Promise<ChangeRecordRef[]> {
    return [];
  }

  async selectTextMapChangeRefAdded(hash: TextMapHash, langCode: LangCode): Promise<TextMapChangeRef> {
    return null;
  }

  async selectTextMapChangeRefs(hash: TextMapHash, langCode: LangCode): Promise<TextMapChangeRef[]> {
    return [];
  }
  // endregion

  // region Texture2D Media
  async listImageCategories(): Promise<ImageCategoryMap> {
    return this.cached('ImageIndexCategoryMap', 'json', async () => {
      return this.readJsonFile('ImageIndexCategoryMap.json');
    });
  }

  async selectImageIndexEntity(imageName: string): Promise<ImageIndexEntity> {
    return openPg().select('*').from(this.dbName + '_image_index').where({ image_name: imageName }).first().then();
  }

  async selectImageIndexEntityAndUsages(imageName: string): Promise<{
    entity: ImageIndexEntity;
    usageEntities: { [fileName: string]: any[]; }
  }> {
    const entity: ImageIndexEntity = await this.selectImageIndexEntity(imageName);
    const usageEntities: { [fileName: string]: any[] } = {};
    if (!entity) {
      return { entity, usageEntities };
    }

    if (entity.excel_meta && Object.keys(entity.excel_meta).length) {
      for (let [excelFileName, metaEntry] of Object.entries(entity.excel_meta)) {
        let myData: any[] = [];
        const excelData: any[] = await this.readJsonFile(this.getExcelPath(`./${excelFileName}`));
        for (let row of metaEntry.rows) {
          myData.push(excelData[row]);
        }
        myData = await this.normalize(myData, excelFileName, true);
        usageEntities[excelFileName] = myData;
      }
    }

    return { entity, usageEntities };
  }

  buildImageIndexSearchParamsFromRequest(req: Request): ImageIndexSearchParams {
    return {
      query: (req.query.query || '') as string,
      cat1: req.query.cat1 as string,
      cat2: req.query.cat2 as string,
      cat3: req.query.cat3 as string,
      cat4: req.query.cat4 as string,
      cat5: req.query.cat5 as string,
      catPath: req.query.catPath as string,
      catRestrict: toBoolean(req.query.catRestrict),
      offset: isInt(req.query.offset) ? toInt(req.query.offset) : 0,
      searchMode: req.query.searchMode ? (String(req.query.searchMode) as SearchMode) : this.searchMode
    };
  }

  async postCreateImageIndexArchiveJob(select: ImageIndexSearchParams): Promise<ScriptJobPostResult<"createImageIndexArchive">> {
    select.limit = -1;
    const args: ScriptJobActionArgs<'createImageIndexArchive'> = {
      siteMode: this.siteMode,
      searchParams: select
    };
    return ScriptJobCoordinator.post('createImageIndexArchive', args);
  }

  async searchImageIndex(select: ImageIndexSearchParams): Promise<ImageIndexSearchResult> {
    const query: string = select.query ? select.query.trim() : null;

    if (!select.offset)
      select.offset = 0;
    if (select.offset < 0)
      throw 'offset cannot be less than zero.';
    if (!select.limit)
      select.limit = 50;
    if (select.limit < -1)
      throw 'limit cannot be less than -1';
    if (!select.searchMode)
      select.searchMode = this.searchMode;

    let builder: Knex.QueryBuilder = openPg().select('*').from(this.dbName + '_image_index');

    if (query) {
      switch (select.searchMode) {
        case 'W':
        case 'C':
          builder = builder.where('image_name', 'LIKE', '%' + query + '%');
          if (query.includes(' ')) {
            builder = builder.orWhere('image_name', 'LIKE', '%' + query.replace(/ /g, '_') + '%');
          }
          break;
        case 'WI':
        case 'CI':
          builder = builder.where('image_name', 'ILIKE', '%' + query + '%');
          if (query.includes(' ')) {
            builder = builder.orWhere('image_name', 'ILIKE', '%' + query.replace(/ /g, '_') + '%');
          }
          break;
        case 'R':
          builder = builder.where('image_name', '~', query);
          if (query.includes(' ')) {
            builder = builder.orWhere('image_name', '~', query.replace(/ /g, '_'));
          }
          break;
        case 'RI':
          builder = builder.where('image_name', '~*', query);
          if (query.includes(' ')) {
            builder = builder.orWhere('image_name', '~*', query.replace(/ /g, '_'));
          }
          break;
      }
    }

    if (select.catPath) {
      [select.cat1, select.cat2, select.cat3, select.cat4, select.cat5, select.cat6, select.cat7, select.cat8]
        = select.catPath.split(/[_.]/g);
    }

    const catClauseValues = cleanEmpty({
      image_cat1: select.cat1,
      image_cat2: select.cat2,
      image_cat3: select.cat3,
      image_cat4: select.cat4,
      image_cat5: select.cat5,
      image_cat6: select.cat6,
      image_cat7: select.cat7,
      image_cat8: select.cat8,
    });

    for (let key of Object.keys(catClauseValues)) {
      if (catClauseValues[key] === 'null') {
        catClauseValues[key] = null;
      }
    }
    if (select.catRestrict) {
      for (let key of ['image_cat1', 'image_cat2', 'image_cat3', 'image_cat4', 'image_cat5', 'image_cat6', 'image_cat7', 'image_cat8']) {
        if (isUnset(catClauseValues[key])) {
          catClauseValues[key] = null;
        }
      }
    }

    if (Object.keys(catClauseValues).length) {
      builder = builder.where(catClauseValues);
    }

    const offset = select.offset;
    const limit = select.limit;
    const limitPlusOne = select.limit + 1;

    builder = builder.orderBy('image_name').offset(offset);

    if (limit !== -1) {
      builder = builder.limit(limitPlusOne);
    }

    const results: ImageIndexEntity[] = await builder.then((rows: ImageIndexEntity[]) => {
      rows.forEach(row => {
        delete row['ts'];
      });
      return rows;
    });

    if (limit === -1) {
      return {
        results,
        hasMore: false,
        offset,
        nextOffset: undefined,
      }
    } else {
      return {
        results: results.slice(0, limit),
        hasMore: results.length === limitPlusOne,
        offset,
        nextOffset: results.length === limitPlusOne
          ? offset + limit
          : undefined,
      };
    }
  }
  // endregion

  sanitizeFileName(fileName: string): string {
    return encodeURIComponent(fileName ? fileName.replaceAll(/[\\\/:*?"<>|]/g, '') : '');
  }
}
