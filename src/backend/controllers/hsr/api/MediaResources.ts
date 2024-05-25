import { create } from '../../../routing/router.ts';
import { isInt, toInt } from '../../../../shared/util/numberUtil.ts';
import { Request, Response, Router } from 'express';
import { SearchMode } from '../../../../shared/util/searchUtil.ts';
import { toBoolean } from '../../../../shared/util/genericUtil.ts';
import { getStarRailControl } from '../../../domain/hsr/starRailControl.ts';

const router: Router = create();

router.endpoint('/media/search', {
  get: async (req: Request, res: Response) => {
    const ctrl = getStarRailControl(req);

    return await ctrl.searchImageIndex(
      {
        query: (req.query.query || '') as string,
        cat1: req.query.cat1 as string,
        cat2: req.query.cat2 as string,
        cat3: req.query.cat3 as string,
        cat4: req.query.cat4 as string,
        cat5: req.query.cat5 as string,
        catPath: req.query.catPath as string,
        catRestrict: toBoolean(req.query.catRestrict),
        offset: isInt(req.query.offset) ? toInt(req.query.offset) : 0
      },
      req.query.searchMode ? (String(req.query.searchMode) as SearchMode) : ctrl.searchMode
    );
  }
});


router.endpoint('/media/category', {
  get: async (req: Request, res: Response) => {
    const ctrl = getStarRailControl(req);
    return await ctrl.listImageCategories();
  }
});

export default router;
