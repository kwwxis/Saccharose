// File to set 'use strict' and load environment variables
import 'use-strict';
import '../shared/polyfills.ts';
import path from 'path';
import dotenv from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { LangCode } from '../shared/types/lang-types.ts';
import util from 'util';

const __dirname = dirname(fileURLToPath(import.meta.url));

const envFile = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envFile });

export const REPO_ROOT = path.resolve(__dirname, '../../');
export const VIEWS_ROOT = path.resolve(__dirname, './views');
export const PUBLIC_DIR = path.resolve(__dirname, '../../public');
export const PIPELINE_DIR = path.resolve(__dirname, '../pipeline');
export const BACKEND_ROOT = __dirname;
export const SITE_TITLE = 'Saccharose.wiki';
export const EJS_DELIMITER = '%';

export const IMAGEDIR_GENSHIN_STATIC = path.resolve(PUBLIC_DIR, './images/genshin/static');
export const IMAGEDIR_GENSHIN_EXT = path.resolve(process.env.EXT_GENSHIN_IMAGES);
export const IMAGEDIR_HSR_EXT = path.resolve(process.env.EXT_HSR_IMAGES);
export const IMAGEDIR_ZENLESS_EXT = path.resolve(process.env.EXT_ZENLESS_IMAGES);

export const DATAFILE_GENSHIN_SQLITE_DB = './genshin_data.db';
export const DATAFILE_HSR_SQLITE_DB = './hsr_data.db';
export const DATAFILE_ZENLESS_SQLITE_DB = './zenless_data.db';

export const DATAFILE_GENSHIN_VOICE_ITEMS = './VoiceItems.json';
export const DATAFILE_GENSHIN_FETTERS = './VoiceOvers.json';
export const DATAFILE_HSR_VOICE_ITEMS = './ExcelOutput/VoiceConfig.json';
export const DATAFILE_HSR_VOICE_ATLASES = './VoiceOvers.json';

export const getNodeEnv = (): 'development'|'production' => <any> process.env.NODE_ENV;

export const getTextMapRelPath = (langCode: LangCode): string =>
  './TextMap/TextMap'+langCode+'.json';

export const getPlainTextMapRelPath = (langCode: LangCode, fileType: 'Text' | 'Hash'): string =>
  './TextMap/Plain/PlainTextMap'+langCode+'_'+fileType+'.dat';

export const getTextIndexRelPath = (textIndexName: string): string =>
  './TextMap/Index/TextIndex_'+textIndexName+'.json';

export const getReadableRelPath = (langCode: LangCode): string =>
  './Readable/'+langCode;

export function getGenshinDataFilePath(file?: string): string {
  if (!file) {
    return process.env.GENSHIN_DATA_ROOT.replaceAll('\\', '/');
  }
  if (file.includes('../') || file.includes('..\\')) {
    throw 'Access to parent directories disallowed.';
  }
  return path.resolve(process.env.GENSHIN_DATA_ROOT, file).replaceAll('\\', '/');
}

export function getStarRailDataFilePath(file?: string): string {
  if (!file) {
    return process.env.HSR_DATA_ROOT.replaceAll('\\', '/');
  }
  if (file.includes('../') || file.includes('..\\')) {
    throw 'Access to parent directories disallowed.';
  }
  return path.resolve(process.env.HSR_DATA_ROOT, file).replaceAll('\\', '/');
}

export function getZenlessDataFilePath(file?: string): string {
  if (!file) {
    return process.env.ZENLESS_DATA_ROOT.replaceAll('\\', '/');
  }
  if (file.includes('../') || file.includes('..\\')) {
    throw 'Access to parent directories disallowed.';
  }
  return path.resolve(process.env.ZENLESS_DATA_ROOT, file).replaceAll('\\', '/');
}

function consoleInspect(... args: any[]): void {
  let newArgs: any[] = [];
  for (let arg of args) {
    if (typeof arg === 'undefined' || arg === null || typeof arg === 'number' || typeof arg === 'boolean' || typeof arg === 'string') {
      newArgs.push(arg);
    } else {
      newArgs.push(util.inspect(arg, false, null, true))
    }
  }
  console.log(... newArgs);
}

global.inspect = consoleInspect;

declare global {
  function inspect(... args: any[]): void;
}
