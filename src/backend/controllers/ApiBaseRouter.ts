import bodyParser from 'body-parser';
import { create, Request, Response, Router } from '../util/router';
import { apiErrorHandler } from '../middleware/response/globalErrorHandler';
import apiAccessControlHeaders from '../middleware/api/apiAccessControlHeaders';
import apiAuth from '../middleware/api/apiAuth';
import GenshinResources from './genshin/api/_index';
import StarRailResources from './hsr/api/_index';
import ZenlessResources from './zenless/api/_index';
import { getGenshinControl } from '../domain/genshin/genshinControl';
import { getStarRailControl } from '../domain/hsr/starRailControl';
import { getZenlessControl } from '../domain/zenless/zenlessControl';

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

  // Client Error Handlers
  // ~~~~~~~~~~~~~~~~~~~~~
  router.route('*').all((req: Request, res: Response) => res.status(404).send());
  router.use(apiErrorHandler);

  return router;
}