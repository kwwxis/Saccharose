import { genshinEndpoints } from '../../../endpoints.ts';
import { pageMatch } from '../../../pageMatch.ts';
import { startGenericSearchPageListeners } from '../../genericSearchPage.ts';
import { startListeners } from '../../../util/eventLoader.ts';
import { fileFormatListeners } from '../../../initialListeners.ts';

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
      startListeners(fileFormatListeners, resultContainer);
    }
  });
});