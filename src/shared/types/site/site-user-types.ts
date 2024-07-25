import passport_discord from 'passport-discord';
import { LangCode } from '../lang-types.ts';
import { SearchMode } from '../../util/searchUtil.ts';

export const VisitorPrefsCookieName = 'VisitorUserPrefs';

export type SiteUser = {
  id: string,
  discord_username: string,
  discord: passport_discord.Profile,

  wiki_id?: number,
  wiki_username?: string,
  wiki_avatar?: string,
  wiki_allowed?: boolean,

  prefs: SiteUserPrefs
};

export type SiteUserPrefs = {
  inputLangCode?: LangCode,
  outputLangCode?: LangCode,
  isNightmode?: boolean,
  searchMode?: SearchMode,
  siteMenuShown?: SiteMenuShown
};

export type SiteMenuShown = {
  [menuId: string]: SiteMenuShownEntry
};
export type SiteMenuShownEntry = {
  [id: string]: SiteMenuShownType,
};
export type SiteMenuShownType = 'collapsed' | 'hidden' | 'shown';

export type SitePrefName = keyof SiteUserPrefs;

export type SiteNoticeType = 'info' | 'success' | 'error' | 'warning';

export type SiteNotice = {
  id: number,
  notice_title: string,
  notice_type: SiteNoticeType,
  notice_body?: string,
  notice_link?: string,
  notice_enabled: boolean,
  banner_enabled: boolean,
};
