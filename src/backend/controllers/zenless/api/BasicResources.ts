import { create } from '../../../routing/router.ts';
import {
  handleExcelUsagesEndpoint,
  handleOlEndpoint,
  handleTextMapSearchEndpoint,
} from '../../abstract/api/abstractBasicResources.ts';
import { getZenlessControl } from '../../../domain/zenless/zenlessControl.ts';
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

router.endpoint('/excel-usages', {
  get: async (req: Request, res: Response) => {
    await handleExcelUsagesEndpoint(getZenlessControl(req), req, res);
  }
});

export default router;
