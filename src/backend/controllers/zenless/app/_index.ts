import { create } from '../../../routing/router.ts';
import ZenlessBasicRouter from './ZenlessBasicRouter.ts';
import { Router } from 'express';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.use('/', await ZenlessBasicRouter());

  return router;
}