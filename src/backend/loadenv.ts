// File to set 'use strict' and load environment variables
import 'use-strict';
import '../shared/polyfills';
import path from 'path';
import dotenv from 'dotenv';
import { LangCode } from '../shared/types/dialogue-types';

const envFile = path.resolve(__dirname, '../../.env');
console.log('[Init] envFile:', envFile);
dotenv.config({ path: envFile });

export const VIEWS_ROOT = path.resolve(__dirname, './views');
export const PUBLIC_DIR = path.resolve(__dirname, '../../public');
export const SITE_TITLE = 'Saccharose.wiki';
export const EJS_DELIMITER = '%';

export const DATAFILE_SQLITE_DB = './genshin_data.db';
export const DATAFILE_VOICE_ITEMS = './voiceItemsNormalized.json';
export const getTextMapRelPath = (langCode: LangCode): string => './TextMap/TextMap'+langCode+'.json';

export function getGenshinDataFilePath(file: string): string {
  if (file.includes('../') || file.includes('..\\')) {
    throw 'Access to parent directories disallowed.';
  }
  return path.resolve(process.env.GENSHIN_DATA_ROOT, file).replaceAll('\\', '/');
}