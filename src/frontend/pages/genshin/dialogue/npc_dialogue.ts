import { genshinEndpoints } from '../../../core/endpoints.ts';
import { pageMatch } from '../../../core/pageMatch.ts';
import { startGenericSearchPageListeners } from '../../genericSearchPage.ts';

pageMatch('pages/genshin/dialogue/npc-dialogue', () => {
  startGenericSearchPageListeners({
    endpoint: genshinEndpoints.generateNpcDialogue,
    asHtml: true,

    inputs: [
      {
        selector: '.npc-dialogue-generate-input',
        apiParam: 'name',
        queryParam: 'q',
        pasteButton: '.npc-dialogue-generate-input-paste',
        clearButton: '.npc-dialogue-generate-input-clear',
      }
    ],

    submitPendingTarget: '.npc-dialogue-generate-submit-pending',
    submitButtonTarget: '.npc-dialogue-generate-submit',
    resultTarget: '#npc-dialogue-generate-result',
  });
});
