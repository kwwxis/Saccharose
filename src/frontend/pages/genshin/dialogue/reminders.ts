import { genshinEndpoints } from '../../../core/endpoints.ts';
import { pageMatch } from '../../../core/pageMatch.ts';
import { startGenericSearchPageListeners } from '../../genericSearchPage.ts';

pageMatch('vue/GenshinRemindersPage', () => {
  startGenericSearchPageListeners({
    endpoint: genshinEndpoints.generateReminderDialogue,
    asHtml: true,

    inputs: [
      {
        selector: '.reminder-generate-input',
        apiParam: 'text',
        queryParam: 'q',
        pasteButton: '.reminder-generate-input-paste',
        clearButton: '.reminder-generate-input-clear'
      },
      {
        selector: '.reminder-subseq-input',
        apiParam: 'subsequentAmount',
        queryParam: 'subseq',
        mapper: (text: string) => {
          return parseInt(text || '0');
        }
      }
    ],

    submitPendingTarget: '.reminder-generate-submit-pending',
    submitButtonTarget: '.reminder-generate-submit',
    resultTarget: '#reminder-generate-result',
  });
});
