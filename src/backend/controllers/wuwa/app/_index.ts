import { create } from '../../../routing/router.ts';
import WuwaBasicRouter from './WuwaBasicRouter.ts';
import { Router } from 'express';
import WuwaMediaRouter from './WuwaMediaRouter.ts';
import WuwaRoleRouter from './WuwaRoleRouter.ts';
import WuwaChangelogRouter from './WuwaChangelogRouter.ts';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.use('/', await WuwaBasicRouter());
  router.use('/', await WuwaMediaRouter());
  router.use('/', await WuwaRoleRouter());
  router.use('/', await WuwaChangelogRouter());

  return router;
}
