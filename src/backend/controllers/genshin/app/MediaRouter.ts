import { create } from '../../../routing/router';
import { Request, Response, Router } from 'express';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/media', async (req: Request, res: Response) => {
    res.render('pages/genshin/media/media-search', {
      title: 'Media',
      bodyClass: ['page--media'],
    });
  });

  return router;
}