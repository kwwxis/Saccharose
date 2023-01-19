import { create, Request, Response, Router } from '../../util/router';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/', async (req: Request, res: Response) => {
    res.render('pages/landing');
  });

  router.get('/text-map-expand', async (req: Request, res: Response) => {
    res.render('pages/basic/text-map-expand', {
      title: 'Text Map Expansion',
      bodyClass: ['page--text-map-expand']
    });
  })

  router.get('/OL', async (req: Request, res: Response) => {
    res.render('pages/basic/olgen', {
      title: 'OL',
      bodyClass: ['page--OL']
    });
  });

  router.get('/id-usages', async (req: Request, res: Response) => {
    res.render('pages/basic/id-usages', {
      title: 'ID usages',
      bodyClass: ['page--id-usages']
    });
  });

  return router;
}