export type SiteMode = 'unset' | 'genshin' | 'hsr' | 'zenless' | 'wuwa';

export const AvailableSiteModes: SiteMode[] = ['unset', 'genshin', 'hsr', 'zenless', 'wuwa'];

export type UnsetSiteModeBasePath     = '/';
export type GenshinSiteModeBasePath   = '/genshin'  | '/gi'   | '/g';
export type StarRailSiteModeBasePath  = '/hsr'      | '/h';
export type ZenlessSiteModeBasePath   = '/zenless'  | '/zzz'  | '/z';
export type WuwaSiteModeBasePath      = '/wuwa'     | '/w';

export const SITE_MODE_URL_PATH_REGEXES: Record<SiteMode, RegExp> = {
  unset:    null,
  genshin:  /^(\/api|\/api\/mw)?\/(genshin|gi|g)(\/|$)/i,
  hsr:      /^(\/api|\/api\/mw)?\/(hsr|h)(\/|$)/i,
  zenless:  /^(\/api|\/api\/mw)?\/(zenless|zzz|z)(\/|$)/i,
  wuwa:     /^(\/api|\/api\/mw)?\/(wuwa|w)(\/|$)/i,
};

export const UNSET_SITE_MODE_BASE_PATHS: UnsetSiteModeBasePath[]      = ['/'];
export const GENSHIN_SITE_MODE_BASE_PATHS: GenshinSiteModeBasePath[]  = ['/genshin',  '/gi',    '/g'];
export const HSR_SITE_MODE_BASE_PATHS: StarRailSiteModeBasePath[]     = ['/hsr',      '/h'          ];
export const ZENLESS_SITE_MODE_BASE_PATHS: ZenlessSiteModeBasePath[]  = ['/zenless',  '/zzz',   '/z'];
export const WUWA_SITE_MODE_BASE_PATHS: WuwaSiteModeBasePath[]        = ['/wuwa',     '/w'          ];

export function getSiteModeFromPath(path: string): SiteMode {
  path = path.toLowerCase();
  if (SITE_MODE_URL_PATH_REGEXES.hsr.test(path)) {
    return 'hsr';
  } else if (SITE_MODE_URL_PATH_REGEXES.zenless.test(path)) {
    return 'zenless';
  } else if (SITE_MODE_URL_PATH_REGEXES.wuwa.test(path)) {
    return 'wuwa';
  } else if (SITE_MODE_URL_PATH_REGEXES.genshin.test(path)) {
    return 'genshin';
  } else {
    return 'unset';
  }
}

export type SiteModeBasePathMap = {
  unset: UnsetSiteModeBasePath;
  genshin: GenshinSiteModeBasePath;
  hsr: StarRailSiteModeBasePath;
  zenless: ZenlessSiteModeBasePath;
  wuwa: WuwaSiteModeBasePath;
};

export function getAvailableBasePathsForSiteMode(siteMode: SiteMode) {
  switch (siteMode) {
    case 'unset':
      return UNSET_SITE_MODE_BASE_PATHS;
    case 'genshin':
      return GENSHIN_SITE_MODE_BASE_PATHS;
    case 'hsr':
      return HSR_SITE_MODE_BASE_PATHS;
    case 'zenless':
      return ZENLESS_SITE_MODE_BASE_PATHS;
    case 'wuwa':
      return WUWA_SITE_MODE_BASE_PATHS;
    default:
      throw new Error(`Unsupported site mode: ${siteMode}`);
  }
}

export function getDefaultBasePathForSiteMode(siteMode: SiteMode) {
  return getAvailableBasePathsForSiteMode(siteMode)[0];
}

export function getCurrentBasePathForUrl(siteMode: SiteMode, url: string) {
  if (siteMode === 'unset') {
    return '/';
  }

  const lcPath = url.toLowerCase();

  for (let basePath of getAvailableBasePathsForSiteMode(siteMode)) {
    if (lcPath === basePath || lcPath.startsWith(basePath.endsWith('/') ? basePath : basePath + '/')) {
      return basePath;
    }
  }

  return getDefaultBasePathForSiteMode(siteMode);
}
