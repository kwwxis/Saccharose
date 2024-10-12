import { create } from '../../../routing/router.ts';
import { Request, Response, Router } from 'express';
import { getWuwaControl } from '../../../domain/wuwa/wuwaControl.ts';

const router: Router = create();

router.endpoint('/media/search', {
  get: async (req: Request, _res: Response) => {
    const ctrl = getWuwaControl(req);
    return ctrl.searchImageIndex(ctrl.buildImageIndexSearchParamsFromRequest(req));
  }
});

router.endpoint('/media/category', {
  get: async (req: Request, _res: Response) => {
    const ctrl = getWuwaControl(req);
    return await ctrl.listImageCategories();
  }
});

router.endpoint('/media/post-create-image-index-job', {
  post: async (req: Request, _res: Response) => {
    const ctrl = getWuwaControl(req);
    return ctrl.postCreateImageIndexArchiveJob(ctrl.buildImageIndexSearchParamsFromRequest(req));
  }
});

export default router;
