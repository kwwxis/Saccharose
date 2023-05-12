import { AbstractControl } from '../../../domain/abstractControl';
import { Request, Response } from '../../../util/router';
import { removeSuffix } from '../../../../shared/util/stringUtil';

export async function sendExcelViewerTableResponse(ctrl: AbstractControl, req: Request, res: Response) {
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
    json,
  });
}