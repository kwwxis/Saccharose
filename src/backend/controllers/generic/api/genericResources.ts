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

async function postRevSave(req: Request): Promise<ScriptJobPostResult<'mwRevSave'>> {
  const mwClient: MwClientInterface = getMwClient(req.query.siteMode as RequestSiteMode);
  const titleOrId: string|number = (req.query.pageId || req.query.pageid || req.query.title) as string|number;

  if (isEmpty(titleOrId)) {
    throw HttpError.badRequest('InvalidParameter', `Must provide either 'pageId' or 'title' parameter.`);
  }

  const siteMode: RequestSiteMode = String(req.query.siteMode) as RequestSiteMode;
  const articleInfo: MwArticleInfo = await mwClient.getArticleInfo(titleOrId);
  const hasLatestRevision: boolean = await mwClient.db.hasRevision(articleInfo.lastrevid);

  if (!articleInfo) {
    throw HttpError.badRequest('InvalidParameter', `No article found with the provided parameters.`);
  }

  const args: ScriptJobActionArgs<'mwRevSave'> = {
    pageId: articleInfo.pageid,
    siteMode,
    resegment: toBoolean(req.query.resegment)
  };

  if (hasLatestRevision) {
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

  router.endpoint('/jobs/post', {
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
