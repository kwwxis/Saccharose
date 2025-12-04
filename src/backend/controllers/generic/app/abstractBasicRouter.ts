import { AbstractControl } from '../../../domain/abstract/abstractControl.ts';
import { removeSuffix } from '../../../../shared/util/stringUtil.ts';
import { Request, Response } from 'express';
import ExcelViewerTablePage from '../../../components/shared/ExcelViewerTablePage.vue';
import { FileAndSize } from '../../../../shared/types/utility-types.ts';

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
  });
}
