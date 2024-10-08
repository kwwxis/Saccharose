import { genshinEndpoints } from '../../../core/endpoints.ts';
import { pageMatch } from '../../../core/pageMatch.ts';
import { startGenericSearchPageListeners } from '../../genericSearchPage.ts';

pageMatch('vue/GenshinVoToDialoguePage', () => {
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
