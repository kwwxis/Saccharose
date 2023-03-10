import '../../loadenv';
import {Control, getControl, normText} from "../script_util";
import { pathToFileURL } from 'url';
import { loadEnglishTextMap } from '../textmap';
import util from 'util';
import { closeKnex } from '../../util/db';
import { cleanEmpty, resolveObjectPath, sort } from '../../../shared/util/arrayUtil';
import { talkConfigGenerate } from '../dialogue/basic_dialogue_generator';
import { DialogueSectionResult } from '../dialogue/dialogue_util';
import { TalkExcelConfigData } from '../../../shared/types/dialogue-types';
import { mwParse } from '../../../shared/mediawiki/mwParse';
import { MwParentNode, MwTemplateNode, MwWhiteSpace } from '../../../shared/mediawiki/mwTypes';
import { isInt, isNumeric, toNumber } from '../../../shared/util/numberUtil';
import { toBoolean } from '../../../shared/util/genericUtil';
import JSON5 from 'json5';
import { evaluateCustomFormat } from '../../util/fileFormatOptions';
import { AchievementExcelConfigData, AchievementGoalExcelConfigData } from '../../../shared/types/achievement-types';

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

  const strJa = "吾輩は猫である。名前はたぬ__MCTMPL0__き。";
  const segmenterJa = new Intl.Segmenter("ja-JP", { granularity: "word" });
  const segments = segmenterJa.segment(strJa);
  console.log(Array.from(segments).map(part => part.segment));


  // const mcParts = [];
  // let strEn = "Hello my name is {{MC|f=Lorem test|m=Ipsum test}} foobar test{{MC|m=hi|f=bye}}test.";
  // strEn = strEn.replaceAll(/\{\{MC\|.*?}}/g, s => {
  //   let i = mcParts.length;
  //   mcParts.push(s);
  //   return `__MCTMPL${i}__`;
  // })
  // const segmenterEn = new Intl.Segmenter("en-US", { granularity: "word" });
  //
  // const segments = segmenterEn.segment(strEn);
  // console.log(strEn);
  // console.log(mcParts);
  // console.log(Array.from(segments).map(part => part.segment));

  // const format = `Tutorial {PushTip.TitleText.EN}{{If|'My foobar <= Text' *= foo| {CurrentDetail.Index1based}|}}.png`;
  // const parsed = mwParse(format);
  // console.log(evaluateCustomFormat({DetailCount: 1, MyText: 'Foobar'}, parsed));


  // let testStr = `¡{{MC|m=Un|f=Una}} {{MC|m=aventurero|f=aventurera}} {{MC|m=foo|f=bar}} ejemplar!`;
  //
  // let regex = /\{\{MC\|m=(.*?)\|f=(.*?)}}(\s*)\{\{MC\|m=(.*?)\|f=(.*?)}}/;
  // while (regex.test(testStr)) {
  //   testStr = testStr.replace(regex, (s, maleText1, femaleText1, whitespace, maleText2, femaleText2) => {
  //     return `{{MC|m=${maleText1}${whitespace}${maleText2}|f=${femaleText1}${whitespace}${femaleText2}}}`;
  //   });
  // }
  // console.log(testStr);

  await closeKnex();
}