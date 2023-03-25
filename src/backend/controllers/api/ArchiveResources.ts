import { create, Request, Response, Router } from '../../util/router';
import { getControl } from '../../scripts/script_util';
import { ReadableSearchView } from '../../../shared/types/readable-types';
import { MaterialExcelConfigData } from '../../../shared/types/material-types';
import { WeaponExcelConfigData } from '../../../shared/types/weapon-types';

const router: Router = create();

router.restful('/readables/search', {
  get: async (req: Request, res: Response) => {
    const ctrl = getControl(req);

    let readableSearchView: ReadableSearchView = await ctrl.searchReadableView(<string> req.query.text);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/archive/readable-search-results', {
        searchView: readableSearchView,
        searchText: <string> req.query.text
      });
    } else {
      return readableSearchView;
    }
  }
});

router.restful('/items/search', {
  get: async (req: Request, res: Response) => {
    const ctrl = getControl(req);

    let materials: MaterialExcelConfigData[] = await ctrl.selectMaterialsBySearch(<string> req.query.text, ctrl.searchModeFlags);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/archive/material-search-results', {
        materials: materials,
        searchText: <string> req.query.text
      });
    } else {
      return materials;
    }
  }
});

router.restful('/weapons/search', {
  get: async (req: Request, res: Response) => {
    const ctrl = getControl(req);

    let weapons: WeaponExcelConfigData[] = await ctrl.selectWeaponsBySearch(<string> req.query.text, ctrl.searchModeFlags);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/archive/weapon-search-results', {
        weapons: weapons,
        searchText: <string> req.query.text
      });
    } else {
      return weapons;
    }
  }
});

export default router;
