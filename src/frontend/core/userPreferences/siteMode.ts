
export const SITE_MODE =
  document.querySelector<HTMLMetaElement>('meta[name="x-site-mode"]').content || '';

export const SITE_MODE_HOME =
  document.querySelector<HTMLMetaElement>('meta[name="x-site-mode-home"]').content || '';

export const SITE_MODE_NAME =
  document.querySelector<HTMLMetaElement>('meta[name="x-site-mode-name"]').content || '';

export const SITE_MODE_WIKI_DOMAIN =
  document.querySelector<HTMLMetaElement>('meta[name="x-site-mode-wiki-domain"]').content || '';

console.log('[Init] Site Mode:', {mode: SITE_MODE, home: SITE_MODE_HOME, name: SITE_MODE_NAME, wikiDomain: SITE_MODE_WIKI_DOMAIN});

const SiteMode = {
  mode: SITE_MODE,
  home: SITE_MODE_HOME,
  name: SITE_MODE_NAME,
  domain: SITE_MODE_WIKI_DOMAIN,
  get isGenshin() {
    return SITE_MODE === 'genshin';
  },
  get isStarRail() {
    return SITE_MODE === 'hsr';
  },
  get isZenless() {
    return SITE_MODE === 'zenless';
  },
  get storagePrefix() {
    if (this.isGenshin) {
      return 'GENSHIN'
    } else if (this.isStarRail) {
      return 'HSR'
    } else if (this.isZenless) {
      return 'ZENLESS';
    }
  },
  get imagePathPrefix() {
    if (this.isGenshin) {
      return '/images/genshin/'
    } else if (this.isStarRail) {
      return '/images/hsr/'
    } else if (this.isZenless) {
      return '/images/zenless/';
    }
  }
};

export default SiteMode;
