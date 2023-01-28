import { endpoints } from '../../endpoints';
import { pageMatch } from '../../pageMatch';
import { startGenericSearchPageListeners } from '../genericSearchPage';

pageMatch('pages/basic/text-map-expand', () => {
  startGenericSearchPageListeners({
    endpoint: endpoints.searchTextMap
  })
});