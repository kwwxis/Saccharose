import { create } from '../../../routing/router.ts';
import { Request, Response, Router } from 'express';
import ZenlessDialogueHelperPage from '../../../components/zenless/ZenlessDialogueHelperPage.vue';
import ZenlessLandingPage from '../../../components/zenless/ZenlessLandingPage.vue';
import TextmapSearchPage from '../../../components/shared/TextmapSearchPage.vue';
import OLGenPage from '../../../components/shared/OLGenPage.vue';
import ExcelUsagesPage from '../../../components/shared/ExcelUsagesPage.vue';
import ExcelViewerListPage from '../../../components/shared/ExcelViewerListPage.vue';
import { sendExcelViewerTableResponse } from '../../generic/app/abstractBasicRouter.ts';
import { getZenlessControl } from '../../../domain/zenless/zenlessControl.ts';
import OLCombinePage from '../../../components/shared/OLCombinePage.vue';
import ZenlessDialogueGenerationPage from '../../../components/zenless/ZenlessDialogueGenerationPage.vue';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/', async (req: Request, res: Response) => {
    await res.renderComponent(ZenlessLandingPage);
  });

  router.get('/textmap', async (req: Request, res: Response) => {
    await res.renderComponent(TextmapSearchPage, {
      title: 'TextMap Search',
      bodyClass: ['page--textmap'],
    });
  });

  router.get('/OL', async (req: Request, res: Response) => {
    await res.renderComponent(OLGenPage, {
      title: 'OL',
      bodyClass: ['page--OL']
    });
  });

  router.get('/OL/combine', async (req: Request, res: Response) => {
    await res.renderComponent(OLCombinePage, {
      title: 'OL Combine',
      bodyClass: ['page--OL-combine']
    });
  });

  router.get('/excel-usages', async (req: Request, res: Response) => {
    await res.renderComponent(ExcelUsagesPage, {
      title: 'Excel usages',
      bodyClass: ['page--excel-usages']
    });
  });

  router.get('/excel-viewer', async (req: Request, res: Response) => {
    await res.renderComponent(ExcelViewerListPage, {
      title: 'Excel Viewer',
      bodyClass: ['page--excel-viewer'],
      excels: await getZenlessControl(req).getExcelFileNames(),
    })
  });

  router.get('/excel-viewer/:file', async (req: Request, res: Response) => {
    await sendExcelViewerTableResponse(getZenlessControl(req), req, res);
  });

  router.get('/dialogue-helper', async (req: Request, res: Response) => {
    await res.renderComponent(ZenlessDialogueHelperPage, {
      title: 'Dialogue Helper',
      bodyClass: ['page--dialogue-helper']
    });
  });

  router.get('/dialogue-generation', async (req: Request, res: Response) => {
    await res.renderComponent(ZenlessDialogueGenerationPage, {
      title: 'Dialogue Generation',
      bodyClass: ['page--dialogue-generation']
    });
  });

  return router;
}
