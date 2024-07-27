import { create } from '../../../routing/router.ts';
import { Request, Response, Router } from 'express';
import WuwaLanding from '../../../components/wuwa/WuwaLanding.vue';
import { sendExcelViewerTableResponse } from '../../abstract/app/abstractBasicRouter.ts';
import { getWuwaControl } from '../../../domain/wuwa/wuwaControl.ts';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/', async (req: Request, res: Response) => {
    res.render(WuwaLanding);
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
      bodyClass: ['page--OL'],
      hideAllOptions: true
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
      excels: await getWuwaControl(req).getExcelFileNames(),
    })
  });

  router.get('/excel-viewer/:file', async (req: Request, res: Response) => {
    await sendExcelViewerTableResponse(getWuwaControl(req), req, res);
  });

  return router;
}
