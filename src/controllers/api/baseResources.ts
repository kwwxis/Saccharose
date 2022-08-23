import { create, Router, Request, Response, NextFunction } from '@router';
const router: Router = create();
import { validateHTML } from '@/util/html_validator';
import { MainQuestExcelConfigData } from '@types';
import { getControl } from '@/scripts/script_util';
import { questGenerate, QuestGenerateResult } from '@/scripts/dialogue/quest_generator';
import { ol_gen } from '@/scripts/OLgen/OLgen';
import { toBoolean, toInt } from '@functions';
import { getTextMapMatches } from '@/scripts/textMapFinder/text_map_finder';
import { dialogueGenerate } from '@/scripts/dialogue/basic_dialogue_generator';

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

    let mainQuests: MainQuestExcelConfigData[] = [];

    if (typeof questNameOrId === 'string') {
      let matches = await getTextMapMatches(questNameOrId);
      mainQuests = await ctrl.selectMainQuestsByName(Object.keys(matches).map(i => parseInt(i)));
    } else {
      mainQuests = [await ctrl.selectMainQuestById(questNameOrId)];
    }

    let result: {[id: number]: string} = {};
    for (let mainQuest of mainQuests) {
      result[mainQuest.Id] = mainQuest.TitleText;
    }

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/quests/quest-search-results', { searchResults: result });
    } else {
      return result;
    }
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

    let result: QuestGenerateResult = await questGenerate(param);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      let locals: any = {};

      locals.isResultPage = true;
      locals.questTitle = result.questTitle;
      locals.questId = result.questId;
      locals.npc = result.npc;
      locals.templateWikitext = result.templateWikitext;
      locals.questDescriptions = result.questDescriptions;
      locals.otherLanguagesWikitext = result.otherLanguagesWikitext;
      locals.dialogue = result.dialogue;

      return res.render('partials/quests/quest-generate-result', locals);
    } else {
      return result;
    }
  }
});

router.restful('/OL/generate', {
  get: async (req: Request, res: Response) => {
    let result: string = await ol_gen(<string> req.query.text, toBoolean(req.query.hideTl));
    return result;
  }
});

router.restful('/dialogue/single-branch-generate', {
  get: async (req: Request, res: Response) => {
    let result: {[id: number]: string} = await dialogueGenerate(<string> req.query.text);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/dialogue/single-branch-dialogue-generate-result', {
        result: result,
      });
    } else {
      return result;
    }
  }
});

export default router;
