import { create, Router } from '../../../util/router';
import BasicRouter from './BasicRouter';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.use('/', await BasicRouter());

  return router;
}