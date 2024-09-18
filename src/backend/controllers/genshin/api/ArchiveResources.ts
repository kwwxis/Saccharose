import { create } from '../../../routing/router.ts';
import { getGenshinControl } from '../../../domain/genshin/genshinControl.ts';
import { ReadableSearchResult } from '../../../../shared/types/genshin/readable-types.ts';
import { MaterialExcelConfigData } from '../../../../shared/types/genshin/material-types.ts';
import { WeaponExcelConfigData } from '../../../../shared/types/genshin/weapon-types.ts';
import { AchievementExcelConfigData } from '../../../../shared/types/genshin/achievement-types.ts';
import { Request, Response, Router } from 'express';
import {
  searchTutorials,
  selectTutorials, TUTORIAL_DEFAULT_FILE_FORMAT_IMAGE,
  TUTORIAL_FILE_FORMAT_PARAMS,
} from '../../../domain/genshin/archive/tutorials.ts';
import AchievementSearchResult from '../../../components/genshin/achievements/AchievementSearchResult.vue';
import TutorialList from '../../../components/genshin/tutorials/TutorialList.vue';

const router: Router = create();

router.endpoint('/readables/search', {
  get: async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);

    let searchView: ReadableSearchResult = await ctrl.searchReadables(req.query.text as string);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/genshin/archive/readable-search-results', {
        searchView: searchView,
        searchText: req.query.text as string
      });
    } else {
      return searchView;
    }
  }
});

router.endpoint('/items/search', {
  get: async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);

    let materials: MaterialExcelConfigData[] = await ctrl.selectMaterialsBySearch(req.query.text as string, ctrl.searchModeFlags);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/genshin/archive/material-search-results', {
        materials: materials,
        searchText: req.query.text as string
      });
    } else {
      return materials;
    }
  }
});

router.endpoint('/weapons/search', {
  get: async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);

    let weapons: WeaponExcelConfigData[] = await ctrl.selectWeaponsBySearch(req.query.text as string, ctrl.searchModeFlags);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/genshin/archive/weapon-search-results', {
        weapons: weapons,
        searchText: req.query.text as string
      });
    } else {
      return weapons;
    }
  }
});

router.endpoint('/achievements/search', {
  get: async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);

    let achievements: AchievementExcelConfigData[] = await ctrl.selectAchievementsBySearch(req.query.text as string, ctrl.searchModeFlags);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render(AchievementSearchResult, {
        achievements: achievements,
        searchText: req.query.text as string
      });
    } else {
      return achievements;
    }
  }
});

router.endpoint('/tutorials/search', {
  get: async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);

    let tutorialIds: number[] = await searchTutorials(ctrl, req.query.text as string);
    let tutorialsByType = await selectTutorials(ctrl, null, tutorialIds, req.query.text as string);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render(TutorialList, {
        tutorialsByType,
        fileFormatParams: TUTORIAL_FILE_FORMAT_PARAMS.join(','),
        fileFormatDefault_image: TUTORIAL_DEFAULT_FILE_FORMAT_IMAGE,
        searchText: req.query.text as string
      });
    } else {
      return tutorialsByType;
    }
  }
});

export default router;
