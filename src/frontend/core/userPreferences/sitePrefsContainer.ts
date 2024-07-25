import { SitePrefName, SiteUserPrefs, VisitorPrefsCookieName } from '../../../shared/types/site/site-user-types.ts';
import { genericEndpoints } from '../endpoints.ts';
import Cookies from 'js-cookie';

const prefsMetaEl = document.querySelector<HTMLMetaElement>('meta[name="user-prefs"]');
export const USER_PREFS: SiteUserPrefs = JSON.parse(prefsMetaEl.content);

const isAuthMetaEl = document.querySelector<HTMLMetaElement>('meta[name="is-authenticated"]');
export const USER_IS_AUTHENTICATED: boolean = JSON.parse(isAuthMetaEl.content);

console.log('[Init] Site User Prefs:', USER_PREFS);

if (USER_IS_AUTHENTICATED) {
  let visitorCookieInitialValue = Cookies.get(VisitorPrefsCookieName);
  if (visitorCookieInitialValue !== prefsMetaEl.content) {
    Cookies.set(VisitorPrefsCookieName, prefsMetaEl.content, { expires: 365 });
  }
}

export async function setUserPref<T extends SitePrefName>(prefName: T, prefValue: SiteUserPrefs[T]): Promise<SiteUserPrefs> {
  if (USER_IS_AUTHENTICATED) {
    await genericEndpoints.setPrefs.post({ prefName, prefValue }).then(res => {
      Object.assign(USER_PREFS, res);
    }).catch(_ignore => {});
  } else {
    Object.assign(USER_PREFS, { [prefName]: prefValue });
  }

  prefsMetaEl.content = JSON.stringify(USER_PREFS);
  Cookies.set(VisitorPrefsCookieName, prefsMetaEl.content, { expires: 365 });

  return USER_PREFS;
}
