import { endpoints } from '../../endpoints';
import { pageMatch } from '../../pageMatch';
import { startGenericSearchPageListeners } from '../genericSearchPage';

pageMatch('pages/archive/material-search', () => {
  startGenericSearchPageListeners({
    endpoint: endpoints.searchItems,

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