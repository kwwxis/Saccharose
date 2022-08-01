import { create, Router, Request, Response, NextFunction } from '@router';
const router: Router = create();
import { validateHTML } from '@/util/html_validator';
import { MainQuestExcelConfigData } from '@types';
import { getControl } from '@/scripts/script_util';
import { questGenerate } from '@/scripts/dialogue/quest_generator';
import { ol_gen } from '@/scripts/OLgen/OLgen';
import { toBoolean, toInt } from '@functions';

router.restful('/ping', {
  get: async (req: Request, res: Response) => {
    return 'pong!';
  }
});

router.restful('/validate-html', {
  get: async (req: Request, res: Response) => validateHTML(String(req.query.snippet || req.query.html || '')),
  post: async (req: Request, res: Response) => validateHTML(String(req.body.snippet || req.body.html || '')),
});

router.restful('/quests/findMainQuest', {
  get: async (req: Request, res: Response) => {
    let questNameOrId: string|number = <string|number> (req.query.name || req.query.id);

    if (typeof questNameOrId === 'string' && /^\d+$/.test(questNameOrId)) {
      questNameOrId = parseInt(questNameOrId);
    }

    const ctrl = getControl();

    console.log('FindMainQuest:', questNameOrId);

    const mainQuests: MainQuestExcelConfigData[] = typeof questNameOrId === 'string'
      ? await ctrl.selectMainQuestsByName(questNameOrId.trim())
      : [await ctrl.selectMainQuestById(questNameOrId)];

    let result = {};
    for (let mainQuest of mainQuests) {
      result[mainQuest.Id] = mainQuest.TitleText;
    }
    console.log('FindMainQuest Result:', result);

    return result;
  }
});

router.restful('/quests/generate', {
  get: async (req: Request, res: Response) => {
    let param: number|string;

    if (req.query.id) {
      param = toInt(req.query.id);
    } else if (req.query.name) {
      param = String(req.query.name);
    }

    let result = await questGenerate(param);
    return result;
  }
});

router.restful('/OL/generate', {
  get: async (req: Request, res: Response) => {
    let result: string = await ol_gen(<string> req.query.text, toBoolean(req.query.hideTl));
    return result;
  }
});

export default router;
