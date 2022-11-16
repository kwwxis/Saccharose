import '../../loadenv';
import {Control, getControl, normText} from "../script_util";
import {promises as fs} from 'fs';
import config from '../../config';
import { loadEnglishTextMap } from '../textmap';
import { closeKnex } from '../../util/db';
import { MainQuestExcelConfigData } from '../../util/types';

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


    closeKnex();
  })();
}