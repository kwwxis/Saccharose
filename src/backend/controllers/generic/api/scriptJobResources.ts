import { Request, Response, Router } from 'express';
import {
  ScriptJobAction, ScriptJobActionArgs,
  ScriptJobCoordinator,
  ScriptJobPostResult,
  ScriptJobState,
} from '../../../util/scriptJobs.ts';
import { HttpError } from '../../../../shared/util/httpError.ts';
import { getMwClient, MwClientInterface } from '../../../mediawiki/mwClientInterface.ts';
import { RequestSiteMode } from '../../../routing/requestContext.ts';
import { isEmpty, toBoolean } from '../../../../shared/util/genericUtil.ts';
import { MwArticleInfo } from '../../../../shared/mediawiki/mwTypes.ts';

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
}
