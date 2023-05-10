import { create, Request, Response, Router } from '../../../util/router';
import { removeSuffix } from '../../../../shared/util/stringUtil';
import { getStarRailControl } from '../../../domain/hsr/starRailControl';

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
    res.render('pages/generic/basic/id-usages', {
      title: 'Identifier usages',
      bodyClass: ['page--id-usages']
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
    const ctrl = getStarRailControl(req);
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