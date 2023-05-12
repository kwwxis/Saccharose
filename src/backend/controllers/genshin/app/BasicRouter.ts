import { create, Request, Response, Router } from '../../../util/router';
import { getGenshinControl } from '../../../domain/genshin/genshinControl';

import { sendExcelViewerTableResponse } from '../../generic/app/abstractBasicRouter';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/', async (req: Request, res: Response) => {
    res.render('pages/genshin/landing');
  });

  router.get('/text-map-expand', async (req: Request, res: Response) => {
    res.redirect(req.url.replace(/text-map-expand/i, 'textmap'));
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
    res.render('pages/generic/basic/id-usages', {
      title: 'Identifier usages',
      bodyClass: ['page--id-usages']
    });
  });

  router.get('/asi-test', async (req: Request, res: Response) => {
    res.render('pages/generic/basic/asi-test', {
      title: 'ASI Test',
    })
  });

  router.get('/excel-viewer', async (req: Request, res: Response) => {
    res.render('pages/generic/basic/excel-viewer-list', {
      title: 'Excel Viewer',
      bodyClass: ['page--excel-viewer'],
      excels: await getGenshinControl(req).getExcelFileNames(),
    })
  });

  router.get('/excel-viewer/:file', async (req: Request, res: Response) => {
    await sendExcelViewerTableResponse(getGenshinControl(req), req, res);
  });

  return router;
}