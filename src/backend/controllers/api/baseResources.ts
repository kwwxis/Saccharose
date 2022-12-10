import apiError from './error';
import { create, Router, Request, Response } from '../../util/router';
import { getControl } from '../../scripts/script_util';
import { DialogueSectionResult, questGenerate, QuestGenerateResult } from '../../scripts/dialogue/quest_generator';
import { ol_gen } from '../../scripts/OLgen/OLgen';
import { dialogueGenerate, dialogueGenerateByNpc, NpcDialogueResultMap } from '../../scripts/dialogue/basic_dialogue_generator';
import { reminderGenerate, reminderWikitext } from '../../scripts/dialogue/reminder_generator';
import { isInt, toInt } from '../../../shared/util/numberUtil';
import { CyclicValueReplacer, removeCyclicRefs, toBoolean } from '../../../shared/util/genericUtil';
import { MainQuestExcelConfigData } from '../../../shared/types/quest-types';
import { getIdFromVoFile, getTextMapItem } from '../../scripts/textmap';

const router: Router = create();

const GenericCyclicValueReplacer: CyclicValueReplacer = (k: string, v: any) => {
  if (typeof v === 'object' && v.Id) {
    return {
      __cyclicKey: k,
      __cyclicRef: v.Id
    };
  } else {
    return;
  }
}

router.restful('/ping', {
  get: async (req: Request, res: Response) => {
    return 'pong!';
  }
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
      locals.reward = result.reward;
      locals.reputation = result.reputation;
      locals.rewardInfobox = result.rewardInfobox;

      return res.render('partials/quests/quest-generate-result', locals);
    } else {
      return removeCyclicRefs(result, GenericCyclicValueReplacer);
    }
  }
});

router.restful('/OL/generate', {
  get: async (req: Request, res: Response) => {
    const ctrl = getControl(req);
    let result: string[] = await ol_gen(ctrl, <string> req.query.text, {
      hideTl: toBoolean(req.query.hideTl),
      hideRm: toBoolean(req.query.hideRm),
      addDefaultHidden: toBoolean(req.query.addDefaultHidden),
    });
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
      return removeCyclicRefs(result, GenericCyclicValueReplacer);
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
      return removeCyclicRefs(resultMap, GenericCyclicValueReplacer);
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

router.restful('/search-textmap', {
  get: async (req: Request, res: Response) => {
    const ctrl = getControl(req);

    const result = await ctrl.getTextMapMatches(ctrl.inputLangCode, <string> req.query.text, '-m 50'); // "-m" flag -> max count

    if (ctrl.inputLangCode !== ctrl.outputLangCode) {
      for (let textMapId of Object.keys(result)) {
        result[textMapId] = getTextMapItem(ctrl.outputLangCode, textMapId);
      }
    }

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/textmap-search-result', { result });
    } else {
      return result;
    }
  }
});

router.restful('/dialogue/vo-to-dialogue', {
  get: async (req: Request, res: Response) => {
    const ctrl = getControl(req);
    let input = (<string> req.query.text).trim();
    if (input.toLowerCase().includes('{{a|')) {
      input = /{{A\|(.*?)[|}]/.exec(input)[1].trim();
    }
    if (!input.toLowerCase().endsWith('.ogg')) {
      input += '.ogg';
    }
    input = input.replaceAll('_', ' ');
    input = input.replace('File:', '');

    let result = getIdFromVoFile(input);
    let type = result?.[0];
    let id = result?.[1];
    let text = '';

    if (type === 'Dialog') {
      let dialogue = await ctrl.selectSingleDialogExcelConfigData(id);
      text = await ctrl.generateDialogueWikiText([dialogue]);
    } else if (type === 'Reminder') {
      let reminder = await ctrl.selectReminderById(id);
      text = reminderWikitext(ctrl, reminder);
    }

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/dialogue/vo-to-dialogue-result', {
        type: type,
        id: id,
        text: text,
      });
    } else {
      return result;
    }
  }
});

export default router;
