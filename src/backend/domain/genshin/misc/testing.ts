import '../../../loadenv';
import { GenshinControl, getGenshinControl, loadGenshinVoiceItems } from '../genshinControl';
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
import { uuidv4 } from '../../../../shared/util/uuidv4';
import { loadGenshinTextSupportingData } from '../genshinText';
import { getQuotePosMap } from '../../../../shared/mediawiki/mwQuotes';
import { keys } from 'ag-grid-community/dist/lib/utils/map';
import fs from 'fs';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await loadGenshinVoiceItems();
  await loadGenshinTextSupportingData();

  const ctrl = getGenshinControl();

  // getQuotePos(`<br /><br />'''Escudo de Jade'''<br />Da '''2 pontos de '''Escudo''' blah blah blah foobar ''' asdf`, 10);
  // console.log();
  //
  // getQuotePos(`<br /><br />'''Escudo de Jade'''<br />Da '''2 pontos de '''Escudo''' blah blah blah foobar ''`, 10);
  // console.log();
  //
  // getQuotePos(`<br /><br />'''Escudo de Jade'''<br />Da '''2 pontos de '''Escudo''' blah blah blah foobar '`, 10);
  // console.log();

  // let map = getQuotePosMap(
  //   `'''bold''`
  //   //`<br /><br />'''Escudo de Jade'''<br />Da '''2 pontos de '''Escudo''' blah blah blah foobar '`
  //   //`'''Estela de Pedra'''<br />'''Fase Final: '''Causa 1 ''ponto'' de {{Geo|Dano Geo}}.<br />'''Usos: 2'''1`
  //   //`'''Estela de Pedra'''<br />'''Fase Final: '''Causa 1 ponto de {{Geo|Dano Geo}}.<br />'''Usos: 2'''<br /><br />'''Escudo de Jade'''<br />Da '''2 pontos de '''Escudo'''''' asdf`
  // );
  // console.inspect(map);
  // for (let [key, value] of Object.entries(map)) {
  //   console.log(parseInt(key) + 1 + ':', value);
  // }

  const optionIcons: Set<string> = new Set();
  const data: any[] = await ctrl.readJsonFile('./ExcelBinOutput/DialogExcelConfigData.json');

  for (let row of data) {
    if (row.optionIcon) {
      optionIcons.add(row.optionIcon);
    }
  }
  console.log(Array.from(optionIcons).sort());


  // let files: string[] = fs.readdirSync("C:/Shared/git/localweb/Saccharose/public/images/DIcons");
  // for (let f of files) {
  //   console.log(f);
  //   if (f.endsWith('.png')) {
  //     f = f.slice(0, -4);
  //   }
  //   if (!optionIcons.has(f)) {
  //     fs.unlinkSync("C:/Shared/git/localweb/Saccharose/public/images/DIcons/" + f + ".png");
  //   }
  // }

  await closeKnex();
}