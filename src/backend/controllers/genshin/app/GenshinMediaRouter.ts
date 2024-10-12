import { create } from '../../../routing/router.ts';
import { Request, Response, Router } from 'express';
import WikiRevisionPage from '../../../components/mediawiki/WikiRevisionPage.vue';
import { isInt, toInt } from '../../../../shared/util/numberUtil.ts';
import { mwGenshinClient } from '../../../mediawiki/mwClientInterface.ts';
import GenshinMediaSearchPage from '../../../components/genshin/media/GenshinMediaSearchPage.vue';
import GenshinMediaListPage from '../../../components/genshin/media/GenshinMediaListPage.vue';
import GenshinMediaDetailsPage from '../../../components/genshin/media/GenshinMediaDetailsPage.vue';
import { getGenshinControl } from '../../../domain/genshin/genshinControl.ts';
import GenshinMediaArchiveJobPage from '../../../components/genshin/media/GenshinMediaArchiveJobPage.vue';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/media/search', async (req: Request, res: Response) => {
    res.render(GenshinMediaSearchPage, {
      title: 'Media Search',
      bodyClass: ['page--media', 'page--media-search', 'page--larger'],
    });
  });

  router.get('/media/list', async (req: Request, res: Response) => {
    res.render(GenshinMediaListPage, {
      title: 'Media List',
      bodyClass: ['page--media', 'page--media-list', 'page--larger'],
    });
  });

  router.get('/media/details/:imageName', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const { entity, usageEntities } = await ctrl.selectImageIndexEntityAndUsages(req.params.imageName);
    res.render(GenshinMediaDetailsPage, {
      title: 'Media Details: ' + String(req.params.imageName),
      bodyClass: ['page--media', 'page--media-details', 'page--larger'],
      pathImageName: req.params.imageName,
      entity,
      usageEntities,
    });
  });

  router.get('/media', async (req: Request, res: Response) => {
    res.redirect('/genshin/media/list');
  });

  router.get('/media/archive-job/:jobId', async (req: Request, res: Response) => {
    res.render(GenshinMediaArchiveJobPage, {
      jobId: req.params.jobId,
    });
  });

  router.get('/revs', async (req: Request, res: Response) => {
    res.render(WikiRevisionPage, {
      title: 'Wiki Revisions',
      bodyClass: ['page--revs', 'page--wide', 'page--wideWithLeftGutter', 'page--narrow-sidebar']
    });
  });

  router.get('/revs/:pageId', async (req: Request, res: Response) => {
    const pageId: number = isInt(req.params.pageId) ? toInt(req.params.pageId) : null;
    const page = await mwGenshinClient.getArticleInfo(pageId);

    res.render(WikiRevisionPage, {
      title: 'Wiki Revisions',
      bodyClass: ['page--revs', 'page--wide', 'page--narrow-sidebar'],
      pageid: pageId || null,
      page: page || null,
    });
  });

  router.get('/revs/:pageId/:revId', async (req: Request, res: Response) => {
    const pageId: number = isInt(req.params.pageId) ? toInt(req.params.pageId) : null;
    const revId: number = isInt(req.params.revId) ? toInt(req.params.revId) : null;
    const page = await mwGenshinClient.getArticleInfo(pageId);

    res.render(WikiRevisionPage, {
      title: 'Wiki Revisions',
      bodyClass: ['page--revs', 'page--wide', 'page--narrow-sidebar'],
      pageid: pageId || null,
      revid: revId || null,
      page: page || null,
    });
  });

  return router;
}
