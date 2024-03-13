import { DEFAULT_SEARCH_MODE, SearchMode } from '../../../shared/util/searchUtil.ts';
import { Listener } from '../../util/eventListen.ts';
import { USER_PREFS, setUserPref } from './sitePrefsContainer.ts';

export function getSiteSearchMode(): SearchMode {
  return USER_PREFS.searchMode || DEFAULT_SEARCH_MODE;
}

export function setSiteSearchMode(searchMode: SearchMode): void {
  setUserPref('searchMode', searchMode).then(r => {

    document.querySelectorAll('.search-mode-dropdown .option').forEach(el => {
      if (el.getAttribute('data-value') === searchMode) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });

    document.querySelectorAll<HTMLElement>('.search-mode-button .code').forEach(el => el.innerText = searchMode);

  });
}

export const SiteSearchModeListener: Listener = {
  selector: '.search-mode-dropdown .option',
  event: 'click',
  multiple: true,
  handle: function(event: Event, target: HTMLElement) {
    setSiteSearchMode(target.getAttribute('data-value') as SearchMode);
  }
};
