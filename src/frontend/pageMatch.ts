import { runWhenDOMContentLoaded } from './util/eventLoader';

let loadedViews: Set<string> = (() => {
  let csrfElement: HTMLMetaElement = document.querySelector('meta[name="view-stack"]');
  let loadedViews = csrfElement.content;
  csrfElement.remove();
  return new Set(loadedViews.split(','));
})();

console.log('[Init] Loaded views:', loadedViews);

export function pageMatch(pageName: string, callback: Function) {
  let didPageMatch: boolean = loadedViews.has(pageName);
  if (didPageMatch) {
    console.log(`[Init] Page Match - ${pageName}`);
    runWhenDOMContentLoaded(() => callback());
  }
}