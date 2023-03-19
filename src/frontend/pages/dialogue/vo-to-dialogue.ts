import { endpoints } from '../../endpoints';
import { pageMatch } from '../../pageMatch';
import { startGenericSearchPageListeners } from '../genericSearchPage';

pageMatch('pages/dialogue/vo-to-dialogue', () => {
  startGenericSearchPageListeners({
    endpoint: endpoints.voToDialogue,
    
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
  });
});