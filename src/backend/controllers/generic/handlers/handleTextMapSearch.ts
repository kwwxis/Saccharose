import { isInt, toInt } from '../../../../shared/util/numberUtil.ts';
import { AbstractControl } from '../../../domain/abstract/abstractControl.ts';
import { isset, toBoolean } from '../../../../shared/util/genericUtil.ts';
import { Request, Response } from 'express';
import { TextMapSearchResult } from '../../../../shared/types/lang-types.ts';
import { getGenshinControl } from '../../../domain/genshin/genshinControl.ts';
import { GameVersionFilter } from '../../../../shared/types/game-versions.ts';
import { wssHandle } from '../../../websocket/ws-server.ts';
import TextmapSearchResult from '../../../components/shared/api_results/TextmapSearchResult.vue';

wssHandle('WsTextMapSearch', async event => {
  const ctrl = getGenshinControl(event.session);
  const max = ctrl.state.MAX_TEXTMAP_SEARCH_RESULTS;

  const versionFilter: GameVersionFilter = GameVersionFilter.from(event.data.versionFilter, ctrl.gameVersions.filter(v => v.showTextmapChangelog));

  const query = event.data.query;
  const resultSetIdx = isInt(event.data.resultSetIdx) ? event.data.resultSetIdx : 0;

  const items: TextMapSearchResult[] = await ctrl.getTextMapMatches({
    inputLangCode: ctrl.inputLangCode,
    outputLangCode: ctrl.outputLangCode,
    searchText: event.data.query,
    flags: `-m ${max + 1} ${ctrl.searchModeFlags}`,
    startFromLine: event.data.startFromLine,
    isRawInput: event.data.isRawInput,
    searchAgainst: event.data.hashSearch ? 'Hash' : 'Text',
    doNormText: !event.data.isRawOutput,
    versionFilter,
    resultNumberingStart: resultSetIdx * max,
  });

  const response = await ctrl.createTextMapSearchResponse(query, resultSetIdx, items);

  if (event.data.resultType === 'html') {

  } else {
    return response;
  }
});

export async function handleTextMapSearchEndpoint(ctrl: AbstractControl, req: Request, res: Response) {
  const startFromLine: number = isset(req.query.startFromLine) && isInt(req.query.startFromLine) ? toInt(req.query.startFromLine) : undefined;
  const resultSetIdx: number = isset(req.query.resultSetIdx) && isInt(req.query.resultSetIdx) ? toInt(req.query.resultSetIdx) : 0;
  const isRawInput: boolean = isset(req.query.isRawInput) && toBoolean(req.query.isRawInput);
  const isRawOutput: boolean = isset(req.query.isRawOutput) && toBoolean(req.query.isRawOutput);
  const hashSearch: boolean = isset(req.query.hashSearch) && toBoolean(req.query.hashSearch);
  const versionFilter: GameVersionFilter = GameVersionFilter.from(req.query.versionFilter, ctrl.gameVersions.filter(v => v.showTextmapChangelog));
  const query: string = req.query.text as string;
  const max = ctrl.state.MAX_TEXTMAP_SEARCH_RESULTS;

  // "-m" flag -> max count
  const items: TextMapSearchResult[] = await ctrl.getTextMapMatches({
    inputLangCode: ctrl.inputLangCode,
    outputLangCode: ctrl.outputLangCode,
    searchText: query,
    flags: `-m ${max + 1} ${ctrl.searchModeFlags}`,
    startFromLine,
    isRawInput,
    searchAgainst: hashSearch ? 'Hash' : 'Text',
    doNormText: !isRawOutput,
    versionFilter,
    resultNumberingStart: resultSetIdx * max,
  });

  const response = await ctrl.createTextMapSearchResponse(query, resultSetIdx, items);

  if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
    await res.renderComponent(TextmapSearchResult, { response });
  } else {
    return response;
  }
}

