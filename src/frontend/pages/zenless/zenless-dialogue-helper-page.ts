import { pageMatch } from '../../core/pageMatch.ts';
import { startGenericSearchPageListeners } from '../genericSearchPage.ts';
import { zenlessEndpoints } from '../../core/endpoints.ts';

pageMatch('vue/ZenlessDialogueHelperPage', () => {
  startGenericSearchPageListeners({
    endpoint: zenlessEndpoints.dialogueHelper,
    asHtml: true,

    inputs: [
      {
        selector: '.search-input',
        apiParam: 'text',
        queryParam: 'q',
        pasteButton: '.search-input-paste',
        clearButton: '.search-input-clear',
      },
      {
        selector: '#hashSearch',
        apiParam: 'hashSearch',
      },
    ],

    submitPendingTarget: '.search-submit-pending',
    submitButtonTarget: '.search-submit',
    resultTarget: '#search-result',
  });
});
