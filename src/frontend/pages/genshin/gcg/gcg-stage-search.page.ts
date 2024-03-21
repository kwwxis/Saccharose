import { genshinEndpoints } from '../../../core/endpoints.ts';
import { pageMatch } from '../../../core/pageMatch.ts';
import { startGenericSearchPageListeners } from '../../genericSearchPage.ts';

pageMatch('vue/GcgStageSearchPage', () => {
  startGenericSearchPageListeners({
    endpoint: genshinEndpoints.searchTcgStages,
    asHtml: true,

    inputs: [
      {
        selector: '.stage-search-input',
        apiParam: 'text',
        queryParam: 'q',
        pasteButton: '.stage-search-input-paste',
        clearButton: '.stage-search-input-clear',
      }
    ],

    submitPendingTarget: '.stage-search-submit-pending',
    submitButtonTarget: '.stage-search-submit',
    resultTarget: '#tcg-stage-search-result',
  });
});
