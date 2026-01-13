import { create } from '../../../routing/router.ts';
import { Request, Response, Router } from 'express';
import WuwaMediaSearchPage from '../../../components/wuwa/media/WuwaMediaSearchPage.vue';
import WuwaMediaListPage from '../../../components/wuwa/media/WuwaMediaListPage.vue';
import WuwaMediaDetailsPage from '../../../components/wuwa/media/WuwaMediaDetailsPage.vue';
import { getWuwaControl } from '../../../domain/wuwa/wuwaControl.ts';
import WikiRevisionPage from '../../../components/mediawiki/WikiRevisionPage.vue';
import { isInt, toInt } from '../../../../shared/util/numberUtil.ts';
import { mwWuwaClient } from '../../../mediawiki/mwClientInterface.ts';
import WuwaMediaArchiveJobPage from '../../../components/wuwa/media/WuwaMediaArchiveJobPage.vue';
import { expressWildcardPath } from '../../../middleware/request/pathHelpers.ts';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/media/search', async (req: Request, res: Response) => {
    await res.renderComponent(WuwaMediaSearchPage, {
      title: 'Media Search',
      bodyClass: ['page--media', 'page--media-search', 'page--larger'],
    });
  });

  router.get('/media/list', async (req: Request, res: Response) => {
    await res.renderComponent(WuwaMediaListPage, {
      title: 'Media List',
      bodyClass: ['page--media', 'page--media-list', 'page--larger'],
    });
  });

  router.get('/media/details/*imageName', async (req: Request, res: Response) => {
    const ctrl = getWuwaControl(req);
    const imageName = expressWildcardPath(req.params.imageName);
    const { entity, usageEntities } = await ctrl.selectImageIndexEntityAndUsages(imageName);
    await res.renderComponent(WuwaMediaDetailsPage, {
      title: 'Media Details: ' + imageName,
      bodyClass: ['page--media', 'page--media-details', 'page--larger'],
      pathImageName: imageName,
      entity,
      usageEntities,
    });
  });

  router.get('/media', async (req: Request, res: Response) => {
    res.redirect('/wuwa/media/list');
  });

  router.get('/media/archive-job/:jobId', async (req: Request, res: Response) => {
    await res.renderComponent(WuwaMediaArchiveJobPage, {
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
    const page = await mwWuwaClient.getArticleInfo(pageId);

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
    const page = await mwWuwaClient.getArticleInfo(pageId);

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
