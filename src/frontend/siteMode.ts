
export const SITE_MODE = (() => {
  const meta: HTMLMetaElement = document.querySelector('meta[name="x-site-mode"]');
  return meta.content || '';
})();
export const SITE_MODE_HOME = (() => {
  const meta: HTMLMetaElement = document.querySelector('meta[name="x-site-mode-home"]');
  return meta.content || '';
})();
export const SITE_MODE_NAME = (() => {
  const meta: HTMLMetaElement = document.querySelector('meta[name="x-site-mode-name"]');
  return meta.content || '';
})();
export const SITE_MODE_WIKI_DOMAIN = (() => {
  const meta: HTMLMetaElement = document.querySelector('meta[name="x-site-mode-wiki-domain"]');
  return meta.content || '';
})();

console.log('[Init] Site Mode:', {mode: SITE_MODE, home: SITE_MODE_HOME, name: SITE_MODE_NAME, wikiDomain: SITE_MODE_WIKI_DOMAIN});