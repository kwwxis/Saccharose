import { endpoints } from '../../endpoints';
import { pageMatch } from '../../pageMatch';
import { startGenericSearchPageListeners } from '../genericSearchPage';

pageMatch('pages/dialogue/npc-dialogue', () => {
  startGenericSearchPageListeners({
    endpoint: endpoints.generateNpcDialogue,

    inputTarget: '.dialogue-generate-input',
    submitPendingTarget: '.dialogue-generate-submit-pending',
    submitButtonTarget: '.dialogue-generate-submit',
    resultTarget: '#dialogue-generate-result',
  });
});