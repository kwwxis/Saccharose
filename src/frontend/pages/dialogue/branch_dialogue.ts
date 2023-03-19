import { endpoints } from '../../endpoints';
import { pageMatch } from '../../pageMatch';
import { startGenericSearchPageListeners } from '../genericSearchPage';
import './branch-dialogue.scss';

pageMatch('pages/dialogue/branch-dialogue', () => {
  startGenericSearchPageListeners({
    endpoint: endpoints.generateSingleDialogueBranch,
    
    inputs: [
      {
        selector: '.dialogue-generate-input',
        apiParam: 'text',
        queryParam: 'q',
      },
      {
        selector: '.npc-filter-input',
        apiParam: 'npcFilter',
        queryParam: 'npc',
      }
    ],

    submitPendingTarget: '.dialogue-generate-submit-pending',
    submitButtonTarget: '.dialogue-generate-submit',
    resultTarget: '#dialogue-generate-result',
  });
});