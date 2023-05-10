import { create, Request, Response, Router } from '../../../util/router';
import { getGenshinControl } from '../../../domain/genshin/genshinControl';
import { exec } from 'child_process';
import { removeSuffix } from '../../../../shared/util/stringUtil';

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
    const ctrl = getGenshinControl(req);
    const excels = await ctrl.getExcelFileNames();
    const fileName = removeSuffix(String(req.params.file), '.json');
    const filePath = ctrl.getExcelPath() + '/' + fileName + '.json';

    let fileSize: number = null;
    let json: any[] = null;

    if (excels.includes(fileName)) {
      fileSize = await ctrl.getDataFileSize(filePath);
      json = fileSize < 9_000_000 ? await ctrl.readDataFile(filePath, true) : null;
    }

    res.render('pages/generic/basic/excel-viewer-table', {
      title: 'Excel Viewer',
      bodyClass: ['page--excel-viewer', 'page--wide'],
      fileName,
      fileSize,
      excels,
      json
    });
  });

  return router;
}