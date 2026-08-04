import { create } from '../rendering/customRouter.ts';
import { apiErrorHandler } from '../middleware/response/globalErrorHandler.ts';
import apiAccessControlHeaders from '../middleware/api/apiAccessControlHeaders.ts';
import apiAuth from '../middleware/api/apiAuth.ts';
import GenshinResources from './genshin/api/_index.ts';
import StarRailResources from './hsr/api/_index.ts';
import ZenlessResources from './zenless/api/_index.ts';
import WuwaResources from './wuwa/api/_index.ts';
import MiscGeneralResources from './generic/api/miscGeneralResources.ts';
import MwResources from './generic/api/mwResources.ts';
import ScriptJobResources from './generic/api/scriptJobResources.ts';
import UserResources from './site/api/userResources.ts';
import express, { Request, Response, Router } from 'express';
import { isSiteModeDisabled } from '../loadenv.ts';

export default async function(): Promise<Router> {
  const router: Router = create({
    layoutType: 'empty',
  });

  // API Middleware
  // ~~~~~~~~~~~~~~
  router.use(express.json());
  router.use(apiAccessControlHeaders);
  router.use(apiAuth);

  // Add API Resources
  // ~~~~~~~~~~~~~~~~~
  if (!isSiteModeDisabled('genshin'))
    GenshinResources(router)
  if (!isSiteModeDisabled('hsr'))
    StarRailResources(router);
  if (!isSiteModeDisabled('zenless'))
    ZenlessResources(router);
  if (!isSiteModeDisabled('wuwa'))
    WuwaResources(router);
  MiscGeneralResources(router);
  MwResources(router);
  ScriptJobResources(router);
  UserResources(router);

  // Client Error Handlers
  // ~~~~~~~~~~~~~~~~~~~~~
  router.route('*splat').all((_req: Request, res: Response) => {
    res.status(404).send();
  });
  router.use(apiErrorHandler);

  return router;
}
