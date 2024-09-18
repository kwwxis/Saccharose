import { runWhenDOMContentLoaded } from '../util/eventListen.ts';

const viewStackMeta: HTMLMetaElement = document.querySelector('meta[name="view-stack"]');
const loadedViews: Set<string> = new Set(viewStackMeta.content.split(','));
viewStackMeta.remove();

console.log('[Init] Loaded views:', loadedViews);

export function pageMatch(pageNameOrBodyClass: string, callback: Function) {
  if (loadedViews.has(pageNameOrBodyClass) || document.body.classList.contains(pageNameOrBodyClass)) {
    console.log(`[Init] Page Match - ${pageNameOrBodyClass}`);
    runWhenDOMContentLoaded(() => callback());
  }
}
