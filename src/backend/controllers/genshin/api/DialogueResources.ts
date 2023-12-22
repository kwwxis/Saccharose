import { create } from '../../../routing/router';
import { GenshinControl, getGenshinControl } from '../../../domain/genshin/genshinControl';
import { MainQuestExcelConfigData } from '../../../../shared/types/genshin/quest-types';
import { isInt, toInt } from '../../../../shared/util/numberUtil';
import { questGenerate, QuestGenerateResult } from '../../../domain/genshin/dialogue/quest_generator';
import { isset, removeCyclicRefs } from '../../../../shared/util/genericUtil';
import { HttpError } from '../../../../shared/util/httpError';
import { DialogueSectionResult } from '../../../domain/genshin/dialogue/dialogue_util';
import {
  dialogueGenerate,
  dialogueGenerateByNpc,
  NpcDialogueResultSet,
} from '../../../domain/genshin/dialogue/basic_dialogue_generator';
import { reminderGenerate, reminderWikitext } from '../../../domain/genshin/dialogue/reminder_generator';
import { ApiCyclicValueReplacer } from '../../../middleware/api/apiCyclicValueReplacer';
import { VoiceItem } from '../../../../shared/types/lang-types';
import { Request, Response, Router } from 'express';

const router: Router = create();

router.endpoint('/quests/findMainQuest', {
  get: async (req: Request, res: Response) => {
    let questNameOrId: string|number = (req.query.name || req.query.id) as string|number;

    if (!isset(questNameOrId)) {
      throw HttpError.badRequest('InvalidParameter', 'The "name" or "id" query parameter must be given');
    }

    if (typeof questNameOrId === 'string' && /^\d+$/.test(questNameOrId.trim())) {
      questNameOrId = parseInt(questNameOrId);
    }

    const ctrl = getGenshinControl(req);

    let mainQuests: MainQuestExcelConfigData[] = await ctrl.selectMainQuestsByNameOrId(questNameOrId);

    let result: {[id: number]: string} = {};
    for (let mainQuest of mainQuests) {
      if (!mainQuest || !mainQuest.Id)
        continue;
      result[mainQuest.Id] = mainQuest.TitleText;
    }

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/genshin/dialogue/quest-search-results', { searchResults: result });
    } else {
      return result;
    }
  }
});

router.endpoint('/quests/generate', {
  get: async (req: Request, res: Response) => {
    let param: number|string;

    if (req.query.id) {
      param = toInt(req.query.id);
    } else if (req.query.name) {
      param = String(req.query.name);
    }

    const ctrl = getGenshinControl(req);
    let result: QuestGenerateResult = await questGenerate(param, ctrl);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      let locals: any = {};

      locals.isResultPage = true;
      locals.questTitle = result.questTitle;
      locals.questId = result.questId;
      locals.npc = result.npc;
      locals.npcStrList = result.npc ? result.npc.names.join('; ') : '';
      locals.stepsWikitext = result.stepsWikitext;
      locals.questDescriptions = result.questDescriptions;
      locals.otherLanguagesWikitext = result.otherLanguagesWikitext;
      locals.dialogue = result.dialogue;
      locals.cutscenes = result.cutscenes;
      locals.reward = result.reward;
      locals.reputation = result.reputation;
      locals.rewardInfobox = result.rewardInfobox;
      locals.similarityGroups = result.similarityGroups;
      locals.questStills = result.questStills;

      return res.render('partials/genshin/dialogue/quest-generate-result', locals);
    } else {
      return removeCyclicRefs(result, ApiCyclicValueReplacer);
    }
  }
});

async function questStillsHelper(ctrl: GenshinControl) {
  const questsStillsByMainQuest = ctrl.state.questStills;
  const questsStillsMainQuestNames: {[mainQuestId: number]: string} = {};
  if (questsStillsByMainQuest) {
    for (let mainQuestId of Object.keys(questsStillsByMainQuest)) {
      questsStillsMainQuestNames[mainQuestId] = await ctrl.selectMainQuestName(toInt(mainQuestId));
    }
  }
  return {questsStillsByMainQuest, questsStillsMainQuestNames};
}

