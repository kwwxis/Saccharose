import '../../../loadenv';
import {GenshinControl, getGenshinControl} from "../genshinControl";
import { pathToFileURL } from 'url';
import util from 'util';
import { closeKnex } from '../../../util/db';
import { cleanEmpty, resolveObjectPath, sort } from '../../../../shared/util/arrayUtil';
import { DialogueSectionResult, talkConfigGenerate } from '../dialogue/dialogue_util';
import { TalkExcelConfigData } from '../../../../shared/types/genshin/dialogue-types';
import { mwParse } from '../../../../shared/mediawiki/mwParse';
import { MwParentNode, MwTemplateNode } from '../../../../shared/mediawiki/mwTypes';
import { isInt, isNumeric, toNumber } from '../../../../shared/util/numberUtil';
import { toBoolean } from '../../../../shared/util/genericUtil';
import JSON5 from 'json5';
import { evaluateCustomFormat } from '../../../util/fileFormatOptions';
import { AchievementExcelConfigData, AchievementGoalExcelConfigData } from '../../../../shared/types/genshin/achievement-types';
import { getLineNumberForLineText } from '../../../util/shellutil';
import { getGenshinDataFilePath } from '../../../loadenv';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ctrl = getGenshinControl();

  //console.log(await getLineNumberForLineText('2559502579', './TextMap/Plain/PlainTextMapEN_Hash.dat'));

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

  // const strJa = "吾輩は猫である。名前はたぬ__MCTMPL0__き。";
  // const segmenterJa = new Intl.Segmenter("ja-JP", { granularity: "word" });
  // const segments = segmenterJa.segment(strJa);
  // console.log(Array.from(segments).map(part => part.segment));


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

  // let ids = [
  //   3033,
  //   11027,
  //   11028,
  //   11029,
  //   13019,
  //   13027,
  //   13028,
  //   13033,
  //   19150,
  //   19151,
  //   19152,
  //   19153,
  //   19154,
  //   19155,
  //   19156,
  //   19157,
  //   19158,
  //   19159,
  //   19160,
  //   19161,
  //   19162,
  //   40100,
  //   40101,
  //   40102,
  //   40103,
  //   40104,
  //   40106,
  //   40121,
  //   73231,
  //   73232,
  //   73235,
  //   73238,
  //   73251,
  //   73252,
  //   73253,
  //   73254,
  //   73255,
  //   73256,
  //   73257,
  //   73266,
  //   73285,
  //   73294,
  //   73295,
  //   73296,
  //   73297,
  //   73307,
  //   73309,
  //   73310,
  //   73312,
  //   73314,
  //   73315,
  //   73316,
  //   73317,
  //   73318,
  //   73319,
  //   73320,
  //   73322,
  //   73329,
  //   73330,
  //   73332,
  //   73333,
  //   73334,
  //   73335,
  //   73339,
  //   73341,
  //   73342,
  //   73343,
  //   73344,
  //   73345,
  //   73346,
  //   73347,
  //   73349,
  //   73509,
  //   73510,
  //   73511,
  //   73512,
  //   73513,
  //   73514,
  //   73515,
  //   73516,
  //   73517,
  //   73518,
  //   73519,
  //   73520,
  //   73521,
  //   73522,
  //   73523,
  //   73524,
  //   73690,
  //   73691,
  //   73692,
  //   73693,
  //   73694,
  //   73695,
  //   73696,
  //   73697,
  //   73698,
  //   73699,
  //   73700,
  //   73701,
  //   73702
  // ];
  //
  // for (let id of ids) {
  //   let mq = await ctrl.selectMainQuestById(id);
  //   console.log(`${mq.Id} - ${mq.TitleText} (${mq.Type})`);
  // }

  await closeKnex();
}