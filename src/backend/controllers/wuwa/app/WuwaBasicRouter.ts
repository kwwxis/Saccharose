import { create } from '../../../routing/router.ts';
import { Request, Response, Router } from 'express';
import WuwaLanding from '../../../components/wuwa/WuwaLanding.vue';
import { sendExcelViewerTableResponse } from '../../generic/app/abstractBasicRouter.ts';
import { getWuwaControl } from '../../../domain/wuwa/wuwaControl.ts';
import ExcelViewerListPage from '../../../components/shared/ExcelViewerListPage.vue';
import ExcelUsagesPage from '../../../components/shared/ExcelUsagesPage.vue';
import TextmapSearchPage from '../../../components/shared/TextmapSearchPage.vue';
import OLGenPage from '../../../components/shared/OLGenPage.vue';
import OLCombinePage from '../../../components/shared/OLCombinePage.vue';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/', async (req: Request, res: Response) => {
    res.renderComponent(WuwaLanding);
  });

  router.get('/textmap', async (req: Request, res: Response) => {
    res.renderComponent(TextmapSearchPage, {
      title: 'TextMap Search',
      bodyClass: ['page--textmap']
    });
  });

  router.get('/OL', async (req: Request, res: Response) => {
    res.renderComponent(OLGenPage, {
      title: 'OL',
      bodyClass: ['page--OL'],
    });
  });

  router.get('/OL/combine', async (req: Request, res: Response) => {
    res.renderComponent(OLCombinePage, {
      title: 'OL Combine',
      bodyClass: ['page--OL-combine']
    });
  });

  router.get('/excel-usages', async (req: Request, res: Response) => {
    res.renderComponent(ExcelUsagesPage, {
      title: 'Excel usages',
      bodyClass: ['page--excel-usages']
    });
  });

  router.get('/excel-viewer', async (req: Request, res: Response) => {
    res.renderComponent(ExcelViewerListPage, {
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
