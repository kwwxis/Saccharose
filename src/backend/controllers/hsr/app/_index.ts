import { create } from '../../../routing/router';
import BasicRouter from './StarRailBasicRouter';
import { Router } from 'express';
import StarRailCharacterRouter from './StarRailCharacterRouter';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.use('/', await BasicRouter());
  router.use('/', await StarRailCharacterRouter());

  return router;
}