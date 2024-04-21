import { SitePrefName, SiteUserPrefs } from '../../../shared/types/site/site-user-types.ts';
import { genericEndpoints } from '../endpoints.ts';

const metaEl = document.querySelector<HTMLMetaElement>('meta[name="user-prefs"]');
export const USER_PREFS: SiteUserPrefs = JSON.parse(metaEl.content);

console.log('[Init] Site User Prefs:', USER_PREFS);

export async function setUserPref<T extends SitePrefName>(prefName: T, prefValue: SiteUserPrefs[T]): Promise<SiteUserPrefs> {
  await genericEndpoints.setPrefs.post({ prefName, prefValue }).then(res => {
    Object.assign(USER_PREFS, res);
    metaEl.content = JSON.stringify(USER_PREFS);
  }).catch(_ignore => {});

  return USER_PREFS;
}
