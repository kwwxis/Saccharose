import { create, Router } from '../../../util/router';

export default async function(): Promise<Router> {
  const router: Router = create();

  return router;
}