import { create } from '../../../routing/router';
import ZenlessBasicRouter from './ZenlessBasicRouter';
import { Router } from 'express';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.use('/', await ZenlessBasicRouter());

  return router;
}