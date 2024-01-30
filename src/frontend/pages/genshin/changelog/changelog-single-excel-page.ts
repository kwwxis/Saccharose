import { pageMatch } from '../../../core/pageMatch.ts';
import { initExcelViewer } from '../../generic/excel-viewer/excel-viewer.ts';

pageMatch('vue/GenshinChangelogSingleExcelPage', async () => {
  const excelFileName: string = document.querySelector<HTMLMetaElement>('#x-addedRecords-excelFileName').content;
  const excelData: any[] = JSON.parse(document.querySelector<HTMLMetaElement>('#x-addedRecords-excelData').content);

  if (excelData && Array.isArray(excelData) && excelData.length) {
    initExcelViewer(
      excelFileName,
      excelData,
      false,
      document.querySelector('#tabpanel-addedRecords-excelViewer'),
    );
  }
});
