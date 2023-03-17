import '../loadenv';
import { pathToFileURL } from 'url';
import { clearFullTextMap, getFullTextMap, loadTextMaps } from '../scripts/textmap';
import { LANG_CODES } from '../../shared/types/dialogue-types';
import { getGenshinDataFilePath } from '../loadenv';
import fs from 'fs';
import { normText } from '../scripts/script_util';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!fs.existsSync(getGenshinDataFilePath('./TextMap/Plain/'))) {
    fs.mkdirSync(getGenshinDataFilePath('./TextMap/Plain/'));
  }

  for (let langCode of LANG_CODES) {
    if (langCode === 'CH')
      continue;
    await loadTextMaps([ langCode ], false);

    let textmap = getFullTextMap(langCode);

    console.log('  Normalizing TextMap for ' + langCode);
    let hashList = [];
    let textList = [];

    for (let [hash, text] of Object.entries(textmap)) {
      hashList.push(hash);
      textList.push(normText(text, langCode, true, true).replaceAll(/\r?\n/g, '\\n'));
    }

    console.log('  Writing to PlainTextMap_Text.dat');
    fs.writeFileSync(getGenshinDataFilePath('./TextMap/Plain/PlainTextMap' + langCode + '_Text.dat'), textList.join('\n'), 'utf8');
    console.log('  Writing to PlainTextMap_Hash.dat');
    fs.writeFileSync(getGenshinDataFilePath('./TextMap/Plain/PlainTextMap' + langCode + '_Hash.dat'), hashList.join('\n'), 'utf8');

    textmap = null;

    clearFullTextMap(langCode);
    console.log('----------');
  }
  console.log('Done');
}