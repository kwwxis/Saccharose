import { Request, Response } from '../../../util/router';
import { isInt, maybeInt, toInt } from '../../../../shared/util/numberUtil';
import { IdUsages } from '../../../util/searchUtil';
import { AbstractControl } from '../../../domain/abstractControl';
import { add_ol_markers, ol_gen, OLResult } from '../../../domain/generic/basic/OLgen';
import { isset, toBoolean } from '../../../../shared/util/genericUtil';
import { HttpError } from '../../../../shared/util/httpError';

export async function handleTextMapSearchEndpoint(ctrl: AbstractControl, req: Request, res: Response) {
  const startFromLine: number = isset(req.query.startFromLine) && isInt(req.query.startFromLine) ? toInt(req.query.startFromLine) : undefined;
  const resultSetNum: number = isset(req.query.resultSetNum) && isInt(req.query.resultSetNum) ? toInt(req.query.resultSetNum) : 0;
  const isRawInput: boolean = isset(req.query.isRawInput) && toBoolean(req.query.isRawInput);
  const isRawOutput: boolean = isset(req.query.isRawOutput) && toBoolean(req.query.isRawOutput);
  const SEARCH_TEXTMAP_MAX = 100;

  // "-m" flag -> max count
  const items = await ctrl.getTextMapMatches(
    ctrl.inputLangCode,
    <string> req.query.text,
    `-m ${SEARCH_TEXTMAP_MAX+1} ${ctrl.searchModeFlags}`,
    startFromLine,
    isRawInput
  );
  let hasMoreResults: boolean = false;

  if (items.length > SEARCH_TEXTMAP_MAX) {
    hasMoreResults = true;
    items.pop();
  }

  let lastLine: number = items.length ? items[items.length - 1].line : null;

  if (ctrl.inputLangCode !== ctrl.outputLangCode) {
    for (let item of items) {
      item.text = await ctrl.getTextMapItem(ctrl.outputLangCode, item.hash);
    }
  }

  if (!isRawOutput) {
    for (let item of items) {
      item.text = ctrl.normText(item.text, ctrl.outputLangCode);
    }
  }

  if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
    return res.render('partials/generic/basic/textmap-search-result', { items, lastLine, hasMoreResults, resultSetNum, SEARCH_TEXTMAP_MAX });
  } else {
    return items;
  }
}

export async function handleOlEndpoint(ctrl: AbstractControl, req: Request, res: Response) {
  let results: OLResult[] = await ol_gen(ctrl, <string> req.query.text, {
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
    return res.render('partials/generic/basic/ol-result', { olResults: results, searchText: <string> req.query.text });
  } else {
    return results;
  }
}

export async function handleIdUsagesEndpoint(ctrl: AbstractControl, req: Request, res: Response) {
  const ids: (number|string)[] = String(req.query.q).split(/,/g).map(s => s.trim()).filter(s => /^-?[a-zA-Z0-9_]+$/.test(s)).map(maybeInt);
  const idToUsages: {[id: number|string]: IdUsages} = {};

  await Promise.all(ids.map(id => {
    return ctrl.getIdUsages(id).then(usages => {
      idToUsages[id] = usages;
    });
  }));

  if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
    return res.render('partials/generic/basic/id-usages-result', { idToUsages });
  } else {
    return idToUsages;
  }
}