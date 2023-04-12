import { endpoints } from '../../endpoints';
import { pageMatch } from '../../pageMatch';
import { startGenericSearchPageListeners } from '../genericSearchPage';

pageMatch('pages/dialogue/reminders', () => {
  startGenericSearchPageListeners({
    endpoint: endpoints.generateReminderDialogue,

    inputs: [
      {
        selector: '.reminder-generate-input',
        apiParam: 'text',
        queryParam: 'q',
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