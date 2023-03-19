import { pageMatch } from '../../pageMatch';
import { startGenericSearchPageListeners } from '../genericSearchPage';
import { endpoints } from '../../endpoints';

pageMatch('pages/basic/id-usages', () => {
  startGenericSearchPageListeners({
    endpoint: endpoints.getIdUsages,
    
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