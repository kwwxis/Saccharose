import { create } from '../../../routing/router.ts';
import { getStarRailControl } from '../../../domain/hsr/starRailControl.ts';
import { sendExcelViewerTableResponse } from '../../generic/app/abstractBasicRouter.ts';
import { SbOut } from '../../../../shared/util/stringUtil.ts';
import { Request, Response, Router } from 'express';
import { doHsrDialogueWalk } from '../../../domain/hsr/dialogue/hsr_dialogue_walker.ts';
import StarRailLandingPage from '../../../components/hsr/StarRailLandingPage.vue';
import StarRailLoadingTips from '../../../components/hsr/StarRailLoadingTips.vue';
import ExcelUsagesPage from '../../../components/shared/ExcelUsagesPage.vue';
import ExcelViewerListPage from '../../../components/shared/ExcelViewerListPage.vue';
import TextmapSearchPage from '../../../components/shared/TextmapSearchPage.vue';
import OLGenPage from '../../../components/shared/OLGenPage.vue';
import OLCombinePage from '../../../components/shared/OLCombinePage.vue';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/', async (req: Request, res: Response) => {
    await res.renderComponent(StarRailLandingPage);
  });

  router.get('/textmap', async (req: Request, res: Response) => {
    await res.renderComponent(TextmapSearchPage, {
      title: 'TextMap Search',
      bodyClass: ['page--textmap'],
      versionFilterMoreInfo: 'Does not support verson 3.1 in particular.'
    });
  });

  router.get('/OL', async (req: Request, res: Response) => {
    await res.renderComponent(OLGenPage, {
      title: 'OL',
      bodyClass: ['page--OL'],
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
      excels: await getStarRailControl(req).getExcelFileNames(),
    })
  });

  router.get('/excel-viewer/:file', async (req: Request, res: Response) => {
    await sendExcelViewerTableResponse(getStarRailControl(req), req, res);
  });

  // Loading Tips
  // ~~~~~~~~~~~~

  router.get('/loading-tips', async (req: Request, res: Response) => {
    const ctrl = getStarRailControl(req);
    let sb: SbOut = new SbOut();

    let loadingTips: {[category: string]: string[]} = await ctrl.getLoadingTips();
    for (let [category, tips] of Object.entries(loadingTips)) {
      for (let tip of tips) {
        sb.line(`* '''{{LS|${category}}}:''' ${tip}`);
      }
      sb.line();
    }

    await res.renderComponent(StarRailLoadingTips, {
      title: 'Loading Tips',
      wikitext: sb.toString(),
      bodyClass: ['page--loading-tips']
    });
  });


  router.get('/talk', async (req: Request, res: Response) => {
    await doHsrDialogueWalk(getStarRailControl(req));
    res.send('Done');
  });

  return router;
}
