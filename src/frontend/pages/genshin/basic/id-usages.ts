import { pageMatch } from '../../../pageMatch';
import { startGenericSearchPageListeners } from '../../genericSearchPage';
import { genshinEndpoints } from '../../../endpoints';

pageMatch('pages/genshin/basic/id-usages', () => {
  startGenericSearchPageListeners({
    endpoint: genshinEndpoints.getIdUsages,
    
    inputs: [
      {
        selector: '.search-input',
        apiParam: 'q',
        queryParam: 'q',
        guards: [
          function (text: string): string {
            if (!text.split(/[ ,]/g).map(s => s.trim()).filter(s => !!s).every(s => /^\d+$/.test(s))) {
              return 'Must be a numeric ID.';
            }
            return null;
          }
        ]
      }
    ],

    submitPendingTarget: '.search-submit-pending',
    submitButtonTarget: '.search-submit',
    resultTarget: '#search-result',
  });
});