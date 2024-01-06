import { genshinEndpoints } from '../../../core/endpoints.ts';
import { pageMatch } from '../../../core/pageMatch.ts';
import { startGenericSearchPageListeners } from '../../genericSearchPage.ts';

pageMatch('pages/genshin/dialogue/npc-dialogue', () => {
  startGenericSearchPageListeners({
    endpoint: genshinEndpoints.generateNpcDialogue,

    inputs: [
      {
        selector: '.dialogue-generate-input',
        apiParam: 'name',
        queryParam: 'q',
        pasteButton: '.dialogue-generate-input-paste',
        clearButton: '.dialogue-generate-input-clear',
      }
    ],

    submitPendingTarget: '.dialogue-generate-submit-pending',
    submitButtonTarget: '.dialogue-generate-submit',
    resultTarget: '#dialogue-generate-result',
  });
});
