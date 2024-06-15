import { create } from '../../../routing/router.ts';
import { getGenshinControl } from '../../../domain/genshin/genshinControl.ts';
import {
  handleExcelUsagesEndpoint,
  handleOlEndpoint,
  handleTextMapSearchEndpoint,
} from '../../generic/api/abstractBasicResources.ts';
import { Request, Response, Router } from 'express';

const router: Router = create();

router.endpoint('/search-textmap', {
  get: async (req: Request, res: Response) => {
    return await handleTextMapSearchEndpoint(getGenshinControl(req), req, res)
  }
});

router.endpoint('/OL/generate', {
  get: async (req: Request, res: Response) => {
    return await handleOlEndpoint(getGenshinControl(req), req, res);
  }
});

router.endpoint('/excel-usages', {
  get: async (req: Request, res: Response) => {
    return await handleExcelUsagesEndpoint(getGenshinControl(req), req, res);
  }
});

export default router;
