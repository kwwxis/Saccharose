import { endpoints } from '../../endpoints';
import { pageMatch } from '../../pageMatch';
import { startGenericSearchPageListeners } from '../genericSearchPage';

pageMatch('pages/dialogue/reminders', () => {
  startGenericSearchPageListeners({
    endpoint: endpoints.generateReminderDialogue,

    inputTarget: '.reminder-generate-input',
    submitPendingTarget: '.reminder-generate-submit-pending',
    submitButtonTarget: '.reminder-generate-submit',
    resultTarget: '#reminder-generate-result',

    secondaryInputUrlParam: 'subseq',
    secondaryInputTarget: '.reminder-subseq-input',
    secondaryInputMapper: (text: string) => {
      return parseInt(text || '0');
    }
  });
});