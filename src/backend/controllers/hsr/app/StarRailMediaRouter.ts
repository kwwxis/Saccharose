import { create } from '../../../routing/router.ts';
import { Request, Response, Router } from 'express';
import StarRailMediaSearchPage from '../../../components/hsr/media/StarRailMediaSearchPage.vue';
import StarRailMediaListPage from '../../../components/hsr/media/StarRailMediaListPage.vue';
import StarRailMediaDetailsPage from '../../../components/hsr/media/StarRailMediaDetailsPage.vue';
import { getStarRailControl } from '../../../domain/hsr/starRailControl.ts';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/media/search', async (req: Request, res: Response) => {
    res.render(StarRailMediaSearchPage, {
      title: 'Media Search',
      bodyClass: ['page--media', 'page--media-search', 'page--larger'],
    });
  });

  router.get('/media/list', async (req: Request, res: Response) => {
    res.render(StarRailMediaListPage, {
      title: 'Media List',
      bodyClass: ['page--media', 'page--media-list', 'page--larger'],
    });
  });

  router.get('/media/details/:imageName', async (req: Request, res: Response) => {
    const ctrl = getStarRailControl(req);
    const { entity, usageEntities } = await ctrl.selectImageIndexEntityAndUsages(req.params.imageName);
    res.render(StarRailMediaDetailsPage, {
      title: 'Media Details: ' + String(req.params.imageName),
      bodyClass: ['page--media', 'page--media-details', 'page--larger'],
      entity,
      usageEntities,
    });
  });

  router.get('/media', async (req: Request, res: Response) => {
    res.redirect('/media/list');
  });

  return router;
}
