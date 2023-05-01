import { genshinEndpoints } from '../../../endpoints';
import { pageMatch } from '../../../pageMatch';
import { startGenericSearchPageListeners } from '../../genericSearchPage';

pageMatch('pages/genshin/dialogue/npc-dialogue', () => {
  startGenericSearchPageListeners({
    endpoint: genshinEndpoints.generateNpcDialogue,
    
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