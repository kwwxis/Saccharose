import { create } from '../../../routing/router.ts';
import {
  handleTextMapSearchEndpoint,
} from '../../generic/handlers/handleTextMapSearch.ts';
import { getWuwaControl } from '../../../domain/wuwa/wuwaControl.ts';
import { Request, Response, Router } from 'express';
import { handleExcelUsagesEndpoint } from '../../generic/handlers/handleExcelUsagesEndpoint.ts';
import { handleOlEndpoint } from '../../generic/handlers/handleOlEndpoint.ts';
import { handleOlCombine } from '../../generic/handlers/handleOlCombine.ts';

const router: Router = create();

router.endpoint('/search-textmap', {
  get: async (req: Request, res: Response) => {
    return await handleTextMapSearchEndpoint(getWuwaControl(req), req, res)
  }
});

router.endpoint('/OL/generate', {
  get: async (req: Request, res: Response) => {
    return await handleOlEndpoint(getWuwaControl(req), req, res);
  }
});

router.endpoint('/OL/combine', {
  post: async (req: Request, res: Response) => {
    return await handleOlCombine(getWuwaControl(req), req, res);
  }
});

router.endpoint('/excel-usages', {
  get: async (req: Request, res: Response) => {
    return await handleExcelUsagesEndpoint(getWuwaControl(req), req, res);
  }
});

export default router;
