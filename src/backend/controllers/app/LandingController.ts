import { create, Router, Request, Response } from '../../util/router';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/', async (req: Request, res: Response) => {
    res.render('pages/landing');
  });

  return router;
}