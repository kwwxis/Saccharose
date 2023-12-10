import { create } from '../../../routing/router';
import { getGenshinControl } from '../../../domain/genshin/genshinControl';
import { ReadableSearchView } from '../../../../shared/types/genshin/readable-types';
import { MaterialExcelConfigData } from '../../../../shared/types/genshin/material-types';
import { WeaponExcelConfigData } from '../../../../shared/types/genshin/weapon-types';
import { AchievementExcelConfigData } from '../../../../shared/types/genshin/achievement-types';
import { Request, Response, Router } from 'express';
import {
  pushTipCodexTypeName,
  searchTutorials,
  selectTutorials, TUTORIAL_DEFAULT_FILE_FORMAT_IMAGE,
  TUTORIAL_FILE_FORMAT_PARAMS,
} from '../../../domain/genshin/archive/tutorials';

const router: Router = create();

router.endpoint('/readables/search', {
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

router.endpoint('/items/search', {
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

router.endpoint('/weapons/search', {
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

router.endpoint('/achievements/search', {
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

router.endpoint('/tutorials/search', {
  get: async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);

    let tutorialIds: number[] = await searchTutorials(ctrl, <string> req.query.text);
    let tutorialsByType = await selectTutorials(ctrl, null, tutorialIds, <string> req.query.text);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/genshin/archive/tutorial-list', {
        tutorialsByType,
        fileFormatParams: TUTORIAL_FILE_FORMAT_PARAMS.join(','),
        fileFormatDefault_image: TUTORIAL_DEFAULT_FILE_FORMAT_IMAGE,
        searchText: <string> req.query.text
      });
    } else {
      return tutorialsByType;
    }
  }
});

export default router;
