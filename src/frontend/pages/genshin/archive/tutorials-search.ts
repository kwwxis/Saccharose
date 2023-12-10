import { genshinEndpoints } from '../../../endpoints';
import { pageMatch } from '../../../pageMatch';
import { startGenericSearchPageListeners } from '../../genericSearchPage';
import { startListeners } from '../../../util/eventLoader';
import { fileFormatListeners } from '../../../initialListeners';

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