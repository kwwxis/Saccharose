import '../../loadenv';
import {Control, getControl} from "../script_util";
import {loadEnglishTextMap} from "../textmap";
import { closeKnex } from '../../util/db';
import { ChapterExcelConfigData, MapByQuestType, QuestType } from '../../util/types';

if (require.main === module) {
  (async () => {
    await loadEnglishTextMap();
    let ctrl: Control = getControl();

    let map: MapByQuestType<ChapterExcelConfigData[]> = {
      AQ: [],
      SQ: [],
      EQ: [],
      WQ: [],
    };

    let chapters = await ctrl.selectAllChapters();
    for (let chapter of chapters) {
      if (!chapter.Type) {
        continue;
      }
      map[chapter.Type].push(chapter);
    }

    console.log(map);

    closeKnex();
  })();
}