import { isInt, maybeInt, toInt } from '../../../../shared/util/numberUtil.ts';
import { ExcelUsages } from '../../../../shared/util/searchUtil.ts';
import { AbstractControl } from '../../../domain/abstract/abstractControl.ts';
import { add_ol_markers, ol_gen, OLResult } from '../../../domain/abstract/basic/OLgen.ts';
import { isNotEmpty, isset, toBoolean } from '../../../../shared/util/genericUtil.ts';
import { HttpError } from '../../../../shared/util/httpError.ts';
import { Request, Response } from 'express';
import { escapeRegExp } from '../../../../shared/util/stringUtil.ts';
import { Marker } from '../../../../shared/util/highlightMarker.ts';
import { TextMapSearchResult } from '../../../../shared/types/lang-types.ts';
import { ChangeRecordRef } from '../../../../shared/types/changelog-types.ts';
import { GenshinControl } from '../../../domain/genshin/genshinControl.ts';
import { GameVersion, GameVersionFilter, parseVersionFilters } from '../../../../shared/types/game-versions.ts';

export async function handleTextMapSearchEndpoint(ctrl: AbstractControl, req: Request, res: Response) {
  const startFromLine: number = isset(req.query.startFromLine) && isInt(req.query.startFromLine) ? toInt(req.query.startFromLine) : undefined;
  const resultSetNum: number = isset(req.query.resultSetNum) && isInt(req.query.resultSetNum) ? toInt(req.query.resultSetNum) : 0;
  const isRawInput: boolean = isset(req.query.isRawInput) && toBoolean(req.query.isRawInput);
  const isRawOutput: boolean = isset(req.query.isRawOutput) && toBoolean(req.query.isRawOutput);
  const hashSearch: boolean = isset(req.query.hashSearch) && toBoolean(req.query.hashSearch);
  const versionFilter: GameVersionFilter = GameVersionFilter.from(req.query.versionFilter, ctrl.selectVersions().filter(v => v.showChangelog));
  const SEARCH_TEXTMAP_MAX = 100;
  const query: string = req.query.text as string;

  // "-m" flag -> max count
  const items: TextMapSearchResult[] = await ctrl.getTextMapMatches({
    inputLangCode: ctrl.inputLangCode,
    outputLangCode: ctrl.outputLangCode,
    searchText: query,
    flags: `-m ${SEARCH_TEXTMAP_MAX + 1} ${ctrl.searchModeFlags}`,
    startFromLine,
    isRawInput,
    searchAgainst: hashSearch ? 'Hash' : 'Text',
    doNormText: !isRawOutput,
    versionFilter
  });
  let hasMoreResults: boolean = false;

  if (items.length > SEARCH_TEXTMAP_MAX) {
    hasMoreResults = true;
    items.pop();
  }

  const lastLine: number = items.length ? items[items.length - 1].line : null;

  if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
    return res.render('partials/generic/basic/textmap-search-result', {
      items,
      lastLine,
      hasMoreResults,
      resultSetNum,
      SEARCH_TEXTMAP_MAX,
      langSuggest: items.length ? null : ctrl.langSuggest(query)
    });
  } else {
    return {
      items,
      lastLine,
      hasMoreResults
    };
  }
}

export async function handleOlEndpoint(ctrl: AbstractControl, req: Request, res: Response) {
  let results: OLResult[] = await ol_gen(ctrl, req.query.text as string, {
    hideTl: toBoolean(req.query.hideTl),
    hideRm: toBoolean(req.query.hideRm),
    addDefaultHidden: toBoolean(req.query.addDefaultHidden),
    includeHeader: toBoolean(req.query.includeHeader),
  });

  if (!results) {
    throw HttpError.badRequest('NotFound', req.query.text as string);
  }

  add_ol_markers(results);

  if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
    if (toBoolean(req.query.singleResultSimpleHtml)) {
      return res.render('partials/generic/basic/ol-result-simple', {
        olResult: results?.[0],
        searchText: req.query.text as string
      });
    }
    return res.render('partials/generic/basic/ol-result', {
      olResults: results,
      searchText: req.query.text as string
    });
  } else {
    return results;
  }
}

export async function handleExcelUsagesEndpoint(ctrl: AbstractControl, req: Request, res: Response) {
  const ids: (number|string)[] = String(req.query.q).split(/,/g).map(s => s.trim()).filter(s => /^-?[a-zA-Z0-9_]+$/.test(s)).map(maybeInt);
  const idToUsages: {[id: number|string]: ExcelUsages} = {};
  const changeRecordRefs: ChangeRecordRef[] = [];

  await ids.asyncMap(async id => {
    await ctrl.getExcelUsages(id).then(usages => {
      idToUsages[id] = usages;
    });
  });

  if (ctrl instanceof GenshinControl) {
    for (let id of ids) {
      changeRecordRefs.push(... await ctrl.selectChangeRecordAdded(id));
    }
  }

  if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
    return res.render('partials/generic/basic/excel-usages-result', { idToUsages, changeRecordRefs, embed: toBoolean(req.query.embed) });
  } else {
    return idToUsages;
  }
}
