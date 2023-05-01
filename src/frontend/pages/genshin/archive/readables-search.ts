import { genshinEndpoints } from '../../../endpoints';
import { pageMatch } from '../../../pageMatch';
import { startGenericSearchPageListeners } from '../../genericSearchPage';

pageMatch('pages/genshin/archive/readables-search', () => {
  startGenericSearchPageListeners({
    endpoint: genshinEndpoints.searchReadables,
    
    inputs: [
      {
        selector: '.search-input',
        apiParam: 'text',
        queryParam: 'q',
        clearButton: '.search-input-clear'
      }
    ],

    submitPendingTarget: '.search-submit-pending',
    submitButtonTarget: '.search-submit',
    resultTarget: '#search-result',
  })
});