import bodyParser from 'body-parser';
import { create } from '../routing/router.ts';
import { apiErrorHandler } from '../middleware/response/globalErrorHandler.ts';
import apiAccessControlHeaders from '../middleware/api/apiAccessControlHeaders.ts';
import apiAuth from '../middleware/api/apiAuth.ts';
import GenshinResources from './genshin/api/_index.ts';
import StarRailResources from './hsr/api/_index.ts';
import ZenlessResources from './zenless/api/_index.ts';
import { getGenshinControl } from '../domain/genshin/genshinControl.ts';
import { getStarRailControl } from '../domain/hsr/starRailControl.ts';
import { getZenlessControl } from '../domain/zenless/zenlessControl.ts';
import { Request, Response, Router } from 'express';
import { langDetect } from '../util/shellutil.ts';

export default async function(): Promise<Router> {
  const router: Router = create({
    layouts: ['layouts/empty-layout'],
    locals: async (req: Request) => {
      const genshinControl = getGenshinControl(req);
      const starRailControl = getStarRailControl(req);
      const zenlessControl = getZenlessControl(req);
      return {
        normGenshinText: (s: string) => genshinControl.normText(s, req.context.outputLangCode),
        normStarRailText: (s: string) => starRailControl.normText(s, req.context.outputLangCode),
        normZenlessText: (s: string) => zenlessControl.normText(s, req.context.outputLangCode),
        outputLangCode: req.context.outputLangCode,
        inputLangCode: req.context.inputLangCode
      };
    }
  });

  // API Middleware
  // ~~~~~~~~~~~~~~
  router.use(bodyParser.json());
  router.use(apiAccessControlHeaders);
  router.use(apiAuth);

  // Add API Resources
  // ~~~~~~~~~~~~~~~~~
  GenshinResources(router)
  StarRailResources(router);
  ZenlessResources(router);

  router.endpoint('/lang-detect', {
    get: async (req: Request, res: Response) => {
      return res.json(langDetect(String(req.query.text)));
    }
  });

  // Client Error Handlers
  // ~~~~~~~~~~~~~~~~~~~~~
  router.route('*').all((req: Request, res: Response) => res.status(404).send());
  router.use(apiErrorHandler);

  return router;
}
