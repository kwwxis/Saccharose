import { create } from '../../../routing/router';
import BasicRouter from './BasicRouter';
import { Router } from 'express';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.use('/', await BasicRouter());

  return router;
}