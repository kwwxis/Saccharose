import { endpoints } from '../../endpoints';
import { pageMatch } from '../../pageMatch';
import { startGenericSearchPageListeners } from '../genericSearchPage';

pageMatch('pages/archive/readables-search', () => {
  startGenericSearchPageListeners({
    endpoint: endpoints.searchReadables
  })
});