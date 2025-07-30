import { AbstractControl } from '../../../domain/abstract/abstractControl.ts';
import { Request, Response } from 'express';
import { add_ol_markers, ol_gen } from '../../../domain/abstract/basic/OLgen.ts';
import { toBoolean } from '../../../../shared/util/genericUtil.ts';
import { HttpError } from '../../../../shared/util/httpError.ts';
import OLGenSimpleResult from '../../../components/shared/api_results/OLGenSimpleResult.vue';
import OLGenResult from '../../../components/shared/api_results/OLGenResult.vue';
import { OLResult } from '../../../../shared/types/ol-types.ts';

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
      return res.render(OLGenSimpleResult, {
        olResult: results?.[0],
        searchText: req.query.text as string,
      });
    }
    return res.render(OLGenResult, {
      olResults: results,
      searchText: req.query.text as string,
    });
  } else {
    return results;
  }
}
