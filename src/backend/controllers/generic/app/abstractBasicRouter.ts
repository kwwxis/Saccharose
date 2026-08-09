import { AbstractControl } from '../../../domain/abstract/abstractControl.ts';
import { removeSuffix, toString } from '../../../../shared/util/stringUtil.ts';
import { NextFunction, Request, Response } from 'express';
import ExcelViewerTablePage from '../../../components/shared/ExcelViewerTablePage.vue';
import { FileAndSize } from '../../../../shared/types/utility-types.ts';
import { toInt } from '../../../../shared/util/numberUtil.ts';
import { isLangCode } from '../../../../shared/types/lang-types.ts';
import { getTextMapRelPath } from '../../../loadenv.ts';
import { toBoolean } from '../../../../shared/util/genericUtil.ts';
import { NormTextOptions } from '../../../domain/abstract/genericNormalizers.ts';
import { paramOption } from '../../../middleware/util/queryTab.ts';

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

export async function sendExcelRawDownloadResponse(ctrl: AbstractControl, req: Request, res: Response, next: NextFunction) {
  let file: string = toString(req.params.file);
  if (!file) {
    res.status(400).send('Missing file parameter.');
    return;
  }
  file = removeSuffix(file.trim(), '.json') + '.json';
  res.download(ctrl.getDataFilePath(ctrl.getExcelPath(file)), err => {
    if (err) {
      console.error('Error sending file:', err);
      if (!res.headersSent) {
        res.status(500).send('Couldl not download the file. An internal error occurred.');
      }
    }
  });
}

export function sendTextMapRawDownloadResponse(ctrlSupplier: ((req: Request) => AbstractControl)) {
  return [
    async (req: Request, res: Response, _next: NextFunction) => {
      const ctrl = ctrlSupplier(req);
      const langCode: string = toString(req.query.langCode);

      if (!isLangCode(langCode) || langCode === 'CH' || ctrl.disabledLangCodes.has(langCode)) {
        res.status(400).send('Invalid or unsupported language code parameter.');
        return;
      }

      const doNormText: boolean = toBoolean(req.query.doNormText);

      if (!doNormText) {
        res.download(ctrl.getDataFilePath(getTextMapRelPath(langCode)), err => {
          if (err) {
            console.error('Error sending file:', err);
            if (!res.headersSent) {
              res.status(500).send('Could not download the file. An internal error occurred.');
            }
          }
        });
      } else {
        let options: NormTextOptions = {
          decolor: toBoolean(req.query.decolor),
          plaintext: toBoolean(req.query.plaintext),
          plaintextMcMode: paramOption(req, 'plaintextMcMode', 'both', 'male', 'female'),
          forceFancyDash: toBoolean(req.query.forceFancyDash),
          skipHtml2Quotes: toBoolean(req.query.skipHtml2Quotes),
        };

        const textMapJson = await ctrl.readJsonFile(ctrl.getDataFilePath(getTextMapRelPath(langCode)));
        for (let key of Object.keys(textMapJson)) {
          textMapJson[key] = ctrl.normText(textMapJson[key], langCode, options);
        }

        res.attachment(`TextMap${langCode}.json`);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(textMapJson, null, 2));
      }
    }
  ];
}
