import config from '@/config';
import {grep} from "@/scripts/script_util";

export const FLAG_EXACT_WORD = '-w';
export const FLAG_REGEX = '-E';

export async function getTextMapMatches(searchText: string, flags?: string): Promise<{[id: number]: string}> {
  let lines = await grep(searchText, './TextMap/' + config.database.textMapFile, flags);
  let out = {};
  for (let line of lines) {
    let parts = /^"(\d+)":\s+"(.*)",?$/.exec(line);
    out[parts[1]] = parts[2].replaceAll('\\', '');
  }
  return out;
}

export async function getTextMapIdStartsWith(idPrefix: string): Promise<{[id: number]: string}> {
  let lines = await grep(`^\\s*"${idPrefix}\\d+": "`, './TextMap/' + config.database.textMapFile, '-E');
  console.log(lines);
  let out = {};
  for (let line of lines) {
    let parts = /^"(\d+)":\s+"(.*)",?$/.exec(line);
    out[parts[1]] = parts[2].replaceAll('\\', '');
  }
  return out;
}

export async function findTextMapIdByExactName(name: string): Promise<number> {
  let matches = await getTextMapMatches(name, '-w');
  for (let [id,value] of Object.entries(matches)) {
    if (value.toLowerCase() === name.toLowerCase()) {
      return parseInt(id);
    }
  }
  return 0;
}

if (require.main === module) {
  (async () => {
    console.log(await getTextMapMatches('adeptibeast', FLAG_EXACT_WORD));
  })();
}