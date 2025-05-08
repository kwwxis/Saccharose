import { pageMatch } from '../../core/pageMatch.ts';
import { startGenericSearchPageListeners } from '../genericSearchPage.ts';
import { zenlessEndpoints } from '../../core/endpoints.ts';

pageMatch('vue/ZenlessDialogueGenerationPage', () => {
  startGenericSearchPageListeners({
    endpoint: zenlessEndpoints.dialogueGeneration,
    asHtml: true,

    inputs: [
      {
        selector: '.search-input',
        apiParam: 'text',
        queryParam: 'q',
        pasteButton: '.search-input-paste',
        clearButton: '.search-input-clear',
      },
    ],

    submitPendingTarget: '.search-submit-pending',
    submitButtonTarget: '.search-submit',
    resultTarget: '#search-result',
  });
});
