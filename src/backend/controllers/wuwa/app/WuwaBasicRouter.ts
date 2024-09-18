import { create } from '../../../routing/router.ts';
import { Request, Response, Router } from 'express';
import WuwaLanding from '../../../components/wuwa/WuwaLanding.vue';
import { sendExcelViewerTableResponse } from '../../abstract/app/abstractBasicRouter.ts';
import { getWuwaControl } from '../../../domain/wuwa/wuwaControl.ts';
import ExcelViewerListPage from '../../../components/shared/ExcelViewerListPage.vue';
import ExcelUsagesPage from '../../../components/shared/ExcelUsagesPage.vue';
import TextmapSearchPage from '../../../components/shared/TextmapSearchPage.vue';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/', async (req: Request, res: Response) => {
    res.render(WuwaLanding);
  });

  router.get('/textmap', async (req: Request, res: Response) => {
    res.render(TextmapSearchPage, {
      title: 'TextMap Search',
      bodyClass: ['page--textmap']
    });
  });

  router.get('/OL', async (req: Request, res: Response) => {
    res.render(OLGenPage, {
      title: 'OL',
      bodyClass: ['page--OL'],
      hideAllOptions: true
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
      excels: await getWuwaControl(req).getExcelFileNames(),
    })
  });

  router.get('/excel-viewer/:file', async (req: Request, res: Response) => {
    await sendExcelViewerTableResponse(getWuwaControl(req), req, res);
  });

  return router;
}
