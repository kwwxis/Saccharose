import { endpoints } from '../../endpoints';
import { pageMatch } from '../../pageMatch';
import { startGenericSearchPageListeners } from '../genericSearchPage';

pageMatch('pages/dialogue/branch-dialogue', () => {
  startGenericSearchPageListeners({
    endpoint: endpoints.generateSingleDialogueBranch,

    inputTarget: '.dialogue-generate-input',
    submitPendingTarget: '.dialogue-generate-submit-pending',
    submitButtonTarget: '.dialogue-generate-submit',
    resultTarget: '#dialogue-generate-result',

    secondaryInputTarget: '.npc-filter-input',
    secondaryInputUrlParam: 'npc',
  });
});