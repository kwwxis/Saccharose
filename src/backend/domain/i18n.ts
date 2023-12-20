import { LangCode, LangCodeMap } from '../../shared/types/lang-types';

export const GENSHIN_I18N_MAP = {
  ReturnToDialogueOption: <LangCodeMap> {
    CH: '',
    CHS: '',
    CHT: '',
    DE: '',
    EN: 'Return to option selection',
    ES: '',
    FR: '',
    ID: '',
    IT: '',
    JP: '',
    KR: '',
    PT: '',
    RU: '',
    TH: '',
    TR: '',
    VI: '',
  }
}

export const HSR_I18N_MAP = {

}

export const ZENLESS_I18N_MAP = {

}

export function genshin_i18n(key: keyof typeof GENSHIN_I18N_MAP, langCode: LangCode, vars?: Record<string, string>): string {
  let text = GENSHIN_I18N_MAP[key][langCode] || GENSHIN_I18N_MAP[key]['EN'];

  if (vars) {
    for (let [varName, varValue] of Object.entries(vars)) {
      text = text.replace(new RegExp('\\{\\s*' + varName + '\\s*\\}'), varValue);
    }
  }

  return text;
}

export function hsr_i18n(key: keyof typeof HSR_I18N_MAP, langCode: LangCode, vars?: Record<string, string>): string {
  let text = HSR_I18N_MAP[key][langCode] || HSR_I18N_MAP[key]['EN'];

  return text;
}

export function zenless_i18n(key: keyof typeof ZENLESS_I18N_MAP, langCode: LangCode, vars?: Record<string, string>): string {
  let text = ZENLESS_I18N_MAP[key][langCode] || ZENLESS_I18N_MAP[key]['EN'];

  return text;
}