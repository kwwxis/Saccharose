import { create, Request, Response, Router } from '../../../util/router';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/', async (req: Request, res: Response) => {
    res.render('pages/hsr/landing');
  });

  return router;
}