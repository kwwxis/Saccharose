import { endpoints } from '../../endpoints';
import { pageMatch } from '../../pageMatch';
import { startGenericSearchPageListeners } from '../genericSearchPage';

pageMatch('pages/archive/weapon-search', () => {
  startGenericSearchPageListeners({
    endpoint: endpoints.searchWeapons,

    inputs: [
      {
        selector: '.search-input',
        apiParam: 'text',
        queryParam: 'q',
      }
    ],

    submitPendingTarget: '.search-submit-pending',
    submitButtonTarget: '.search-submit',
    resultTarget: '#search-result',
  })
});