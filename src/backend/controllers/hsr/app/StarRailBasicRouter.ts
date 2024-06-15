import { create } from '../../../routing/router.ts';
import { getStarRailControl } from '../../../domain/hsr/starRailControl.ts';
import { sendExcelViewerTableResponse } from '../../generic/app/abstractBasicRouter.ts';
import { SbOut } from '../../../../shared/util/stringUtil.ts';
import { Request, Response, Router } from 'express';
import { doHsrDialogueWalk } from '../../../domain/hsr/dialogue/hsr_dialogue_walker.ts';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/', async (req: Request, res: Response) => {
    res.render('pages/hsr/landing');
  });

  router.get('/textmap', async (req: Request, res: Response) => {
    res.render('pages/generic/basic/textmap', {
      title: 'TextMap Search',
      bodyClass: ['page--textmap']
    });
  });

  router.get('/OL', async (req: Request, res: Response) => {
    res.render('pages/generic/basic/olgen', {
      title: 'OL',
      bodyClass: ['page--OL']
    });
  });

  router.get('/id-usages', async (req: Request, res: Response) => {
    res.redirect(req.originalUrl.replace('/id-usages', '/excel-usages'));
  });

  router.get('/excel-usages', async (req: Request, res: Response) => {
    res.render('pages/generic/basic/excel-usages', {
      title: 'Excel usages',
      bodyClass: ['page--excel-usages']
    });
  });

  router.get('/excel-viewer', async (req: Request, res: Response) => {
    res.render('pages/generic/basic/excel-viewer-list', {
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
      sb.line(`===${category}===`);
      for (let tip of tips) {
        sb.line(` * ${tip}`);
      }
      sb.line();
    }

    res.render('pages/hsr/archive/loading-tips', {
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
