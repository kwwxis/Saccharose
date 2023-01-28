import { endpoints } from '../../endpoints';
import { pageMatch } from '../../pageMatch';
import { startGenericSearchPageListeners } from '../genericSearchPage';

pageMatch('pages/dialogue/vo-to-dialogue', () => {
  startGenericSearchPageListeners({
    endpoint: endpoints.voToDialogue
  });
});