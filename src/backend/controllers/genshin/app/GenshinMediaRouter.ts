import { create } from '../../../routing/router.ts';
import { Request, Response, Router } from 'express';
import WikiRevisionPage from '../../../components/mediawiki/WikiRevisionPage.vue';
import { isInt, toInt } from '../../../../shared/util/numberUtil.ts';
import { mwGenshinClient } from '../../../mediawiki/mwClientInterface.ts';
import MediaReverseSearchPage from '../../../components/genshin/media/MediaReverseSearchPage.vue';
import MediaSearchPage from '../../../components/genshin/media/MediaSearchPage.vue';
import MediaListPage from '../../../components/genshin/media/MediaListPage.vue';
import MediaDetailsPage from '../../../components/genshin/media/MediaDetailsPage.vue';
import { getGenshinControl } from '../../../domain/genshin/genshinControl.ts';

export default async function(): Promise<Router> {
  const router: Router = create();


  router.get('/media/reverse-search', async (req: Request, res: Response) => {
    res.render(MediaReverseSearchPage, {
      title: 'Media Reverse Search',
      bodyClass: ['page--media', 'page--media-reverse-search', 'page--larger'],
    });
  });

  router.get('/media/search', async (req: Request, res: Response) => {
    res.render(MediaSearchPage, {
      title: 'Media Search',
      bodyClass: ['page--media', 'page--media-search', 'page--larger'],
    });
  });

  router.get('/media/list', async (req: Request, res: Response) => {
    res.render(MediaListPage, {
      title: 'Media List',
      bodyClass: ['page--media', 'page--media-list', 'page--larger'],
    });
  });

  router.get('/media/details/:imageName', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const entity = await ctrl.selectImageIndexEntity(req.params.imageName);
    const usageEntities: {[fileName: string]: any[]} = {};

    if (entity.excel_meta && Object.keys(entity.excel_meta).length) {
      for (let [excelFileName, metaEntry] of Object.entries(entity.excel_meta)) {
        let myData: any[] = [];
        const excelData: any[] = await ctrl.readJsonFile(ctrl.getExcelPath(`./${excelFileName}`));
        for (let row of metaEntry.rows) {
          myData.push(excelData[row]);
        }
        myData = await ctrl.normalize(myData, excelFileName, true);
        usageEntities[excelFileName] = myData;
      }
    }

    res.render(MediaDetailsPage, {
      title: 'Media Details: ' + String(req.params.imageName),
      bodyClass: ['page--media', 'page--media-details', 'page--larger'],
      entity,
      usageEntities,
    });
  });

  router.get('/media', async (req: Request, res: Response) => {
    res.redirect('/media/list');
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
