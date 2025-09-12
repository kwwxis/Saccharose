import '../../../loadenv.ts';
import { getGenshinControl, loadGenshinVoiceItems } from '../genshinControl.ts';
import { pathToFileURL } from 'url';
import { closeKnex } from '../../../util/db.ts';
import { loadGenshinTextSupportingData } from '../genshinText.ts';
import './testing2.ts';
import fs from 'fs';
import { OptionIconMap } from '../../../../shared/types/genshin/dialogue-types.ts';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await loadGenshinVoiceItems();
  // await loadGenshinTextSupportingData();

  const ctrl = getGenshinControl();

  // getQuotePos(`<br><br>'''Escudo de Jade'''<br>Da '''2 pontos de '''Escudo''' blah blah blah foobar ''' asdf`, 10);
  // console.log();
  //
  // getQuotePos(`<br><br>'''Escudo de Jade'''<br>Da '''2 pontos de '''Escudo''' blah blah blah foobar ''`, 10);
  // console.log();
  //
  // getQuotePos(`<br><br>'''Escudo de Jade'''<br>Da '''2 pontos de '''Escudo''' blah blah blah foobar '`, 10);
  // console.log();

  // let map = getQuotePosMap(
  //   `'''bold''`
  //   //`<br><br>'''Escudo de Jade'''<br>Da '''2 pontos de '''Escudo''' blah blah blah foobar '`
  //   //`'''Estela de Pedra'''<br>'''Fase Final: '''Causa 1 ''ponto'' de {{Geo|Dano Geo}}.<br>'''Usos: 2'''1`
  //   //`'''Estela de Pedra'''<br>'''Fase Final: '''Causa 1 ponto de {{Geo|Dano Geo}}.<br>'''Usos: 2'''<br><br>'''Escudo de Jade'''<br>Da '''2 pontos de '''Escudo'''''' asdf`
  // );
  // inspect(map);
  // for (let [key, value] of Object.entries(map)) {
  //   console.log(toInt(key) + 1 + ':', value);
  // }

  const optionIcons: Set<string> = new Set();
  const actionBefores: Set<string> = new Set();
  const actionWhiles: Set<string> = new Set();
  const actionAfters: Set<string> = new Set();
  const data: {
    optionIcon?: String,
    actionBefore?: String,
    actionWhile?: String,
    actionAfter?: String,
  }[] = await ctrl.readJsonFile('./ExcelBinOutput/DialogExcelConfigData.json');

  for (let row of data) {
    if (typeof row.optionIcon === 'string') {
      optionIcons.add(row.optionIcon);
    }
    if (typeof row.actionBefore === 'string') {
      if (row.actionBefore.startsWith('DialogAction/D') || row.actionBefore.startsWith('TEST/')) {
        continue;
      }
      actionBefores.add(row.actionBefore);
    }
    if (typeof row.actionWhile === 'string') {
      if (row.actionWhile.startsWith('DialogAction/D') || row.actionWhile.startsWith('TEST/')) {
        continue;
      }
      actionWhiles.add(row.actionWhile);
    }
    if (typeof row.actionAfter === 'string') {
      if (row.actionAfter.startsWith('DialogAction/D') || row.actionAfter.startsWith('QuestDialogue/IQ/')
          || row.actionAfter.startsWith('Shop/shop_open_') || row.actionAfter.startsWith('TEST/')) {
        continue;
      }
      actionAfters.add(row.actionAfter);
    }
  }

  inspect({
    optionIcons: Array.from(optionIcons).sort(),
    actionBefores: Array.from(actionBefores).sort(),
    actionWhiles: Array.from(actionWhiles).sort(),
    actionAfters: Array.from(actionAfters).sort()
  });

  for (let optionIcon of optionIcons) {
    if (OptionIconMap[optionIcon]) {
      continue;
    }
    if (fs.existsSync('E:\\HoYoAssets\\GenshinAssets\\Texture2D\\' + optionIcon + '.png')) {
      fs.copyFileSync('E:\\HoYoAssets\\GenshinAssets\\Texture2D\\' + optionIcon + '.png',
        'C:\\Users\\Matthew\\Documents\\Wiki Tools\\CategoryDownloader\\dicons\\' + optionIcon + '.png');
    }
  }

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
