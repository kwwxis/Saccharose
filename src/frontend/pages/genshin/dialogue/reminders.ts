import { genshinEndpoints } from '../../../endpoints';
import { pageMatch } from '../../../pageMatch';
import { startGenericSearchPageListeners } from '../../genericSearchPage';

pageMatch('pages/genshin/dialogue/reminders', () => {
  startGenericSearchPageListeners({
    endpoint: genshinEndpoints.generateReminderDialogue,

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