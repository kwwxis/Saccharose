import { create } from '../../../routing/router.ts';
import ZenlessBasicRouter from './ZenlessBasicRouter.ts';
import { Router } from 'express';
import ZenlessMediaRouter from './ZenlessMediaRouter.ts';
import ZenlessChangelogRouter from './ZenlessChangelogRouter.ts';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.use('/', await ZenlessBasicRouter());
  router.use('/', await ZenlessMediaRouter());
  router.use('/', await ZenlessChangelogRouter());

  return router;
}
