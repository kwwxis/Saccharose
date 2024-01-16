import { create } from '../../../routing/router.ts';
import { Request, Response, Router } from 'express';
import WikiRevisionPage from '../../../components/mediawiki/WikiRevisionPage.vue';
import { isInt, toInt } from '../../../../shared/util/numberUtil.ts';
import { mwGenshinClient } from '../../../mediawiki/mwClientInterface.ts';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/media', async (req: Request, res: Response) => {
    res.render('pages/genshin/media/media-search', {
      title: 'Media',
      bodyClass: ['page--media'],
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
