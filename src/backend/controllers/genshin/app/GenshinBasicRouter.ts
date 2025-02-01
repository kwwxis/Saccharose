import { create } from '../../../routing/router.ts';
import { getGenshinControl } from '../../../domain/genshin/genshinControl.ts';
import { sendExcelViewerTableResponse } from '../../abstract/app/abstractBasicRouter.ts';
import { Request, Response, Router } from 'express';
import GenshinLandingPage from '../../../components/genshin/GenshinLandingPage.vue';
import ExcelUsagesPage from '../../../components/shared/ExcelUsagesPage.vue';
import ExcelViewerListPage from '../../../components/shared/ExcelViewerListPage.vue';
import TextmapSearchPage from '../../../components/shared/TextmapSearchPage.vue';
import OLGenPage from '../../../components/shared/OLGenPage.vue';
import OLCombinePage from '../../../components/shared/OLCombinePage.vue';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/', async (req: Request, res: Response) => {
    res.render(GenshinLandingPage);
  });

  router.get('/textmap', async (req: Request, res: Response) => {
    res.render(TextmapSearchPage, {
      title: 'TextMap Search',
      bodyClass: ['page--textmap'],
      enableVersionFilter: true,
    });
  });

  router.get('/OL', async (req: Request, res: Response) => {
    res.render(OLGenPage, {
      title: 'OL',
      bodyClass: ['page--OL']
    });
  });

  router.get('/OL/combine', async (req: Request, res: Response) => {
    res.render(OLCombinePage, {
      title: 'OL Combine',
      bodyClass: ['page--OL-combine']
    });
  });

  router.get('/excel-usages', async (req: Request, res: Response) => {
    res.render(ExcelUsagesPage, {
      title: 'Excel usages',
      bodyClass: ['page--excel-usages']
    });
  });

  router.get('/excel-viewer', async (req: Request, res: Response) => {
    res.render(ExcelViewerListPage, {
      title: 'Excel Viewer',
      bodyClass: ['page--excel-viewer'],
      excels: await getGenshinControl(req).getExcelFileNames(),
    })
  });

  router.get('/excel-viewer/:file', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    ctrl.state.AutoloadAvatar = false;
    await sendExcelViewerTableResponse(ctrl, req, res);
  });

  return router;
}
