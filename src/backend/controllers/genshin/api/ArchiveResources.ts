import { create, Request, Response, Router } from '../../../util/router';
import { getGenshinControl } from '../../../domain/genshin/genshinControl';
import { ReadableSearchView } from '../../../../shared/types/genshin/readable-types';
import { MaterialExcelConfigData } from '../../../../shared/types/genshin/material-types';
import { WeaponExcelConfigData } from '../../../../shared/types/genshin/weapon-types';
import { AchievementExcelConfigData } from '../../../../shared/types/genshin/achievement-types';

const router: Router = create();

router.restful('/readables/search', {
  get: async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);

    let readableSearchView: ReadableSearchView = await ctrl.searchReadableView(<string> req.query.text);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/genshin/archive/readable-search-results', {
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
    const ctrl = getGenshinControl(req);

    let materials: MaterialExcelConfigData[] = await ctrl.selectMaterialsBySearch(<string> req.query.text, ctrl.searchModeFlags);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/genshin/archive/material-search-results', {
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
    const ctrl = getGenshinControl(req);

    let weapons: WeaponExcelConfigData[] = await ctrl.selectWeaponsBySearch(<string> req.query.text, ctrl.searchModeFlags);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/genshin/archive/weapon-search-results', {
        weapons: weapons,
        searchText: <string> req.query.text
      });
    } else {
      return weapons;
    }
  }
});

router.restful('/achievements/search', {
  get: async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);

    let achievements: AchievementExcelConfigData[] = await ctrl.selectAchievementsBySearch(<string> req.query.text, ctrl.searchModeFlags);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/genshin/archive/achievement-search-results', {
        achievements: achievements,
        searchText: <string> req.query.text
      });
    } else {
      return achievements;
    }
  }
});

export default router;
