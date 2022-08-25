import { LangCode, LANG_CODES } from "@types";
import config from '@/config';
import {promises as fs} from 'fs';

export const TextMap: {[langCode: string]: {[id: string]: string}} = {};

export async function loadTextMaps(): Promise<void> {
  console.log('Loading TextMap -- starting...');
  let promises = [];
  for (let langCode of LANG_CODES) {
    console.log('Loading TextMap -- ' + langCode)
    let p = fs.readFile(config.database.getGenshinDataFilePath(config.database.getTextMapFile(langCode)), {encoding: 'utf8'}).then(data => {
      TextMap[langCode] = Object.freeze(JSON.parse(data));
    });
    promises.push(p);
  }
  return Promise.all(promises).then(() => {
    console.log('Loading TextMap -- done!');
  });
}

export function getTextMapItem(langCode: LangCode, id: any) {
  if (typeof id === 'number') {
    id = String(id);
  }
  if (typeof id !== 'string') {
    return undefined;
  }
  return TextMap[langCode][id];
}