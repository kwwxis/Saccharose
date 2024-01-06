import { genshinEndpoints } from '../../../core/endpoints.ts';
import { pageMatch } from '../../../core/pageMatch.ts';
import { startGenericSearchPageListeners } from '../../genericSearchPage.ts';
import { listen } from '../../../util/eventListen.ts';
import { FileFormatListeners } from '../../../core/generalEvents/fileFormatEvents.ts';

pageMatch('pages/genshin/archive/tutorials-search', () => {
  startGenericSearchPageListeners({
    endpoint: genshinEndpoints.searchTutorials,

    inputs: [
      {
        selector: '.search-input',
        apiParam: 'text',
        queryParam: 'q',
        pasteButton: '.search-input-paste',
        clearButton: '.search-input-clear'
      }
    ],

    submitPendingTarget: '.search-submit-pending',
    submitButtonTarget: '.search-submit',
    resultTarget: '#search-result',

    afterProcessResult(caller, resultContainer) {
      listen(FileFormatListeners, resultContainer);
    }
  });
});
