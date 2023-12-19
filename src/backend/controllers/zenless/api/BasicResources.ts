import { create } from '../../../routing/router';
import {
  handleIdUsagesEndpoint,
  handleOlEndpoint,
  handleTextMapSearchEndpoint,
} from '../../generic/api/basicResourceResources';
import { getZenlessControl } from '../../../domain/zenless/zenlessControl';
import { Request, Response, Router } from 'express';

const router: Router = create();

router.endpoint('/search-textmap', {
  get: async (req: Request, res: Response) => {
    await handleTextMapSearchEndpoint(getZenlessControl(req), req, res)
  }
});

router.endpoint('/OL/generate', {
  get: async (req: Request, res: Response) => {
    await handleOlEndpoint(getZenlessControl(req), req, res);
  }
});

router.endpoint('/id-usages', {
  get: async (req: Request, res: Response) => {
    await handleIdUsagesEndpoint(getZenlessControl(req), req, res);
  }
});

export default router;
