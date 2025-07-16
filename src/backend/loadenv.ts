// File to set 'use strict' and load environment variables
import 'use-strict';
import '../shared/polyfills.ts';
import './env-types.ts';
import path, { dirname } from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { LangCode } from '../shared/types/lang-types.ts';
import util from 'util';
import { toBoolean } from '../shared/util/genericUtil.ts';
import { SiteMode } from '../shared/types/site/site-mode-type.ts';
import { ProcessEnv } from './env-types.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

let _isServerRun: boolean = false;

export function isServerRun(): boolean {
  return _isServerRun
}
export function setIsServerRun(isServerRun: boolean): void {
  _isServerRun = isServerRun;
}

const envFile = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envFile });

export const ENV: ProcessEnv = <any> process.env;

export const VIEWS_ROOT = path.resolve(__dirname, './views');
export const PUBLIC_DIR = path.resolve(__dirname, '../../public');
export const PIPELINE_DIR = path.resolve(__dirname, '../pipeline');
export const REDIST_DIR = path.resolve(PUBLIC_DIR, './redist');
export const BACKEND_ROOT = __dirname;
export const SITE_TITLE = ENV.SITE_TITLE || 'Saccharose.wiki';
export const SITE_SHORT_TITLE = ENV.SITE_SHORT_TITLE || 'Saccharose';
export const EJS_DELIMITER = '%';
export const WEB_ACCESS_LOG = ENV.WEB_ACCESS_LOG ? path.resolve(ENV.WEB_ACCESS_LOG) : null;

const GENSHIN_DISABLED = toBoolean(ENV.GENSHIN_DISABLED);
const HSR_DISABLED = toBoolean(ENV.HSR_DISABLED);
const ZENLESS_DISABLED = toBoolean(ENV.ZENLESS_DISABLED);
const WUWA_DISABLED = toBoolean(ENV.WUWA_DISABLED);

export function isSiteModeDisabled(requestSiteMode: SiteMode) {
  switch (requestSiteMode) {
    case 'unset':
      return true;
    case 'genshin':
      return isServerRun() && GENSHIN_DISABLED;
    case 'hsr':
      return isServerRun() && HSR_DISABLED;
    case 'zenless':
      return isServerRun() && ZENLESS_DISABLED;
    case 'wuwa':
      return isServerRun() && WUWA_DISABLED;
  }
}

export const IMAGEDIR_GENSHIN_STATIC = path.resolve(PUBLIC_DIR, './images/genshin/static');
export const IMAGEDIR_GENSHIN_EXT = path.resolve(ENV.EXT_GENSHIN_IMAGES);
export const IMAGEDIR_GENSHIN_ARCHIVE = ENV.EXT_GENSHIN_IMAGES_ARCHIVE
  ? path.resolve(ENV.EXT_GENSHIN_IMAGES_ARCHIVE) : null;
export const IMAGEDIR_HSR_EXT = path.resolve(ENV.EXT_HSR_IMAGES);
export const IMAGEDIR_ZENLESS_EXT = path.resolve(ENV.EXT_ZENLESS_IMAGES);
export const IMAGEDIR_WUWA_EXT = path.resolve(ENV.EXT_WUWA_IMAGES);

export const DATAFILE_GENSHIN_VOICE_ITEMS = './VoiceItems.json';
export const DATAFILE_GENSHIN_FETTERS = './VoiceOvers.json';
export const DATAFILE_HSR_VOICE_ITEMS = './ExcelOutput/VoiceConfig.json';
export const DATAFILE_HSR_VOICE_ATLASES = './VoiceOvers.json';
export const DATAFILE_WUWA_ROLE_FAVOR_WORDS = './VoiceOvers.json';

export const getNodeEnv = (): 'development'|'production' => <any> ENV.NODE_ENV;

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
    return ENV.GENSHIN_DATA_ROOT.replaceAll('\\', '/');
  }
  if (file.includes('../') || file.includes('..\\')) {
    throw 'Access to parent directories disallowed.';
  }
  return path.resolve(ENV.GENSHIN_DATA_ROOT, file).replaceAll('\\', '/');
}

export function getStarRailDataFilePath(file?: string): string {
  if (!file) {
    return ENV.HSR_DATA_ROOT.replaceAll('\\', '/');
  }
  if (file.includes('../') || file.includes('..\\')) {
    throw 'Access to parent directories disallowed.';
  }
  return path.resolve(ENV.HSR_DATA_ROOT, file).replaceAll('\\', '/');
}

export function getZenlessDataFilePath(file?: string): string {
  if (!file) {
    return ENV.ZENLESS_DATA_ROOT.replaceAll('\\', '/');
  }
  if (file.includes('../') || file.includes('..\\')) {
    throw 'Access to parent directories disallowed.';
  }
  return path.resolve(ENV.ZENLESS_DATA_ROOT, file).replaceAll('\\', '/');
}

export function getWuwaDataFilePath(file?: string): string {
  if (!file) {
    return ENV.WUWA_DATA_ROOT.replaceAll('\\', '/');
  }
  if (file.includes('../') || file.includes('..\\')) {
    throw 'Access to parent directories disallowed.';
  }
  return path.resolve(ENV.WUWA_DATA_ROOT, file).replaceAll('\\', '/');
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

const globalAny: any = global;
globalAny.inspect = consoleInspect;
globalAny.ENV = ENV;

declare global {
  function inspect(... args: any[]): void;
  const ENV: ProcessEnv;
}
