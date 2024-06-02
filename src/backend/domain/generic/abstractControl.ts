import { Knex } from 'knex';
import { IdUsages, IdUsagesItem, SearchMode } from '../../../shared/util/searchUtil.ts';
import { openPg, openSqlite, SaccharoseDb } from '../../util/db.ts';
import {
  CLD2_TO_LANG_CODE,
  LANG_CODES,
  LangCode,
  LangCodeMap,
  LangSuggest,
  NON_SPACE_DELIMITED_LANG_CODES,
  PlainLineMapItem,
  TextMapHash,
  TextMapSearchResult,
} from '../../../shared/types/lang-types.ts';
import {
  normalizeRawJson,
  normalizeRawJsonKey,
  schemaForDbName,
  SchemaTable,
  SchemaTableSet,
} from '../../importer/import_db.ts';
import fs, { promises as fsp } from 'fs';
import { getPlainTextMapRelPath, getTextIndexRelPath } from '../../loadenv.ts';
import path, { basename } from 'path';
import { escapeRegExp, isString, isStringBlank, titleCase } from '../../../shared/util/stringUtil.ts';
import { isInt, maybeInt, toInt } from '../../../shared/util/numberUtil.ts';
import { getLineNumberForLineText, grep, grepStream, langDetect, ShellFlags } from '../../util/shellutil.ts';
import { NormTextOptions } from './genericNormalizers.ts';
import { ExtractScalar } from '../../../shared/types/utility-types.ts';
import { ArrayStream, cleanEmpty } from '../../../shared/util/arrayUtil.ts';
import { Request } from 'express';
import { defaultMap, isUnset } from '../../../shared/util/genericUtil.ts';
import { Marker } from '../../../shared/util/highlightMarker.ts';
import { ImageCategoryMap, ImageIndexEntity, ImageIndexSearchResult } from '../../../shared/types/image-index-types.ts';
import { cached } from '../../util/cache.ts';
import { AbstractControlState } from './abstractControlState.ts';

export abstract class AbstractControl<T extends AbstractControlState = AbstractControlState> {
  // region Fields
  readonly state: T;
  readonly knex: Knex;
  readonly dbName: keyof SaccharoseDb;

  readonly disabledLangCodes: Set<LangCode> = new Set<LangCode>();
  protected excelPath: string;
  readonly schema: SchemaTableSet;
  protected IdComparator = (a: any, b: any) => a.Id === b.Id;
  protected sortByOrder = (a: any, b: any) => {
    return a.Order - b.Order || a.Order - b.Order;
  };
  // endregion

  // region Constructor / Copy
  protected constructor(dbName: keyof SaccharoseDb, stateConstructor: {new(request?: Request): T}, requestOrState?: Request|T) {
    this.state = requestOrState instanceof AbstractControlState ? requestOrState : new stateConstructor(requestOrState);
    this.knex = this.state.NoDbConnect ? null : openSqlite()[dbName];
    this.schema = schemaForDbName(dbName);
    this.dbName = dbName;
  }

  abstract copy(): AbstractControl<T>;

  abstract i18n(key: string, vars?: Record<string, string>): string;

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

  async getExcelFileNames(): Promise<string[]> {
    return (await fsp.readdir(this.getDataFilePath(this.excelPath)))
      .filter(file => path.extname(file) === '.json')
      .map(file => file.slice(0, -5));
  }

  async readJsonFile<T>(filePath: string): Promise<any> {
    return JSON.parse(await fsp.readFile(this.getDataFilePath(filePath), { encoding: 'utf8' }));
  }

  async normalize(json: any | any[], schemaTable: string | SchemaTable, doNormText: boolean = false) {
    if (typeof schemaTable === 'string') {
      let fileBaseName = '/' + basename(schemaTable);
      schemaTable = Object.values(this.schema).find(s => s.jsonFile.endsWith(fileBaseName));
    }
    if (schemaTable) {
      json = normalizeRawJson(json, schemaTable);
    }
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
        out.push({
          hash,
          text,
          line: await getLineNumberForLineText(String(hash), this.getDataFilePath(getPlainTextMapRelPath(langCode, 'Hash'))),
        });
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
                                      flags?: string): Promise<number | Error> {
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
      this.searchModeFlags,
    );

    for (let textMapHash of textMapHashes) {
      yield textMapHash;
    }
  }

  async streamTextMapMatches(langCode: LangCode,
                             searchText: string,
                             stream: (textMapHash: TextMapHash, text?: string, kill?: () => void) => void,
                             flags?: string,
                             isRawInput?: boolean): Promise<number | Error> {
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
    };

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

  // endregion

  // region ID Usages
  async getIdUsages(id: number | string): Promise<IdUsages> {
    let out: IdUsages = {};

    let decimalRegex = new RegExp(`(\\.${id}|${id}\\.)`);
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

    const unresolvedRefs: { [fileName: string]: Set<IdUsagesItem> } = defaultMap('Set');

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
                .where({ [column.name]: id }).first().then(this.commonLoadFirst);
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
            if (obj[usageItem.originalField] === id
              || (isString(obj[usageItem.originalField])
                && obj[usageItem.originalField].startsWith('ART/') && obj[usageItem.originalField].endsWith(`/${id}`)
              )) {
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

    for (let items of Object.values(out)) {
      for (let item of items) {
        if (item.refObject) {
          item.refObjectStringified = JSON.stringify(item.refObject, null, 2);
          item.refObjectMarkers = Marker.create(new RegExp('\\b' + escapeRegExp(grepQuery) + '\\b', 'g'), item.refObjectStringified);
        }
      }
    }

    return out;
  }

  // endregion

  // region Texture2D Media
  async listImageCategories(): Promise<ImageCategoryMap> {
    return cached(this.dbName + '_ImageIndexCategoryMap', async () => {
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

  async searchImageIndex(select: {
    query: string,
    cat1?: string,
    cat2?: string,
    cat3?: string,
    cat4?: string,
    cat5?: string,
    cat6?: string,
    cat7?: string,
    cat8?: string,
    catPath?: string,
    catRestrict?: boolean,
    offset?: number,
  }, searchMode: SearchMode): Promise<ImageIndexSearchResult> {
    const query = select.query ? select.query.trim() : null;

    let builder: Knex.QueryBuilder = openPg().select('*').from(this.dbName + '_image_index');

    if (query) {
      switch (searchMode) {
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

    const results = await builder.orderBy('image_name').offset(select.offset || 0).limit(51).then((rows: ImageIndexEntity[]) => {
      rows.forEach(row => {
        delete row['ts'];
      });
      return rows;
    });

    return {
      results: results.slice(0, 50),
      hasMore: results.length === 51,
      offset: select.offset || 0,
      nextOffset: results.length === 51
        ? (select.offset || 0) + 50
        : undefined,
    };
  }

  // endregion

  sanitizeFileName(fileName: string): string {
    return encodeURIComponent(fileName ? fileName.replaceAll(/[\\\/:*?"<>|]/g, '') : '');
  }
}
