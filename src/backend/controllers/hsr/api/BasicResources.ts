import { create, Request, Response, Router } from '../../../util/router';
import {
  handleIdUsagesEndpoint,
  handleOlEndpoint,
  handleTextMapSearchEndpoint,
} from '../../generic/basicResourcesUtil';
import { getStarRailControl } from '../../../domain/hsr/starRailControl';

const router: Router = create();

router.restful('/search-textmap', {
  get: async (req: Request, res: Response) => {
    await handleTextMapSearchEndpoint(getStarRailControl(req), req, res)
  }
});

router.restful('/OL/generate', {
  get: async (req: Request, res: Response) => {
    await handleOlEndpoint(getStarRailControl(req), req, res);
  }
});

router.restful('/id-usages', {
  get: async (req: Request, res: Response) => {
    await handleIdUsagesEndpoint(getStarRailControl(req), req, res);
  }
});

export default router;
