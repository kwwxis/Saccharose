import { create, Request, Response, Router } from '../../../util/router';
import {
  handleIdUsagesEndpoint,
  handleOlEndpoint,
  handleTextMapSearchEndpoint,
} from '../../generic/basicResourcesUtil';
import { getZenlessControl } from '../../../domain/zenless/zenlessControl';

const router: Router = create();

router.restful('/search-textmap', {
  get: async (req: Request, res: Response) => {
    await handleTextMapSearchEndpoint(getZenlessControl(req), req, res)
  }
});

router.restful('/OL/generate', {
  get: async (req: Request, res: Response) => {
    await handleOlEndpoint(getZenlessControl(req), req, res);
  }
});

router.restful('/id-usages', {
  get: async (req: Request, res: Response) => {
    await handleIdUsagesEndpoint(getZenlessControl(req), req, res);
  }
});

export default router;
