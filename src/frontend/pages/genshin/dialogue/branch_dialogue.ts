import { genshinEndpoints } from '../../../core/endpoints.ts';
import { pageMatch } from '../../../core/pageMatch.ts';
import { startGenericSearchPageListeners } from '../../genericSearchPage.ts';
import './branch-dialogue.scss';

pageMatch('pages/genshin/dialogue/branch-dialogue', () => {
  startGenericSearchPageListeners({
    endpoint: genshinEndpoints.generateSingleDialogueBranch,
    asHtml: true,

    inputs: [
      {
        selector: '.dialogue-generate-input',
        apiParam: 'text',
        queryParam: 'q',
        pasteButton: '.dialogue-generate-input-paste',
        clearButton: '.dialogue-generate-input-clear',
      },
      {
        selector: '.npc-filter-input',
        apiParam: 'npcFilter',
        queryParam: 'npc',
        clearButton: '.npc-filter-input-clear',
      },
      {
        selector: '#voicedOnly',
        apiParam: 'voicedOnly',
        queryParam: 'voicedOnly',
      }
    ],

    submitPendingTarget: '.dialogue-generate-submit-pending',
    submitButtonTarget: '.dialogue-generate-submit',
    resultTarget: '#dialogue-generate-result',
  });
});
