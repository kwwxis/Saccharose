import bodyParser from 'body-parser';
import { create, Request, Response, Router } from '../util/router';
import { apiErrorHandler } from '../middleware/response/globalErrorHandler';
import apiAccessControlHeaders from '../middleware/api/apiAccessControlHeaders';
import apiAuth from '../middleware/api/apiAuth';
import GenshinResources from './genshin/api/_index';

export default async function(): Promise<Router> {
  const router: Router = create({ layouts: ['layouts/empty-layout'] });

  // API Middleware
  // ~~~~~~~~~~~~~~
  router.use(bodyParser.json());
  router.use(apiAccessControlHeaders);
  router.use(apiAuth);

  // Add API Resources
  // ~~~~~~~~~~~~~~~~~
  router.use('/genshin/', GenshinResources);

  // Client Error Handlers
  // ~~~~~~~~~~~~~~~~~~~~~
  router.route('*').all((req: Request, res: Response) => res.status(404).send());
  router.use(apiErrorHandler);

  return router;
}