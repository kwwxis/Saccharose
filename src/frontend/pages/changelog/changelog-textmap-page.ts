import { pageMatch } from '../../core/pageMatch.ts';
import { initExcelViewer, makeSingleColumnDef } from '../generic/excel-viewer/excel-viewer.ts';
import {
  TextMapChangeAddDisplay,
  TextMapChangeRemoveDisplay,
  TextMapChangeUpdateDisplay,
} from '../../../shared/types/changelog-types.ts';
import { AgPromise, ICellRendererComp, ICellRendererParams } from 'ag-grid-community';
import { createPatch } from '../../../backend/util/jsdiff/jsdiff.js';
import { DiffUI } from '../../util/DiffUI.ts';
import { isNightmode } from '../../core/userPreferences/siteTheme.ts';
import { ColorSchemeType } from 'diff2html/lib/types';

class TextMapDiffCellComponent implements ICellRendererComp<TextMapChangeUpdateDisplay> {
  private element: HTMLDivElement;
  private diffUi: DiffUI;

  init(params: ICellRendererParams<TextMapChangeUpdateDisplay>): AgPromise<void> | void {
    this.refresh(params);
  }

  destroy(): void {
    this.diffUi.destroy();
  }

  getGui(): HTMLElement {
    return this.element;
  }

  refresh(params: ICellRendererParams<TextMapChangeUpdateDisplay>): boolean {
    if (this.diffUi) {
      this.diffUi.destroy();
    }

    if (!this.element) {
      this.element = document.createElement('div');
    }

    const unifiedDiff = createPatch(`Diff`, params.data.oldText, params.data.newText);

    this.diffUi = new DiffUI(this.element, {
      prevContent: params.data.oldText,
      currContent: params.data.newText,
      unifiedDiff: unifiedDiff,
    }, {
      matching: 'lines',
      drawFileList: false,
      drawFileHeader: false,
      outputFormat: 'line-by-line',
      colorScheme: isNightmode() ? ColorSchemeType.DARK : ColorSchemeType.LIGHT,
      synchronizedScroll: true,
      wordWrap: true,
      highlightOpts: {
        mode: 'ace/mode/wikitext'
      },
    });

    return true;
  }

}

pageMatch('vue/ChangelogTextMapPage', async () => {
  const changelogVersion: string = document.querySelector<HTMLMetaElement>('#x-changelog-version').content;
  const addedData: TextMapChangeAddDisplay[] = JSON.parse(document.querySelector<HTMLMetaElement>('#x-tmdiff-added').content);
  const updatedData: TextMapChangeUpdateDisplay[] = JSON.parse(document.querySelector<HTMLMetaElement>('#x-tmdiff-updated').content);
  const removedData: TextMapChangeRemoveDisplay[] = JSON.parse(document.querySelector<HTMLMetaElement>('#x-tmdiff-removed').content);

  let resetPreferredColumnStateFunctions: Function[] = [];

  if (addedData && addedData.length) {
    let { resetPreferredColumnState } = initExcelViewer(
      'Added TextMap Entries - ' + changelogVersion,
      addedData,
      document.querySelector('#grid-addedEntries'),
      {
        includeExcelListButton: false,
        overrideColDefs: [
          makeSingleColumnDef('textMapHash', 'TextMapHash', '123', {defaultShown: true}),
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
          makeSingleColumnDef('textMapHash', 'TextMapHash', '123', {defaultShown: true}),
          makeSingleColumnDef('oldText', 'Old Text', 'Lorem Ipsum'),
          makeSingleColumnDef('newText', 'New Text', 'Lorem Ipsum'),
          {
            colId: 'diff',
            field: 'diff',
            headerName: 'Diff',
            width: 520,
            cellClass: 'cell-type-special',
            cellRenderer: TextMapDiffCellComponent
          }
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
          makeSingleColumnDef('textMapHash', 'TextMapHash', '123', {defaultShown: true}),
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
