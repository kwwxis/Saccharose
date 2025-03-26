import { pageMatch } from '../../../core/pageMatch.ts';
import { initExcelViewer, makeSingleColumnDef } from '../../generic/excel-viewer/excel-viewer.ts';
import {
  TextMapChangeAddRow,
  TextMapChangeRemoveRow,
  TextMapChangeUpdateRow,
} from '../../../../shared/types/changelog-types.ts';

pageMatch('vue/GenshinChangelogTextMapPage', async () => {
  const changelogVersion: string = document.querySelector<HTMLMetaElement>('#x-changelog-version').content;
  const addedData: TextMapChangeAddRow[] = JSON.parse(document.querySelector<HTMLMetaElement>('#x-tmdiff-added').content);
  const updatedData: TextMapChangeUpdateRow[] = JSON.parse(document.querySelector<HTMLMetaElement>('#x-tmdiff-updated').content);
  const removedData: TextMapChangeRemoveRow[] = JSON.parse(document.querySelector<HTMLMetaElement>('#x-tmdiff-removed').content);

  let resetPreferredColumnStateFunctions: Function[] = [];

  if (addedData && addedData.length) {
    let { resetPreferredColumnState } = initExcelViewer(
      'Added TextMap Entries - ' + changelogVersion,
      addedData,
      document.querySelector('#grid-addedEntries'),
      {
        includeExcelListButton: false,
        overrideColDefs: [
          makeSingleColumnDef('textMapHash', 'TextMapHash', '123', {alwaysShow: true}),
          makeSingleColumnDef('text', 'Text', 'Lorem Ipsum'),
        ],
        height: 'calc(100vh - 252px)',
      }
    );
    resetPreferredColumnStateFunctions.push(resetPreferredColumnState);
  }

  if (updatedData && updatedData.length) {
    let { resetPreferredColumnState } = initExcelViewer(
      'Updated TextMap Entries - ' + changelogVersion,
      updatedData,
      document.querySelector('#grid-updatedEntries'),
      {
        includeExcelListButton: false,
        overrideColDefs: [
          makeSingleColumnDef('textMapHash', 'TextMapHash', '123', {alwaysShow: true}),
          makeSingleColumnDef('oldText', 'Old Text', 'Lorem Ipsum'),
          makeSingleColumnDef('newText', 'New Text', 'Lorem Ipsum'),
        ],
        height: 'calc(100vh - 252px)',
      }
    );
    resetPreferredColumnStateFunctions.push(resetPreferredColumnState);
  }

  if (removedData && removedData.length) {
    let { resetPreferredColumnState } = initExcelViewer(
      'Removed TextMap Entries - ' + changelogVersion,
      removedData,
      document.querySelector('#grid-removedEntries'),
      {
        includeExcelListButton: false,
        overrideColDefs: [
          makeSingleColumnDef('textMapHash', 'TextMapHash', '123', {alwaysShow: true}),
          makeSingleColumnDef('text', 'Text', 'Lorem Ipsum'),
        ],
        height: 'calc(100vh - 252px)',
      }
    );
    resetPreferredColumnStateFunctions.push(resetPreferredColumnState);
  }

  (<any> window).resetPreferredColumnState = function () {
    for (let func of resetPreferredColumnStateFunctions) {
      func();
    }
  };
});
