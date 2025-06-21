import { Request, Response, Router } from 'express';
import { getMwClient, MwClientInterface } from '../../../mediawiki/mwClientInterface.ts';
import {
  MwArticleInfo,
  MwArticleSearchResult,
  MwRevision,
  MwRevLoadMode,
} from '../../../../shared/mediawiki/mwTypes.ts';
import WikiRevisionSearchResults from '../../../components/mediawiki/WikiRevisionSearchResults.vue';
import { isInt, toInt } from '../../../../shared/util/numberUtil.ts';
import { SiteMode } from '../../../../shared/types/site/site-mode-type.ts';

export default function(router: Router): void {
  router.endpoint('/mw/:siteMode/articles/search', {
    get: async (req: Request, res: Response) => {
      const mwClient: MwClientInterface = getMwClient(req.params.siteMode as SiteMode);
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
      const mwClient: MwClientInterface = getMwClient(req.params.siteMode as SiteMode);

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
      const mwClient: MwClientInterface = getMwClient(req.params.siteMode as SiteMode);
      return mwClient.getArticleInfo(req.params.pageId);
    }
  });

  router.endpoint('/mw/:siteMode/revs', {
    get: async (req: Request, _res: Response): Promise<MwRevision[]> => {
      const mwClient: MwClientInterface = getMwClient(req.params.siteMode as SiteMode);
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
