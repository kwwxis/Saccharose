import { create } from '../../../routing/router.ts';
import { Request, Response, Router } from 'express';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/', async (req: Request, res: Response) => {
    res.render('pages/zenless/landing');
  });

  router.get('/textmap', async (req: Request, res: Response) => {
    res.render('pages/generic/basic/textmap', {
      title: 'TextMap Search',
      bodyClass: ['page--textmap']
    });
  });

  router.get('/OL', async (req: Request, res: Response) => {
    res.render('pages/generic/basic/olgen', {
      title: 'OL',
      bodyClass: ['page--OL'],
      hideTlOption: true
    });
  });

  router.get('/id-usages', async (req: Request, res: Response) => {
    res.redirect(req.originalUrl.replace('/id-usages', '/excel-usages'));
  });

  // router.get('/excel-usages', async (req: Request, res: Response) => {
  //   res.render('pages/generic/basic/excel-usages', {
  //     title: 'Excel usages',
  //     bodyClass: ['page--excel-usages']
  //   });
  // });

  return router;
}
