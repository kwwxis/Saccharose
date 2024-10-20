import { Marker } from '../util/highlightMarker.ts';
import { LangDetectResult } from './common-types.ts';
import { GameVersion, GameVersionFilter } from './game-versions.ts';

export type TextMapHash = number|string;

export type TextMapSearchResult = {
  hash: TextMapHash,
  version: string,
  text: string,
  line: number,
  markers?: Marker[],
  hashMarkers?: Marker[],
};

export type TextMapSearchOpts = {
  inputLangCode: LangCode,
  outputLangCode: LangCode,
  searchText: string,
  flags: string,
  isRawInput?: boolean,
  startFromLine?: number,
  searchAgainst?: 'Text' | 'Hash',
  doNormText?: boolean,
  versionFilter?: GameVersionFilter,
};
export type TextMapSearchStreamOpts = TextMapSearchOpts & {
  stream: (textMapHash: TextMapHash, text?: string, kill?: () => void) => void,
};
export type TextMapSearchIndexStreamOpts = TextMapSearchOpts & {
  textIndexName: string|string[],
  stream: (entityId: number, entityIndexName: string, textMapHash: TextMapHash, text?: string) => void,
};

export type PlainLineMapItem = {Line: number, Hash: TextMapHash, LineType?: string };

export type LangCode =
  'CH'
  | 'CHS'
  | 'CHT'
  | 'DE'
  | 'EN'
  | 'ES'
  | 'FR'
  | 'ID'
  | 'IT'
  | 'JP'
  | 'KR'
  | 'PT'
  | 'RU'
  | 'TH'
  | 'TR'
  | 'VI';

export const LANG_CODES: LangCode[] = ['CH', 'CHS', 'CHT', 'DE', 'EN', 'ES', 'FR', 'ID', 'IT', 'JP', 'KR', 'PT', 'RU', 'TH', 'TR', 'VI'];
export const DEFAULT_LANG: LangCode = 'EN';

export const NON_SPACE_DELIMITED_LANG_CODES: LangCode[] = ['CH', 'CHS', 'CHT', 'TH', 'JP'];

export const isLangCode = (str: string) => {
  return (<string[]>LANG_CODES).includes(str);
};

export const LANG_CODES_TO_NAME = {
  CH: 'Chinese',
  CHS: 'Chinese (Simplified)',
  CHT: 'Chinese (Traditional)',
  DE: 'German',
  EN: 'English',
  ES: 'Spanish',
  FR: 'French',
  ID: 'Indonesian',
  IT: 'Italian',
  JP: 'Japanese',
  KR: 'Korean',
  PT: 'Portuguese',
  RU: 'Russian',
  TH: 'Thai',
  TR: 'Turkish',
  VI: 'Vietnamese',
};

export const LANG_CODE_TO_WIKI_CODE = {
  CH: 'ZH',
  CHS: 'ZHS',
  CHT: 'ZHT',
  DE: 'DE',
  EN: 'EN',
  ES: 'ES',
  FR: 'FR',
  ID: 'ID',
  IT: 'IT',
  JP: 'JA',
  KR: 'KO',
  PT: 'PT',
  RU: 'RU',
  TH: 'TH',
  TR: 'TR',
  VI: 'VI',
};

export const LANG_CODE_TO_LOCALE = {
  CH: 'zh-CN',
  CHS: 'zh-CN',
  CHT: 'zh-TW',
  DE: 'de-DE',
  EN: 'en-US',
  ES: 'es-US',
  FR: 'fr-FR',
  ID: 'id-ID',
  IT: 'it-IT',
  JP: 'ja-JP',
  KR: 'ko-KR',
  PT: 'pt-PT',
  RU: 'ru-RU',
  TH: 'th-TH',
  TR: 'tr-TR',
  VI: 'vi-VN',
};

export interface LangSuggest {
  matchesInputLangCode: boolean,
  detected: {
    langCode: LangCode,
    langName: string,
    confidence: number,
  },
  result: LangDetectResult
}

export const CLD2_TO_LANG_CODE = {
  zh: 'CHS',
  'zh-Hant': 'CHT',
  de: 'DE',
  en: 'EN',
  es: 'ES',
  fr: 'FR',
  id: 'ID',
  it: 'IT',
  ja: 'JP',
  ko: 'KR',
  pt: 'PT',
  ru: 'RU',
  th: 'TH',
  tr: 'TR',
  vi: 'VI'
};

export type LangCodeMap<T = string> = {
  CH: T,
  CHS: T,
  CHT: T,
  DE: T,
  EN: T,
  ES: T,
  FR: T,
  ID: T,
  IT: T,
  JP: T,
  KR: T,
  PT: T,
  RU: T,
  TH: T,
  TR: T,
  VI: T,
};

export type VoiceItem = { id: number, fileName: string, type?: string, isGendered?: boolean, gender?: 'M' | 'F', avatar?: string };
export type VoiceItemArrayMap = { [voiceId: string]: VoiceItem[] };
export type VoiceItemFlatMap = { [voiceId: string]: VoiceItem };
