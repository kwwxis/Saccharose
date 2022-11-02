import '../../setup';
import {Control, getControl} from "../script_util";
import {loadEnglishTextMap} from "../textmap";
import { closeKnex } from '@db';
import { ChapterExcelConfigData } from '@types';

if (require.main === module) {
  (async () => {
    await loadEnglishTextMap();
    let ctrl: Control = getControl();

    let map: {[type: string]: ChapterExcelConfigData[]} = {
      AQ: [],
      LQ: [],
      EQ: [],
      WQ: [],
    }

    let chapters = await ctrl.selectAllChapters();
    for (let chapter of chapters) {
      chapter.Quests = await ctrl.selectMainQuestsByChapterId(chapter.Id);
      let type = chapter.Quests[0].Type;
      map[type].push(chapter);
    }

    console.log(map);

    closeKnex();
  })();
}