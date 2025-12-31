export type SiteMode = 'unset' | 'genshin' | 'hsr' | 'zenless' | 'wuwa';

export const AvailableSiteModes: SiteMode[] = ['unset', 'genshin', 'hsr', 'zenless', 'wuwa'];

export const SITE_MODE_URL_PATH_REGEXES = {
  GENSHIN:  /^(\/api|\/api\/mw)?\/(genshin|gi|g)(\/|$)/i,
  HSR:      /^(\/api|\/api\/mw)?\/(hsr|h)(\/|$)/i,
  ZENLESS:  /^(\/api|\/api\/mw)?\/(zenless|zzz|z)(\/|$)/i,
  WUWA:     /^(\/api|\/api\/mw)?\/(wuwa|w)(\/|$)/i,
}
