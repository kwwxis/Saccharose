import '../../setup';
import {Control, getControl, grep, normText} from "../script_util";
import {promises as fs} from 'fs';
import config from '@/config';
import { getTextMapItem, loadTextMaps } from '../textmap';
import { closeKnex } from '@db';

if (require.main === module) {
  (async () => {
    await loadTextMaps();
    let ctrl: Control = getControl();

    let data = await fs.readFile(config.database.getGenshinDataFilePath('./ExcelBinOutput/InvestigationMonsterConfigData.json'), {encoding: 'utf8'}).then(data => {
      return Object.freeze(JSON.parse(data));
    });

    let out: any[] = [];

    for (let record of data) {
      let lockQuests = {};
      for (let mainQuestId of record.GDNHNDNEEKH) {
        lockQuests[mainQuestId] = (await ctrl.selectMainQuestById(mainQuestId)).TitleText;
      }
      if (!Object.keys(lockQuests).length) {
        lockQuests = null;
      }

      let lockChapters = {};
      for (let chapterId of record.NIBFGMJAJEG) {
        let chapter = await ctrl.selectChapterById(chapterId);
        lockChapters[chapterId] = chapter.ChapterTitleText;
      }
      if (!Object.keys(lockChapters).length) {
        lockChapters = null;
      }

      let playerLevel = null;
      if (record.mapMarkCreateType === 'ExtraConditions' && record.mapMarkCreateCondition.conditionType === 'PlayerLevelGE') {
        playerLevel = record.mapMarkCreateCondition.conditionParam;
      }

      let entry = {
        name: getTextMapItem('EN', record.nameTextMapHash),
        category: record.monsterCategory,
        desc: normText(getTextMapItem('EN', record.descTextMapHash)),
        lockDesc: normText(getTextMapItem('EN', record.lockDescTextMapHash)),
        lockChapters: lockChapters,
        lockQuests: lockQuests,
        lockStep: normText(getTextMapItem('EN', record.DKNOHFKPCOE)),
        mapMarkPlayerLevel: playerLevel,
      };

      for (let field of Object.keys(entry)) {
        if (!entry[field]) {
          delete entry[field];
        }
      }

      out.push(entry);
    }

    console.log(JSON.stringify(out, null, 2));

    closeKnex();
  })();
}