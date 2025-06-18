import { create } from '../../../routing/router.ts';
import { getGenshinControl } from '../../../domain/genshin/genshinControl.ts';
import {
  handleTextMapSearchEndpoint,
} from '../../generic/handlers/handleTextMapSearch.ts';
import { Request, Response, Router } from 'express';
import { handleExcelUsagesEndpoint } from '../../generic/handlers/handleExcelUsagesEndpoint.ts';
import { handleOlEndpoint } from '../../generic/handlers/handleOlEndpoint.ts';
import { handleOlCombine } from '../../generic/handlers/handleOlCombine.ts';

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

router.endpoint('/OL/combine', {
  post: async (req: Request, res: Response) => {
    return await handleOlCombine(getGenshinControl(req), req, res);
  }
});

router.endpoint('/excel-usages', {
  get: async (req: Request, res: Response) => {
    return await handleExcelUsagesEndpoint(getGenshinControl(req), req, res);
  }
});

export default router;
