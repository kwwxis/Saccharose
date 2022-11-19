import { runWhenDOMContentLoaded } from './util/eventLoader';

let loadedViews: Set<string> = (() => {
  let csrfElement: HTMLMetaElement = document.querySelector('meta[name="view-stack"]');
  let loadedViews = csrfElement.content;
  csrfElement.remove();
  return new Set(loadedViews.split(','));
})();

console.log('[Page-Match] Loaded views:', loadedViews);

export function pageMatch(pageName: string, callback: Function) {
  let didPageMatch: boolean = loadedViews.has(pageName);
  if (didPageMatch) {
    console.log(`[Page-Match] Matched - ${pageName}`);
    runWhenDOMContentLoaded(() => callback());
  } else {
    console.log(`[Page-Match] Not matched - ${pageName}`);
  }
}