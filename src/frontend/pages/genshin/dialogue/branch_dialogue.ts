import { genshinEndpoints } from '../../../endpoints';
import { pageMatch } from '../../../pageMatch';
import { startGenericSearchPageListeners } from '../../genericSearchPage';
import './branch-dialogue.scss';

pageMatch('pages/genshin/dialogue/branch-dialogue', () => {
  startGenericSearchPageListeners({
    endpoint: genshinEndpoints.generateSingleDialogueBranch,
    
    inputs: [
      {
        selector: '.dialogue-generate-input',
        apiParam: 'text',
        queryParam: 'q',
        clearButton: '.dialogue-generate-input-clear',
      },
      {
        selector: '.npc-filter-input',
        apiParam: 'npcFilter',
        queryParam: 'npc',
        clearButton: '.npc-filter-input-clear',
      }
    ],

    submitPendingTarget: '.dialogue-generate-submit-pending',
    submitButtonTarget: '.dialogue-generate-submit',
    resultTarget: '#dialogue-generate-result',
  });
});