import '../../loadenv';
import {Control, getControl} from "../script_util";
import { loadEnglishTextMap } from '../textmap';
import { closeKnex } from '../../util/db';
import { ChapterExcelConfigData, MainQuestExcelConfigData } from '../../../shared/types/quest-types';
import toposort from 'toposort';
import { sort } from '../../../shared/util/arrayUtil';
import { cached } from '../../util/cache';
import { pathToFileURL } from 'url';

export interface QuestOrderItem {
  quest: MainQuestExcelConfigData;
  subquests?: MainQuestExcelConfigData[];
}

export async function orderChapterQuests(ctrl: Control, chapter: ChapterExcelConfigData): Promise<QuestOrderItem[]> {
  if (!chapter) {
    return [];
  }
  const globalVarIds: number[] = await cached('GlobalVars', async () => {
    const globalVar: any[] = await ctrl.readGenshinDataFile('./ExcelBinOutput/QuestGlobalVarConfigData.json');
    return globalVar.map(x => x.Id);
  });

  let questsInChapter: MainQuestExcelConfigData[] = (await ctrl.selectMainQuestsByChapterId(chapter.Id)).filter(q => !!q.TitleText);
  let directingQuests = questsInChapter.filter(q => !!q.SuggestTrackMainQuestList);

  let graph: [number, number][] = [];
  let subquests: {[parentQuestId: number]: MainQuestExcelConfigData[]} = {};
  let subquestIds: number[] = [];

  //console.log('Chapter:', chapter.Type, chapter.Id, chapter.ChapterTitleText, 'First:', chapter.BeginQuestId, 'Last:', chapter.EndQuestId);

  for (let quest of directingQuests) {
    quest.__globalVarPos = globalVarIds.indexOf(quest.Id);
    //console.log(quest.Type, quest.Id, quest.TitleText, quest.SuggestTrackMainQuestList, quest.__globalVarPos, quest.SuggestTrackOutOfOrder);

    let parentQuestId: number = null;

    // if (quest.SuggestTrackMainQuestList.some(id => id < quest.Id) && quest.Id !== chapter.BeginQuestId) {
    //   parentQuestId = Math.min(... quest.SuggestTrackMainQuestList);
    //   console.info(`Parent of ${quest.Id} is ${parentQuestId}`);
    // }

    if (quest.SuggestTrackMainQuestList.length > 1) {
      let siblings = directingQuests.filter(q => q.SuggestTrackMainQuestList.includes(quest.Id));
      let siblingIdsCombined: Set<number> = new Set([quest.Id, quest.SuggestTrackMainQuestList, siblings.map(q => q.SuggestTrackMainQuestList)].flat(Infinity) as number[]);
      siblingIdsCombined.delete(quest.Id);
      siblings.forEach(q => siblingIdsCombined.delete(q.Id));
      if (siblingIdsCombined.size === 1) {
        parentQuestId = Array.from(siblingIdsCombined)[0];
        //console.info(`Parent of ${quest.Id} is ${parentQuestId}`);
      } else if (siblingIdsCombined.size > 1) {
        parentQuestId = Array.from(siblingIdsCombined)[0];
      } else {
        continue;
      }
    }

    if (!!parentQuestId) {
      if (!subquests[parentQuestId])
        subquests[parentQuestId] = [];
      subquests[parentQuestId].push(quest);
      subquestIds.push(quest.Id);
      continue;
    }

    for (let directedTo of quest.SuggestTrackMainQuestList) {
      graph.push([quest.Id, directedTo]);
    }
  }

  let directedQuests: MainQuestExcelConfigData[] = [];
  for (let id of toposort(graph)) {
    let quest = questsInChapter.find(q => q.Id === id);
    if (!quest) {
      quest = await ctrl.selectMainQuestById(id);
      if (!!quest.ChapterId && quest.ChapterId !== chapter.Id) {
        let otherChapter = await ctrl.selectChapterById(quest.ChapterId);
        if (otherChapter.ChapterNumText !== chapter.ChapterNumText) {
          continue;
        }
      }
    }
    directedQuests.push(quest);
  }

  let undirectedQuests = questsInChapter.filter(q => !directedQuests.some(q2 => q2.Id === q.Id) && !subquestIds.includes(q.Id));
  sort(undirectedQuests, '__globalVarPos', 'Id');

  let combinedOrder: MainQuestExcelConfigData[] = [].concat(... undirectedQuests, ... directedQuests);
  let result: QuestOrderItem[] = [];

  for (let quest of combinedOrder) {
    let item: QuestOrderItem = {quest}
    if (subquests[quest.Id]) {
      item.subquests = [];
      for (let subquest of subquests[quest.Id]) {
        item.subquests.push(subquest);
      }
    }
    result.push(item);
  }
  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    await loadEnglishTextMap();

    let ctrl: Control = getControl();

    // 3001  - Further Observation
    // 71043 - Perils in the Dark
    // 72242 - The Entrance to Tokoyo
    // 3007 - The Coming of the Sabzeruz Festival
    // 3016 - Like a Triumphant Hero
    // 3019 - The Missing Village Keepers
    // 3024 - Through the Predawn Night

    let mainQuest: MainQuestExcelConfigData = await ctrl.selectMainQuestById(3024);

    if (mainQuest.ChapterId) {
      let chapter = await ctrl.selectChapterById(mainQuest.ChapterId);

      console.log(await orderChapterQuests(ctrl, chapter));
    }

    await closeKnex();
  })();
}