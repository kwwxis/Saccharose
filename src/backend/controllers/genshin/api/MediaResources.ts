import { create } from '../../../routing/router.ts';
import { Request, Response, Router } from 'express';
import { getGenshinControl } from '../../../domain/genshin/genshinControl.ts';

const router: Router = create();

router.endpoint('/media/search', {
  get: async (req: Request, _res: Response) => {
    const ctrl = getGenshinControl(req);
    return ctrl.searchImageIndex(ctrl.buildImageIndexSearchParamsFromRequest(req));
  }
});

router.endpoint('/media/category', {
  get: async (req: Request, _res: Response) => {
    const ctrl = getGenshinControl(req);
    return await ctrl.listImageCategories();
  }
});

router.endpoint('/media/post-create-image-index-job', {
  post: async (req: Request, _res: Response) => {
    const ctrl = getGenshinControl(req);
    return ctrl.postCreateImageIndexArchiveJob(ctrl.buildImageIndexSearchParamsFromRequest(req));
  }
});

export default router;
