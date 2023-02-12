import '../../loadenv';
import {Control, getControl, normText} from "../script_util";
import { pathToFileURL } from 'url';
import { loadEnglishTextMap } from '../textmap';
import util from 'util';
import { closeKnex } from '../../util/db';
import { cleanEmpty, resolveObjectPath, sort } from '../../../shared/util/arrayUtil';
import { AchievementExcelConfigData, AchievementGoalExcelConfigData } from '../../../shared/types/general-types';
import { talkConfigGenerate } from '../dialogue/basic_dialogue_generator';
import { DialogueSectionResult } from '../dialogue/dialogue_util';
import { TalkExcelConfigData } from '../../../shared/types/dialogue-types';
import { mwParse } from '../../../shared/mediawiki/mwParse';
import { MwParentNode, MwTemplateNode, MwWhiteSpace } from '../../../shared/mediawiki/mwTypes';
import { isInt, isNumeric, toNumber } from '../../../shared/util/numberUtil';
import { toBoolean } from '../../../shared/util/genericUtil';
import JSON5 from 'json5';
import { evaluateCustomFormat } from '../../util/fileFormatOptions';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await loadEnglishTextMap();

  const ctrl = getControl();

  /*
  let goals: AchievementGoalExcelConfigData[] = await ctrl.readGenshinDataFile('./ExcelBinOutput/AchievementGoalExcelConfigData.json');
  sort(goals, 'OrderId');

  let achievements: AchievementExcelConfigData[] = await ctrl.readGenshinDataFile('./ExcelBinOutput/AchievementExcelConfigData.json');
  sort(achievements, 'OrderId');

  for (let achievement of achievements) {
    if (!!achievement.GoalId) {
      continue;
    }
    console.log(achievement.TitleText, achievement.DescText);
  }
  */
  //
  // const logSect = (sect: DialogueSectionResult) => {
  //   console.log(sect.wikitext);
  //   if (sect.children) {
  //     for (let child of sect.children) {
  //       logSect(child);
  //     }
  //   }
  // }
  //
  // //let talks = await ctrl.selectTalkExcelConfigDataByQuestId(5066);
  // let talks: TalkExcelConfigData[] = await ctrl.knex.select('*').from('TalkExcelConfigData')
  //   .where(cleanEmpty({LoadType: 'TALK_GADGET'}));
  //
  // for (let talk of talks) {
  //   let sect = await talkConfigGenerate(ctrl, talk);
  //   logSect(sect);
  //   console.log('-'.repeat(100));
  // }

  // const str = "吾輩は猫である。名前はたぬき。";
  // const segmenterJa = new Intl.Segmenter("ja-JP", { granularity: "word" });
  //
  // const segments = segmenterJa.segment(str);
  // console.log(Array.from(segments));

  let result: string = '';
  const format = `Tutorial {PushTip.TitleText.EN}{{If|'My foobar <= Text' *= foo| {CurrentDetail.Index1based}|}}.png`;

  const parsed = mwParse(format);

  console.log(evaluateCustomFormat({DetailCount: 1, MyText: 'Foobar'}, parsed));

  await closeKnex();
}