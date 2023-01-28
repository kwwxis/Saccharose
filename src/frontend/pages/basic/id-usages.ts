import { pageMatch } from '../../pageMatch';
import { startGenericSearchPageListeners } from '../genericSearchPage';
import { endpoints } from '../../endpoints';

pageMatch('pages/basic/id-usages', () => {
  startGenericSearchPageListeners({
    endpoint: endpoints.getIdUsages,
    inputGuards: [
      function (text: string): string {
        if (!text.split(/[ ,]/g).map(s => s.trim()).filter(s => !!s).every(s => /^\d+$/.test(s))) {
          return 'Must be a numeric ID.';
        }
        return null;
      }
    ]
  });
});