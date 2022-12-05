import { LANG_CODES } from '../../../shared/types/dialogue-types';
import { promises as fs } from 'fs';
import config from '../../config';
import { TextMap } from '../textmap';

let promises = [];

for (let langCode of LANG_CODES) {
  let path = config.database.getGenshinDataFilePath(config.database.getTextMapFile(langCode));
  let p = fs.readFile(path, {encoding: 'utf8'}).then(data => {
    TextMap[langCode] = Object.freeze(JSON.parse(data));
  });
  promises.push(p);
}