router.endpoint('/dialogue/single-branch-generate', {
  get: async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const query = (req.query.text as string)?.trim();

    if (query.toLowerCase() === 'paimon') {
      throw HttpError.badRequest('UnsupportedOperation', 'Unfortunately, you cannot search for just "Paimon" as the operation would be too intensive.');
    }

    let result: DialogueSectionResult[] = await dialogueGenerate(ctrl, query, req.query.npcFilter as string);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/genshin/dialogue/single-branch-dialogue-generate-result', {
        sections: result,
        query,
        ... await questStillsHelper(ctrl),
        langSuggest: result.length ? null : ctrl.langSuggest(query)
      });
    } else {
      return removeCyclicRefs(result, ApiCyclicValueReplacer);
    }
  }
});

router.endpoint('/dialogue/npc-dialogue-generate', {
  get: async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const query = (req.query.name as string)?.trim();

    switch (query.toLowerCase()) {
      case 'paimon':
      case '1005':
        throw HttpError.badRequest('UnsupportedOperation', 'Unfortunately the NPC Dialogue generator does not support Paimon (id: 1005). The operation would be too intensive.');
      case '???':
        throw HttpError.badRequest('UnsupportedOperation', 'Unfortunately the NPC Dialogue generator does not support search for "???"');
    }

    let resultSet: NpcDialogueResultSet = await dialogueGenerateByNpc(ctrl, query);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/genshin/dialogue/npc-dialogue-result', {
        resultMap: resultSet.resultMap,
        reminders: resultSet.reminders,
        ... await questStillsHelper(ctrl),
      });
    } else {
      return removeCyclicRefs(resultSet, ApiCyclicValueReplacer);
    }
  }
});

router.endpoint('/dialogue/reminder-dialogue-generate', {
  get: async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    let subsequentAmount = 0;
    if (isInt(req.query.subsequentAmount)) {
      subsequentAmount = toInt(req.query.subsequentAmount);
    }

    const query = (req.query.text as string)?.trim();
    let result: DialogueSectionResult[] = await reminderGenerate(ctrl, query, subsequentAmount);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/genshin/dialogue/single-branch-dialogue-generate-result', {
        sections: result,
        query,
        langSuggest: result.length ? null : ctrl.langSuggest(query),
        questsStillsByMainQuest: null,
        questsStillsMainQuestNames: null
      });
    } else {
      return result;
    }
  }
});

router.endpoint('/dialogue/vo-to-dialogue', {
  get: async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const inputs: string[] = (req.query.text as string).trim().split(/\n/g).map(s => s.trim()).filter(s => !!s);
    const results: {id: number, voFile: string, type: string, text: string, warn?: string, file: string}[] = [];

    for (let input of inputs) {
      if (input.toLowerCase().includes('{{a|')) {
        input = /{{A\|(.*?)[|}]/.exec(input)[1].trim();
      }
      if (!input.toLowerCase().endsWith('.ogg')) {
        input += '.ogg';
      }
      input = input.replaceAll('_', ' ');
      input = input.replace('File:', '');

      let result: VoiceItem = ctrl.voice.getVoiceItemByFile(input);
      let type = result?.type;
      let id = result?.id;
      let text = '';
      let warn = '';

      if (type === 'Dialog') {
        let dialogue = await ctrl.selectSingleDialogExcelConfigData(id);
        if (dialogue) {
          text = (await ctrl.generateDialogueWikitext([dialogue])).wikitext;
        } else {
          warn = '(This VO file is supposed to be used for a dialog with ID ' + id + ', however such a dialog does not exist)';
        }
      } else if (type === 'DungeonReminder') {
        let reminder = await ctrl.selectReminderById(id);
        if (reminder) {
          text = reminderWikitext(ctrl, reminder);
        } else {
          warn = '(This VO file is supposed to be used for a reminder with ' + id + ', however such a reminder does not exist)';
        }
      }

      results.push({ id, voFile: input, type, text, warn, file: input });
    }

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/genshin/dialogue/vo-to-dialogue-result', { results });
    } else {
      return results;
    }
  }
});

export default router;
