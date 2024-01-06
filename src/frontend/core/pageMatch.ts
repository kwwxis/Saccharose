import { runWhenDOMContentLoaded } from '../util/eventListen.ts';

const viewStackMeta: HTMLMetaElement = document.querySelector('meta[name="view-stack"]');
const loadedViews: Set<string> = new Set(viewStackMeta.content.split(','));
viewStackMeta.remove();

console.log('[Init] Loaded views:', loadedViews);

export function pageMatch(pageName: string, callback: Function) {
  if (loadedViews.has(pageName)) {
    console.log(`[Init] Page Match - ${pageName}`);
    runWhenDOMContentLoaded(() => callback());
  }
}
