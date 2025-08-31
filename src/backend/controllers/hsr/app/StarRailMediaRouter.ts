import { create } from '../../../routing/router.ts';
import { Request, Response, Router } from 'express';
import StarRailMediaSearchPage from '../../../components/hsr/media/StarRailMediaSearchPage.vue';
import StarRailMediaListPage from '../../../components/hsr/media/StarRailMediaListPage.vue';
import StarRailMediaDetailsPage from '../../../components/hsr/media/StarRailMediaDetailsPage.vue';
import { getStarRailControl } from '../../../domain/hsr/starRailControl.ts';
import WikiRevisionPage from '../../../components/mediawiki/WikiRevisionPage.vue';
import { isInt, toInt } from '../../../../shared/util/numberUtil.ts';
import { mwStarRailClient } from '../../../mediawiki/mwClientInterface.ts';
import StarRailMediaArchiveJobPage from '../../../components/hsr/media/StarRailMediaArchiveJobPage.vue';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/media/search', async (req: Request, res: Response) => {
    await res.renderComponent(StarRailMediaSearchPage, {
      title: 'Media Search',
      bodyClass: ['page--media', 'page--media-search', 'page--larger'],
    });
  });

  router.get('/media/list', async (req: Request, res: Response) => {
    await res.renderComponent(StarRailMediaListPage, {
      title: 'Media List',
      bodyClass: ['page--media', 'page--media-list', 'page--larger'],
    });
  });

  router.get('/media/details/:imageName(*)', async (req: Request, res: Response) => {
    const ctrl = getStarRailControl(req);
    const { entity, usageEntities } = await ctrl.selectImageIndexEntityAndUsages(req.params.imageName);
    await res.renderComponent(StarRailMediaDetailsPage, {
      title: 'Media Details: ' + String(req.params.imageName),
      bodyClass: ['page--media', 'page--media-details', 'page--larger'],
      pathImageName: req.params.imageName,
      entity,
      usageEntities,
    });
  });

  router.get('/media', async (req: Request, res: Response) => {
    res.redirect('/hsr/media/list');
  });

  router.get('/media/archive-job/:jobId', async (req: Request, res: Response) => {
    await res.renderComponent(StarRailMediaArchiveJobPage, {
      jobId: req.params.jobId,
    });
  });

  router.get('/revs', async (req: Request, res: Response) => {
    await res.renderComponent(WikiRevisionPage, {
      title: 'Wiki Revisions',
      bodyClass: ['page--revs', 'page--wide', 'page--wideWithLeftGutter', 'page--narrow-sidebar']
    });
  });

  router.get('/revs/:pageId', async (req: Request, res: Response) => {
    const pageId: number = isInt(req.params.pageId) ? toInt(req.params.pageId) : null;
    const page = await mwStarRailClient.getArticleInfo(pageId);

    await res.renderComponent(WikiRevisionPage, {
      title: 'Wiki Revisions',
      bodyClass: ['page--revs', 'page--wide', 'page--narrow-sidebar'],
      pageid: pageId || null,
      page: page || null,
    });
  });

  router.get('/revs/:pageId/:revId', async (req: Request, res: Response) => {
    const pageId: number = isInt(req.params.pageId) ? toInt(req.params.pageId) : null;
    const revId: number = isInt(req.params.revId) ? toInt(req.params.revId) : null;
    const page = await mwStarRailClient.getArticleInfo(pageId);

    await res.renderComponent(WikiRevisionPage, {
      title: 'Wiki Revisions',
      bodyClass: ['page--revs', 'page--wide', 'page--narrow-sidebar'],
      pageid: pageId || null,
      revid: revId || null,
      page: page || null,
    });
  });

  return router;
}
