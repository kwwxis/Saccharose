// File to set 'use strict' and load environment variables
import 'use-strict';
import '../shared/polyfills';
import path from 'path';
import dotenv from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { LangCode } from '../shared/types/lang-types';

const __dirname = dirname(fileURLToPath(import.meta.url));

const envFile = path.resolve(__dirname, '../../.env');
console.log('[Init] envFile:', envFile);
dotenv.config({ path: envFile });

export const VIEWS_ROOT = path.resolve(__dirname, './views');
export const PUBLIC_DIR = path.resolve(__dirname, '../../public');
export const SITE_TITLE = 'Saccharose.wiki';
export const EJS_DELIMITER = '%';

export const IMAGEDIR_GENSHIN = path.resolve(PUBLIC_DIR, './images/genshin');
export const IMAGEDIR_HSR = path.resolve(PUBLIC_DIR, './images/hsr');
export const IMAGEDIR_ZENLESS = path.resolve(PUBLIC_DIR, './images/zenless');

export const DATAFILE_GENSHIN_SQLITE_DB = './genshin_data.db';
export const DATAFILE_HSR_SQLITE_DB = './hsr_data.db';
export const DATAFILE_ZENLESS_SQLITE_DB = './zenless_data.db';

export const DATAFILE_GENSHIN_VOICE_ITEMS = './voiceItemsNormalized.json';
export const DATAFILE_HSR_VOICE_ITEMS = './ExcelOutput/VoiceConfig.json';

export const getNodeEnv = (): 'development'|'production' => <any> process.env.NODE_ENV;

export const getTextMapRelPath = (langCode: LangCode): string =>
  './TextMap/TextMap'+langCode+'.json';

export const getPlainTextMapRelPath = (langCode: LangCode, fileType: 'Text' | 'Hash'): string =>
  './TextMap/Plain/PlainTextMap'+langCode+'_'+fileType+'.dat';

export const getTextIndexRelPath = (textIndexName: string): string =>
  './TextMap/Index/TextIndex_'+textIndexName+'.json';

export const getReadableRelPath = (langCode: LangCode): string =>
  './Readable/'+langCode;

export function getGenshinDataFilePath(file: string): string {
  if (file.includes('../') || file.includes('..\\')) {
    throw 'Access to parent directories disallowed.';
  }
  return path.resolve(process.env.GENSHIN_DATA_ROOT, file).replaceAll('\\', '/');
}

export function getStarRailDataFilePath(file: string): string {
  if (file.includes('../') || file.includes('..\\')) {
    throw 'Access to parent directories disallowed.';
  }
  return path.resolve(process.env.HSR_DATA_ROOT, file).replaceAll('\\', '/');
}

export function getZenlessDataFilePath(file: string): string {
  if (file.includes('../') || file.includes('..\\')) {
    throw 'Access to parent directories disallowed.';
  }
  return path.resolve(process.env.ZENLESS_DATA_ROOT, file).replaceAll('\\', '/');
}