import { create, Request, Response, Router } from '../../util/router';
import { getControl, IdUsages, normText } from '../../scripts/script_util';
import { add_ol_markers, ol_gen, OLResult } from '../../scripts/basic/OLgen';
import { toBoolean } from '../../../shared/util/genericUtil';
import { HttpError } from '../../../shared/util/httpError';
import { getTextMapItem } from '../../scripts/textmap';
import { isInt, toInt } from '../../../shared/util/numberUtil';

const router: Router = create();

router.restful('/ping', {
  get: async (_req: Request, _res: Response) => {
    return 'pong!';
  }
});

router.restful('/search-textmap', {
  get: async (req: Request, res: Response) => {
    const ctrl = getControl(req);

    const result = await ctrl.getTextMapMatches(ctrl.inputLangCode, <string> req.query.text, '-m 100 ' + ctrl.searchModeFlags); // "-m" flag -> max count

    if (ctrl.inputLangCode !== ctrl.outputLangCode) {
      for (let textMapId of Object.keys(result)) {
        result[textMapId] = getTextMapItem(ctrl.outputLangCode, textMapId);
      }
    }

    for (let textMapId of Object.keys(result)) {
      result[textMapId] = normText(result[textMapId], ctrl.outputLangCode);
    }

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/basic/textmap-search-result', { result });
    } else {
      return result;
    }
  }
});

router.restful('/OL/generate', {
  get: async (req: Request, res: Response) => {
    const ctrl = getControl(req);

    let results: OLResult[] = await ol_gen(ctrl, <string> req.query.text, {
      hideTl: toBoolean(req.query.hideTl),
      hideRm: toBoolean(req.query.hideRm),
      addDefaultHidden: toBoolean(req.query.addDefaultHidden),
    });

    if (!results) {
      throw HttpError.badRequest('NotFound', req.query.text as string);
    }

    add_ol_markers(results);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/basic/ol-result', { olResults: results, searchText: <string> req.query.text });
    } else {
      return results;
    }
  }
});

router.restful('/id-usages', {
  get: async (req: Request, res: Response) => {
    const ctrl = getControl(req);
    const ids: number[] = String(req.query.q).split(/[ ,]/g).map(s => s.trim()).filter(s => !!s && isInt(s)).map(toInt);
    const idToUsages: {[id: number]: IdUsages} = {};

    await Promise.all(ids.map(id => {
      return ctrl.getIdUsages(id).then(usages => {
        idToUsages[id] = usages;
      });
    }));

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/basic/id-usages-result', { idToUsages });
    } else {
      return idToUsages;
    }
  }
});

export default router;
