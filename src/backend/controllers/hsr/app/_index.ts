import { create } from '../../../routing/router.ts';
import BasicRouter from './StarRailBasicRouter.ts';
import { Router } from 'express';
import StarRailCharacterRouter from './StarRailCharacterRouter.ts';
import StarRailMediaRouter from './StarRailMediaRouter.ts';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.use('/', await BasicRouter());
  router.use('/', await StarRailCharacterRouter());
  router.use('/', await StarRailMediaRouter());

  return router;
}
