import '../../loadenv';
import {Control, getControl} from "../script_util";
import { loadEnglishTextMap } from '../textmap';
import { closeKnex } from '../../util/db';
import { MainQuestExcelConfigData } from '../../../shared/types/quest-types';

if (require.main === module) {
  (async () => {
    await loadEnglishTextMap();

    let ctrl: Control = getControl();

    // 3001 - Further Observation
    // 71044 - Surreptitious Seven-Star Seal Sundering
    // 71043 - Perils in the Dark
    // 72170 - The Gourmet Supremos: The Deep Divers


    let mainQuest: MainQuestExcelConfigData = await ctrl.selectMainQuestById(71043);
    console.log(mainQuest);

    if (mainQuest.ChapterId) {
      let chapter = await ctrl.selectChapterById(mainQuest.ChapterId);
      console.log(chapter);

      let questsInChapter: MainQuestExcelConfigData[] = await ctrl.selectMainQuestsByChapterId(chapter.Id);
      console.log(questsInChapter);
    }


    await closeKnex();
  })();
}