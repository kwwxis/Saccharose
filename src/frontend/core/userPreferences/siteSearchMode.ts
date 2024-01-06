import { SearchMode } from '../../../shared/util/searchUtil.ts';
import Cookies from 'js-cookie';
import { Listener } from '../../util/eventListen.ts';

export function getSiteSearchMode(): SearchMode {
  return (Cookies.get('search-mode') || 'WI') as SearchMode;
}

export function setSiteSearchMode(searchMode: SearchMode): void {
  document.querySelectorAll('.search-mode-dropdown .option').forEach(el => {
    if (el.getAttribute('data-value') === searchMode) {
      el.classList.add('selected');
    } else {
      el.classList.remove('selected');
    }
  });

  document.querySelectorAll<HTMLElement>('.search-mode-button .code').forEach(el => el.innerText = searchMode);
  Cookies.set('search-mode', searchMode, { expires: 365 });
}

export const SiteSearchModeListener: Listener = {
  selector: '.search-mode-dropdown .option',
  event: 'click',
  multiple: true,
  handle: function(event: Event, target: HTMLElement) {
    setSiteSearchMode(target.getAttribute('data-value') as SearchMode);
  }
};
