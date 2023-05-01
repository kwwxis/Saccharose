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