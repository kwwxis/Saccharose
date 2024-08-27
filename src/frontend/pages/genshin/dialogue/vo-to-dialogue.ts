import { genshinEndpoints } from '../../../core/endpoints.ts';
import { pageMatch } from '../../../core/pageMatch.ts';
import { startGenericSearchPageListeners } from '../../genericSearchPage.ts';

pageMatch('pages/genshin/dialogue/vo-to-dialogue', () => {
  startGenericSearchPageListeners({
    endpoint: genshinEndpoints.voToDialogue,
    doPost: true,
    asHtml: true,

    inputs: [
      {
        selector: '.search-input',
        apiParam: 'text',
        disableEnterKeySubmit: true
      }
    ],

    submitPendingTarget: '.search-submit-pending',
    submitButtonTarget: '.search-submit',
    resultTarget: '#search-result',
  });
});
