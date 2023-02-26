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
    if (langCode === 'CH') {
      continue;
    }
    await loadTextMaps([ langCode ]);
    let textmap = Object.assign({}, getFullTextMap(langCode));
    for (let id of Object.keys(textmap)) {
      textmap[id] = normText(textmap[id], langCode, true, true);
    }
    console.log('Writing to PlainTextMap' + langCode + '.json');
    fs.writeFileSync(getGenshinDataFilePath('./TextMap/Plain/PlainTextMap' + langCode + '.json'), JSON.stringify(textmap, null, 2), 'utf8');
    textmap = null;
    clearFullTextMap(langCode);
    console.log('----------');
  }
  console.log('Done');
}