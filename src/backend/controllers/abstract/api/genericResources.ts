import { Request, Response, Router } from 'express';
import {
  ScriptJobState,
  ScriptJobAction,
  ScriptJobActionArgs,
  ScriptJobCoordinator,
  ScriptJobPostResult,
} from '../../../util/scriptJobs.ts';
import { isInt, toInt } from '../../../../shared/util/numberUtil.ts';
import { HttpError } from '../../../../shared/util/httpError.ts';
import { isEmpty, toBoolean } from '../../../../shared/util/genericUtil.ts';
import { langDetect } from '../../../util/shellutil.ts';
import { RequestSiteMode } from '../../../routing/requestContext.ts';
import {
  getMwClient,
  MwClientInterface,
} from '../../../mediawiki/mwClientInterface.ts';
import {
  MwArticleInfo,
  MwRevision,
  MwArticleSearchResult, MwRevLoadMode,
} from '../../../../shared/mediawiki/mwTypes.ts';
import WikiRevisionSearchResults from '../../../components/mediawiki/WikiRevisionSearchResults.vue';
import { SiteUserProvider } from '../../../middleware/auth/SiteUserProvider.ts';
import { SitePrefName, SiteUserPrefs } from '../../../../shared/types/site/site-user-types.ts';
import { LANG_CODES } from '../../../../shared/types/lang-types.ts';
import { SEARCH_MODES } from '../../../../shared/util/searchUtil.ts';

async function postRevSave(req: Request): Promise<ScriptJobPostResult<'mwRevSave'>> {
  const mwClient: MwClientInterface = getMwClient(req.query.siteMode as RequestSiteMode);
  const titleOrId: string|number = (req.query.pageId || req.query.pageid || req.query.title) as string|number;

  if (isEmpty(titleOrId)) {
    throw HttpError.badRequest('InvalidParameter', `Must provide either 'pageId' or 'title' parameter.`);
  }

  const siteMode: RequestSiteMode = String(req.query.siteMode) as RequestSiteMode;
  const articleInfo: MwArticleInfo = await mwClient.getArticleInfo(titleOrId, null, toBoolean(req.query.skipArticleCache));
  const hasLatestRevision: boolean = await mwClient.db.hasRevision(articleInfo.lastrevid, true);

  if (!articleInfo) {
    throw HttpError.badRequest('InvalidParameter', `No article found with the provided parameters.`);
  }

  const args: ScriptJobActionArgs<'mwRevSave'> = {
    pageId: articleInfo.pageid,
    siteMode,
    resegment: toBoolean(req.query.resegment)
  };

  if (hasLatestRevision && !args.resegment) {
    return ScriptJobCoordinator.createNotNeededResult('mwRevSave', args);
  } else {
    return await ScriptJobCoordinator.post('mwRevSave',  args);
  }
}

export default function(router: Router): void {
  router.endpoint('/lang-detect', {
    get: async (req: Request, res: Response) => {
      return res.json(langDetect(String(req.query.text)));
    }
  });

  router.endpoint('/prefs', {
    get: async (req: Request, res: Response) => {
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
        case 'inputLangCode':
          if (LANG_CODES.includes(prefValue)) {
            prefPayload.inputLangCode = prefValue;
          }
          break;
        case 'outputLangCode':
          if (LANG_CODES.includes(prefValue)) {
            prefPayload.outputLangCode = prefValue;
          }
          break;
        case 'isNightmode':
          prefPayload.isNightmode = toBoolean(prefValue);
          break;
        case 'searchMode':
          if (SEARCH_MODES.includes(prefValue)) {
            prefPayload.searchMode = prefValue;
          }
          break;
        case 'siteMenuShown':
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
        default:
          throw HttpError.badRequest('InvalidParameter', 'Unsupported pref name for this endpoint: ' + prefName);
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

  router.endpoint('/jobs/simple-post', {
    post: async (req: Request, res: Response): Promise<ScriptJobPostResult<ScriptJobAction>> => {
      res.status(202);
      switch (String(req.query.action)) {
        case 'mwRevSave':
          return postRevSave(req);
        default:
          throw HttpError.badRequest('InvalidParameter', 'Unknown action: ' + String(req.query.action));
      }
    }
  });

  router.endpoint('/jobs/:jobId', {
    get: async (req: Request, _res: Response): Promise<ScriptJobState<ScriptJobAction>> => {
      const jobId: string = req.params.jobId;
      return await ScriptJobCoordinator.getState(jobId);
    }
  });

  router.endpoint('/mw/:siteMode/articles/search', {
    get: async (req: Request, res: Response) => {
      const mwClient: MwClientInterface = getMwClient(req.params.siteMode as RequestSiteMode);
      const query: string = String(req.query.q).trim();
      if (!query) {
        return [];
      }

      const searchResults: MwArticleSearchResult[] = await mwClient.searchArticles(query);

      if ((req.headers.accept && req.headers.accept.toLowerCase() === 'text/html')) {
        return res.render(WikiRevisionSearchResults, {
          searchResults: searchResults
        });
      } else {
        return searchResults;
      }
    }
  });

  router.endpoint('/mw/:siteMode/articles', {
    get: async (req: Request, _res: Response): Promise<MwArticleInfo> => {
      const mwClient: MwClientInterface = getMwClient(req.params.siteMode as RequestSiteMode);

      if (req.query.title) {
        return mwClient.getArticleInfo(String(req.query.title));
      } else if (isInt(req.query.pageId || req.query.pageid)) {
        return mwClient.getArticleInfo(toInt(req.query.pageId || req.query.pageid));
      } else {
        return null;
      }
    }
  });

  router.endpoint('/mw/:siteMode/articles/:pageId', {
    get: async (req: Request, _res: Response): Promise<MwArticleInfo> => {
      const mwClient: MwClientInterface = getMwClient(req.params.siteMode as RequestSiteMode);
      return mwClient.getArticleInfo(req.params.pageId);
    }
  });

  router.endpoint('/mw/:siteMode/revs', {
    get: async (req: Request, _res: Response): Promise<MwRevision[]> => {
      const mwClient: MwClientInterface = getMwClient(req.params.siteMode as RequestSiteMode);
      const loadMode: MwRevLoadMode = req.query.loadMode as MwRevLoadMode;

      const pageid = toInt(req.query.pageid || req.query.pageId);
      if (isInt(pageid)) {
        return mwClient.db.getSavedRevisionsByPageId(pageid, loadMode);
      }

      const revids: number[] = String(req.query.revid || req.query.revId || req.query.revids || req.query.revIds)
        .split(/[\s,;|]+/g)
        .filter(x => isInt(x))
        .map(x => toInt(x));
      return Object.values(await mwClient.db.getSavedRevisions(revids, loadMode));
    }
  });
}
