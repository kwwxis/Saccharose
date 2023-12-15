import { create } from '../../../routing/router';
import {
  handleIdUsagesEndpoint,
  handleOlEndpoint,
  handleTextMapSearchEndpoint,
} from '../../generic/api/basicResourceResources';
import { getStarRailControl } from '../../../domain/hsr/starRailControl';
import { Request, Response, Router } from 'express';

const router: Router = create();

router.endpoint('/search-textmap', {
  get: async (req: Request, res: Response) => {
    await handleTextMapSearchEndpoint(getStarRailControl(req), req, res)
  }
});

router.endpoint('/OL/generate', {
  get: async (req: Request, res: Response) => {
    await handleOlEndpoint(getStarRailControl(req), req, res);
  }
});

router.endpoint('/id-usages', {
  get: async (req: Request, res: Response) => {
    await handleIdUsagesEndpoint(getStarRailControl(req), req, res);
  }
});

export default router;
