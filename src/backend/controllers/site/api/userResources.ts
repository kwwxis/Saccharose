import { Request, Response, Router } from 'express';
import { HttpError } from '../../../../shared/util/httpError.ts';
import { SitePrefName, SiteUserPrefs } from '../../../../shared/types/site/site-user-types.ts';
import { isLangCode, LANG_CODES } from '../../../../shared/types/lang-types.ts';
import { toBoolean } from '../../../../shared/util/genericUtil.ts';
import { SEARCH_MODES } from '../../../../shared/util/searchUtil.ts';
import { SiteUserProvider } from '../../../middleware/auth/SiteUserProvider.ts';
import { isInt, toInt } from '../../../../shared/util/numberUtil.ts';
import { createWsJwtToken } from '../../../websocket/ws-server-auth.ts';
import { WsJwtTokenResponse } from '../../../../shared/types/wss-types.ts';

export default function(router: Router): void {
  router.endpoint('/prefs', {
    get: async (req: Request, _res: Response) => {
      if (!req.isAuthenticated() || !req.user?.id) {
        throw HttpError.badRequest('AuthRequired', 'Must be logged in to perform this request.');
      }
      return req.context.prefs;
    },
    post: async (req: Request, res: Response) => {
      if (!req.isAuthenticated() || !req.user?.id) {
        throw HttpError.badRequest('AuthRequired', 'Must be logged in to perform this request.');
      }

      let prefPayload: Partial<SiteUserPrefs> = {};
      let prefName: SitePrefName = req.query.prefName as any;
      let prefValue: any = req.query.prefValue as any;

      switch (prefName) {
        case 'inputLangCode': {
          if (LANG_CODES.includes(prefValue)) {
            prefPayload.inputLangCode = prefValue;
          }
          break;
        }
        case 'outputLangCode': {
          if (LANG_CODES.includes(prefValue)) {
            prefPayload.outputLangCode = prefValue;
          }
          break;
        }
        case 'isNightmode': {
          prefPayload.isNightmode = toBoolean(prefValue);
          break;
        }
        case 'searchMode': {
          if (SEARCH_MODES.includes(prefValue)) {
            prefPayload.searchMode = prefValue;
          }
          break;
        }
        case 'siteMenuShown': {
          const parts: string[] = String(prefValue).split('|');
          if (parts.length !== 3) {
            throw HttpError.badRequest('InvalidParameter', 'Invalid payload provided');
          }
          const [menuId, thingId, thingState] = parts;
          if (thingState !== 'collapsed' && thingState !== 'shown' && thingState !== 'hidden' && thingState !== 'toggle') {
            throw HttpError.badRequest('InvalidParameter', 'Invalid payload provided');
          }

          prefPayload.siteMenuShown = req.context.prefs.siteMenuShown || {};
          if (!prefPayload.siteMenuShown[menuId]) {
            prefPayload.siteMenuShown[menuId] = {};
          }
          if (thingState === 'toggle') {
            prefPayload.siteMenuShown[menuId][thingId] = prefPayload.siteMenuShown[menuId][thingId] === 'collapsed' ? 'shown' : 'collapsed';
          } else {
            prefPayload.siteMenuShown[menuId][thingId] = thingState;
          }
          break;
        }
        case 'voPrefixDisabledLangs': {
          if (Array.isArray(prefValue)) {
            if (prefValue.some(v => !LANG_CODES.includes(v))) {
              throw HttpError.badRequest('InvalidParameter', 'Invalid language code in payload');
            }
            prefPayload.voPrefixDisabledLangs = prefValue;
          } else if (typeof prefValue === 'string' && prefValue.includes('|')) {
            const parts: string[] = String(prefValue).split('|');
            if (parts.length !== 2) {
              throw HttpError.badRequest('InvalidParameter', 'Invalid payload provided');
            }
            if (!isLangCode(parts[0])) {
              throw HttpError.badRequest('InvalidParameter', 'Invalid language code in payload');
            }
            if (Array.isArray(req.context.prefs.voPrefixDisabledLangs)) {
              prefPayload.voPrefixDisabledLangs = req.context.prefs.voPrefixDisabledLangs;
            } else {
              prefPayload.voPrefixDisabledLangs = [];
            }
            if (toBoolean(parts[1])) {
              if (!prefPayload.voPrefixDisabledLangs.includes(parts[0])) {
                prefPayload.voPrefixDisabledLangs.push(parts[0]);
              }
            } else {
              if (prefPayload.voPrefixDisabledLangs.includes(parts[0])) {
                prefPayload.voPrefixDisabledLangs.splice(prefPayload.voPrefixDisabledLangs.indexOf(parts[0]), 1);
              }
            }
          }
          break;
        }
        default: {
          throw HttpError.badRequest('InvalidParameter', 'Unsupported pref name for this endpoint: ' + prefName);
        }
      }

      if (!Object.keys(prefPayload).length) {
        throw HttpError.badRequest('InvalidParameter', 'Invalid payload provided');
      }

      await SiteUserProvider.update(req.user.id, {
        prefs: Object.assign({}, req.context.prefs, prefPayload)
      });
      await SiteUserProvider.syncDatabaseStateToRequestUser(req);
      return res.json(req.context.prefs);
    }
  });

  router.endpoint('/wstoken', {
    post: async (req: Request, res: Response) => {
      if (!req.isAuthenticated() || !req.user?.id) {
        throw HttpError.badRequest('AuthRequired', 'Must be logged in to perform this request.');
      }
      return res.json(<WsJwtTokenResponse> {
        token: createWsJwtToken(req.user)
      });
    }
  });

  router.endpoint('/site-notice', {
    get: async (req: Request, res: Response) => {
      return res.json(await SiteUserProvider.getAllSiteNotices());
    }
  });

  router.endpoint('/site-notice/dismiss', {
    post: async (req: Request, res: Response) => {
      if (!req.isAuthenticated() || !req.user?.id) {
        throw HttpError.badRequest('AuthRequired', 'Must be logged in to perform this request.');
      }
      if (!isInt(req.query.noticeId)) {
        throw HttpError.badRequest('InvalidParameter', 'Must have noticeId integer parameter.');
      }
      await SiteUserProvider.dismissSiteNotice(req.user.id, toInt(req.query.noticeId));
      return res.json({
        result: 'dismissed'
      });
    }
  });
}
