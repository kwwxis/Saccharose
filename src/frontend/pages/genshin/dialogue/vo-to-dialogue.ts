import { genshinEndpoints } from '../../../endpoints';
import { pageMatch } from '../../../pageMatch';
import { startGenericSearchPageListeners } from '../../genericSearchPage';

pageMatch('pages/genshin/dialogue/vo-to-dialogue', () => {
  startGenericSearchPageListeners({
    endpoint: genshinEndpoints.voToDialogue,
    
    inputs: [
      {
        selector: '.search-input',
        apiParam: 'text',
        queryParam: 'q',
        disableEnterKeySubmit: true
      }
    ],

    submitPendingTarget: '.search-submit-pending',
    submitButtonTarget: '.search-submit',
    resultTarget: '#search-result',
  });
});