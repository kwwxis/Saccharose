import { create, Request, Response, Router } from '../../../util/router';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/', async (req: Request, res: Response) => {
    res.render('pages/genshin/landing');
  });

  router.get('/text-map-expand', async (req: Request, res: Response) => {
    res.redirect(req.url.replace(/text-map-expand/i, 'textmap'));
  });

  router.get('/textmap', async (req: Request, res: Response) => {
    res.render('pages/genshin/basic/textmap', {
      title: 'TextMap Search',
      bodyClass: ['page--textmap']
    });
  });

  router.get('/OL', async (req: Request, res: Response) => {
    res.render('pages/genshin/basic/olgen', {
      title: 'OL',
      bodyClass: ['page--OL']
    });
  });

  router.get('/id-usages', async (req: Request, res: Response) => {
    res.render('pages/genshin/basic/id-usages', {
      title: 'ID usages',
      bodyClass: ['page--id-usages']
    });
  });

  router.get('/asi-test', async (req: Request, res: Response) => {
    res.render('pages/genshin/basic/asi-test', {
      title: 'ASI Test',
    })
  });

  return router;
}