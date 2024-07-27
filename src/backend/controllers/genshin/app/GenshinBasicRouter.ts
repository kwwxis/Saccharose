import { create } from '../../../routing/router.ts';
import { getGenshinControl } from '../../../domain/genshin/genshinControl.ts';
import { sendExcelViewerTableResponse } from '../../abstract/app/abstractBasicRouter.ts';
import { Request, Response, Router } from 'express';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/', async (req: Request, res: Response) => {
    res.render('pages/genshin/landing');
  });

  router.get('/textmap', async (req: Request, res: Response) => {
    res.render('pages/generic/basic/textmap', {
      title: 'TextMap Search',
      bodyClass: ['page--textmap'],
      enableVersionFilter: true,
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
