import { create } from '../../../routing/router.ts';
import { GenshinControl, getGenshinControl } from '../../../domain/genshin/genshinControl.ts';
import { isInt, toInt } from '../../../../shared/util/numberUtil.ts';
import { questGenerate, QuestGenerateResult } from '../../../domain/genshin/dialogue/quest_generator.ts';
import { defaultMap, isset, removeCyclicRefs, toBoolean } from '../../../../shared/util/genericUtil.ts';
import { HttpError } from '../../../../shared/util/httpError.ts';
import {
  dialogueGenerate,
  dialogueGenerateByNpc,
  NpcDialogueResultSet,
} from '../../../domain/genshin/dialogue/basic_dialogue_generator.ts';
import { reminderGenerate, reminderWikitext } from '../../../domain/genshin/dialogue/reminder_generator.ts';
import { ApiCyclicValueReplacer } from '../../../middleware/api/apiCyclicValueReplacer.ts';
import { Request, Response, Router } from 'express';
import { DialogueSectionResult } from '../../../util/dialogueSectionResult.ts';
import GenshinQuestSearchResults from '../../../components/genshin/quests/GenshinQuestSearchResults.vue';
import { GameVersions } from '../../../../shared/types/game-versions.ts';
import { sort } from '../../../../shared/util/arrayUtil.ts';
import VoToDialogueResult from '../../../components/genshin/dialogue/results/VoToDialogueResult.vue';
import SingleBranchDialogueResult from '../../../components/genshin/dialogue/results/SingleBranchDialogueResult.vue';
import NpcDialogueResultTemplate from '../../../components/genshin/dialogue/results/NpcDialogueResultTemplate.vue';
import QuestGenerateResultTemplate from '../../../components/genshin/dialogue/results/QuestGenerateResultTemplate.vue';

const router: Router = create();

router.endpoint('/quests/findMainQuest', {
  get: async (req: Request, res: Response) => {
    let query: string|number = (req.query.query || req.query.name || req.query.id) as string|number;

    if (!isset(query)) {
      throw HttpError.badRequest('InvalidParameter', 'The "query" query parameter must be given');
    }

    if (typeof query === 'string' && isInt(query.trim())) {
      query = toInt(query);
    }

    const ctrl = getGenshinControl(req);

    const { mainQuests, chapters } = await ctrl.searchMainQuestsAndChapters(query);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      await res.renderComponent(GenshinQuestSearchResults, {
        mainQuests,
        chapters
      });
    } else {
      return {
        mainQuests,
        chapters
      };
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
      await res.renderComponent(QuestGenerateResultTemplate, {
        result
      });
      return;
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

async function inDialogueReadablesHelper(ctrl: GenshinControl) {
  const inDialogueReadablesMainQuestNames: {[mainQuestId: number]: string} = {};

  for (let mainQuestId of Object.keys(ctrl.state.inDialogueReadables)) {
    inDialogueReadablesMainQuestNames[mainQuestId] = await ctrl.selectMainQuestName(toInt(mainQuestId));
  }

  return {
    inDialogueReadables: ctrl.state.inDialogueReadables,
    inDialogueReadablesMainQuestNames
  }
}

router.endpoint('/dialogue/single-branch-generate', {
  get: async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const query = (req.query.text as string)?.trim();

    if (query.toLowerCase() === 'paimon') {
      throw HttpError.badRequest('UnsupportedOperation', 'Unfortunately, you cannot search for just "Paimon" as the operation would be too intensive.');
    }

    const versionFilter: GameVersions = ctrl.gameVersions.where(v => v.showTextmapChangelog).fromFilterString(req.query.versionFilter);

    let result: DialogueSectionResult[] = await dialogueGenerate(ctrl, {
      query,
      versionFilter,
      npcFilter: req.query.npcFilter as string,
      voicedOnly: toBoolean(req.query.voicedOnly)
    });

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      await res.renderComponent(SingleBranchDialogueResult, {
        sections: result,
        query,
        ... await questStillsHelper(ctrl),
        ... await inDialogueReadablesHelper(ctrl),
        langSuggest: result.length ? null : await ctrl.langSuggest(query)
      });
      return;
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
      await res.renderComponent(NpcDialogueResultTemplate, {
        resultSet: resultSet,
        ... await questStillsHelper(ctrl),
        ... await inDialogueReadablesHelper(ctrl),
      });
      return;
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
      await res.renderComponent(SingleBranchDialogueResult, {
        sections: result,
        query,
        langSuggest: result.length ? null : await ctrl.langSuggest(query),
        questsStillsByMainQuest: null,
        questsStillsMainQuestNames: null,
        inDialogueReadables: null,
        inDialogueReadablesMainQuestNames: null,
      });
      return;
    } else {
      return result;
    }
  }
});

export type VoToDialogueEntry = {id: number, voFile: string, type: string, text: string, warn?: string, file: string};

router.endpoint('/dialogue/vo-to-dialogue', {
  post: async (req: Request, res: Response) => {
    const ctrl: GenshinControl = getGenshinControl(req);

    const inputs: (string|RegExp)[] = ((req.body.text || req.query.text || '') as string).trim()
      .split(/\n/g)
      .map(s => s.trim())
      .filter(s => !!s)
      .map(input => {
        if (input.startsWith('/') && input.endsWith('/') && input.length >= 3) {
          return new RegExp(input.slice(1, -1));
        }
        if (input.toLowerCase().includes('{{a|')) {
          input = /{{A\|(.*?)[|}]/.exec(input)[1].trim();
        }
        if (!input.toLowerCase().endsWith('.ogg')) {
          input += '.ogg';
        }
        input = input.replaceAll('_', ' ');
        input = input.replace('File:', '');
        return input;
      });

    const results: VoToDialogueEntry[] = [];
    const talkResultsMap: Record<string, {talkId: string, results: VoToDialogueEntry[]}> = defaultMap(
      talkId => ({talkId, results: []}));

    for (let [input, result] of Object.entries(ctrl.voice.getVoiceItemsByFiles(inputs))) {
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
        if (dialogue && dialogue.TalkId) {
          talkResultsMap[dialogue.TalkId].results.push({ id, voFile: input, type, text, warn, file: input });
        } else {
          results.push({ id, voFile: input, type, text, warn, file: input });
        }
      } else if (type === 'DungeonReminder') {
        let reminder = await ctrl.selectReminderById(id);
        if (reminder) {
          text = reminderWikitext(ctrl, reminder).wikitext;
        } else {
          warn = '(This VO file is supposed to be used for a reminder with ' + id + ', however such a reminder does not exist)';
        }
        results.push({ id, voFile: input, type, text, warn, file: input });
      } else {
        results.push({ id, voFile: input, type, text, warn, file: input });
      }
    }

    const talkResults = Object.values(talkResultsMap);
    let talkResultsCount = 0;

    sort(results, 'type', 'id');
    for (let talkResult of talkResults) {
      sort(talkResult.results, 'type', 'id');
      talkResultsCount += talkResult.results.length;
    }

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      await res.renderComponent(VoToDialogueResult, { results, talkResults, talkResultsCount });
      return;
    } else {
      return {
        results,
        talkResults,
        talkResultsCount
      };
    }
  }
});

export default router;
