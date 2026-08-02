import { AbstractControl } from '../../../domain/abstract/abstractControl.ts';
import { removeSuffix, toString } from '../../../../shared/util/stringUtil.ts';
import { Request, Response } from 'express';
import ExcelViewerTablePage from '../../../components/shared/ExcelViewerTablePage.vue';
import { FileAndSize } from '../../../../shared/types/utility-types.ts';
import { toInt } from '../../../../shared/util/numberUtil.ts';

export async function sendExcelViewerTableResponse(ctrl: AbstractControl, req: Request, res: Response) {
  const excels: FileAndSize[] = await ctrl.getExcelFileNames();

  const targetExcelName = removeSuffix(String(req.params.file), '.json');
  const targetExcelPath = ctrl.getExcelPath() + '/' + targetExcelName + '.json';

  let foundJson: any[] = null;
  let foundTarget = excels.find(e => e.name === targetExcelName);

  if (foundTarget) {
    foundJson = foundTarget.size < 20_000_000 ? await ctrl.readDataFile(targetExcelPath, true) : null;
  }

  await res.renderComponent(ExcelViewerTablePage, {
    title: 'Excel Viewer',
    bodyClass: ['page--excel-viewer', 'page--wide', 'page--narrow-sidebar'],
    fileName: targetExcelName,
    fileSize: foundTarget?.size,
    json: foundJson,
    jumpToRowIndex: toInt(req.query.rowIndex)
  });
}

export async function sendExcelDownloadResponse(ctrl: AbstractControl, req: Request, res: Response) {
  const file: string = toString(req.params.file);
  res.download(ctrl.getDataFilePath(ctrl.getExcelPath(file)), err => {
    if (err) {
      console.error('Error sending file:', err);
      if (!res.headersSent) {
        res.status(500).send('Could not download the file. An internal error occurred.');
      }
    }
  });
}
