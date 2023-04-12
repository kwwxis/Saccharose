import { endpoints } from '../../endpoints';
import { pageMatch } from '../../pageMatch';
import { startGenericSearchPageListeners } from '../genericSearchPage';

pageMatch('pages/dialogue/npc-dialogue', () => {
  startGenericSearchPageListeners({
    endpoint: endpoints.generateNpcDialogue,
    
    inputs: [
      {
        selector: '.dialogue-generate-input',
        apiParam: 'name',
        queryParam: 'q',
        clearButton: '.dialogue-generate-input-clear',
      }
    ],

    submitPendingTarget: '.dialogue-generate-submit-pending',
    submitButtonTarget: '.dialogue-generate-submit',
    resultTarget: '#dialogue-generate-result',
  });
});