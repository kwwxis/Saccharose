import { create } from '../../../routing/router.ts';
import WuwaBasicRouter from './WuwaBasicRouter.ts';
import { Router } from 'express';
import WuwaMediaRouter from './WuwaMediaRouter.ts';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.use('/', await WuwaBasicRouter());
  router.use('/', await WuwaMediaRouter());

  return router;
}
