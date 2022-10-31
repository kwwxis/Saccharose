import { create, Router, Request, Response, NextFunction } from '@router';
const router: Router = create();
import { validateHTML } from '@/util/html_validator';
import { MainQuestExcelConfigData } from '@types';
import { getControl } from '@/scripts/script_util';
import { DialogueSectionResult, questGenerate, QuestGenerateResult } from '@/scripts/dialogue/quest_generator';
import { ol_gen } from '@/scripts/OLgen/OLgen';
import { isInt, toBoolean, toInt } from '@functions';
import { dialogueGenerate, dialogueGenerateByNpc, NpcDialogueResultMap } from '@/scripts/dialogue/basic_dialogue_generator';
import apiError from '@apiError';
import { reminderGenerate } from '@/scripts/dialogue/reminder_generator';

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

    if (typeof questNameOrId === 'string' && /^\d+$/.test(questNameOrId.trim())) {
      questNameOrId = parseInt(questNameOrId);
    }

    const ctrl = getControl(req);

    let mainQuests: MainQuestExcelConfigData[] = await ctrl.selectMainQuestsByNameOrId(questNameOrId);

    let result: {[id: number]: string} = {};
    for (let mainQuest of mainQuests) {
      if (!mainQuest || !mainQuest.Id)
        continue;
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

    const ctrl = getControl(req);
    let result: QuestGenerateResult = await questGenerate(param, ctrl);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      let locals: any = {};

      locals.isResultPage = true;
      locals.questTitle = result.questTitle;
      locals.questId = result.questId;
      locals.npc = result.npc;
      locals.stepsWikitext = result.stepsWikitext;
      locals.questDescriptions = result.questDescriptions;
      locals.otherLanguagesWikitext = result.otherLanguagesWikitext;
      locals.dialogue = result.dialogue;
      locals.travelLogSummary = result.travelLogSummary;
      locals.cutscenes = result.cutscenes;

      return res.render('partials/quests/quest-generate-result', locals);
    } else {
      return result;
    }
  }
});

router.restful('/OL/generate', {
  get: async (req: Request, res: Response) => {
    const ctrl = getControl(req);
    let result: string[] = await ol_gen(ctrl, <string> req.query.text, toBoolean(req.query.hideTl), toBoolean(req.query.addDefaultHidden));
    if (!result) {
      throw apiError(req.query.text, 'NOT_FOUND');
    }

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/ol-result', { olResults: result, searchText: <string> req.query.text });
    } else {
      return result;
    }
  }
});

router.restful('/dialogue/single-branch-generate', {
  get: async (req: Request, res: Response) => {
    const ctrl = getControl(req);
    let result: DialogueSectionResult[] = await dialogueGenerate(ctrl, <string> req.query.text, <string> req.query.npcFilter);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/dialogue/single-branch-dialogue-generate-result', {
        sections: result,
      });
    } else {
      return result;
    }
  }
});

router.restful('/dialogue/npc-dialogue-generate', {
  get: async (req: Request, res: Response) => {
    const ctrl = getControl(req);
    const query = (<string> req.query.name).trim();

    switch (query.toLowerCase()) {
      case 'paimon':
      case '1005':
        throw apiError('Unfortunately, NPC dialogue generator does not support Paimon (id: 1005). The opperation would be too intensive.', 'UNSUPPORTED_OPERATION');
      case '???':
        throw apiError('Unfortunately, NPC dialogue generator does not support search for "???"', 'UNSUPPORTED_OPERATION');
    }

    let resultMap: NpcDialogueResultMap = await dialogueGenerateByNpc(ctrl, query);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/dialogue/npc-dialogue-result', {
        resultMap: resultMap,
      });
    } else {
      return resultMap;
    }
  }
});

router.restful('/dialogue/reminder-dialogue-generate', {
  get: async (req: Request, res: Response) => {
    const ctrl = getControl(req);
    let subsequentAmount = 0;
    if (isInt(req.query.subsequentAmount)) {
      subsequentAmount = toInt(req.query.subsequentAmount);
    }

    let result: DialogueSectionResult[] = await reminderGenerate(ctrl, <string> req.query.text, subsequentAmount);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/dialogue/single-branch-dialogue-generate-result', {
        sections: result,
      });
    } else {
      return result;
    }
  }
});

export default router;
