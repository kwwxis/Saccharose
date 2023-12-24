import { runWhenDOMContentLoaded } from './util/eventLoader.ts';
let loadedViews: Set<string> = (() => {
  let viewStackMeta: HTMLMetaElement = document.querySelector('meta[name="view-stack"]');
  let loadedViews = viewStackMeta.content;
  viewStackMeta.remove();
  return new Set(loadedViews.split(','));
})();

console.log('[Init] Loaded views:', loadedViews);

export interface PageMatch {
  (pageName: string, callback: Function): void;
  get isGenshin(): boolean,
  get isStarRail(): boolean,
  get isZenless(): boolean,
}

export const pageMatch: PageMatch = Object.assign(
  (pageName: string, callback: Function) => {
    let didPageMatch: boolean = loadedViews.has(pageName);
    if (didPageMatch) {
      console.log(`[Init] Page Match - ${pageName}`);
      runWhenDOMContentLoaded(() => callback());
    }
  },
  {
    get isGenshin() {
      return document.documentElement.getAttribute('data-site-mode') === 'genshin';
    },
    get isStarRail() {
      return document.documentElement.getAttribute('data-site-mode') === 'hsr';
    },
    get isZenless() {
      return document.documentElement.getAttribute('data-site-mode') === 'zenless';
    }
  }
)