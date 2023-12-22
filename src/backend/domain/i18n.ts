import { LangCode, LangCodeMap } from '../../shared/types/lang-types';

export const GENSHIN_I18N_MAP = {
  TalkToNpc: <LangCodeMap> {
    CH: ``,
    DE: ``,
    EN: `Talk to {npcName}`,
    ES: ``,
    FR: ``,
    ID: ``,
    IT: ``,
    JP: ``,
    KR: ``,
    PT: ``,
    RU: ``,
    TH: ``,
    TR: ``,
    VI: ``,
  },
  ReturnToDialogueOption: <LangCodeMap> {
    CH: ``,
    DE: ``,
    EN: `Dialogue returns to option selection`,
    ES: ``,
    FR: ``,
    ID: ``,
    IT: ``,
    JP: ``,
    KR: ``,
    PT: ``,
    RU: ``,
    TH: ``,
    TR: ``,
    VI: ``,
  },
  CinematicPlays: <LangCodeMap> {
    CH: ``,
    DE: ``,
    EN: `A cinematic plays`,
    ES: ``,
    FR: ``,
    ID: ``,
    IT: ``,
    JP: ``,
    KR: ``,
    PT: ``,
    RU: ``,
    TH: ``,
    TR: ``,
    VI: ``,
  },
  CinematicEnds: <LangCodeMap> {
    CH: ``,
    DE: ``,
    EN: `Cinematic ends`,
    ES: ``,
    FR: ``,
    ID: ``,
    IT: ``,
    JP: ``,
    KR: ``,
    PT: ``,
    RU: ``,
    TH: ``,
    TR: ``,
    VI: ``,
  },
  UnlocksAtFriendshipLevel: <LangCodeMap> {
    CH: ``,
    DE: ``,
    EN: `Unlocks at Friendship Level {level}`,
    ES: ``,
    FR: ``,
    ID: ``,
    IT: ``,
    JP: ``,
    KR: ``,
    PT: ``,
    RU: ``,
    TH: ``,
    TR: ``,
    VI: ``,
  },

  TCG_OpenMatchInterface: <LangCodeMap> {
    CH: ``,
    DE: ``,
    EN: `Open Genius Invokation TCG match interface`,
    ES: ``,
    FR: ``,
    ID: ``,
    IT: ``,
    JP: ``,
    KR: ``,
    PT: ``,
    RU: ``,
    TH: ``,
    TR: ``,
    VI: ``,
  },
  TCG_OpenDeckInterface: <LangCodeMap> {
    CH: ``,
    DE: ``,
    EN: `Open Genius Invokation TCG deck interface`,
    ES: ``,
    FR: ``,
    ID: ``,
    IT: ``,
    JP: ``,
    KR: ``,
    PT: ``,
    RU: ``,
    TH: ``,
    TR: ``,
    VI: ``,
  },
  TCG_IfPlayerWinsMatch: <LangCodeMap> {
    CH: ``,
    DE: ``,
    EN: `If the player wins the match`,
    ES: ``,
    FR: ``,
    ID: ``,
    IT: ``,
    JP: ``,
    KR: ``,
    PT: ``,
    RU: ``,
    TH: ``,
    TR: ``,
    VI: ``,
  },
  TCG_IfPlayerLosesMatch: <LangCodeMap> {
    CH: ``,
    DE: ``,
    EN: `If the player loses the match`,
    ES: ``,
    FR: ``,
    ID: ``,
    IT: ``,
    JP: ``,
    KR: ``,
    PT: ``,
    RU: ``,
    TH: ``,
    TR: ``,
    VI: ``,
  },
  TCG_WhenEnemyHealthDrops: <LangCodeMap> {
    CH: ``,
    DE: ``,
    EN: `When {name}'s {card}'s Health drops to {hp} or lower`,
    ES: ``,
    FR: ``,
    ID: ``,
    IT: ``,
    JP: ``,
    KR: ``,
    PT: ``,
    RU: ``,
    TH: ``,
    TR: ``,
    VI: ``,
  },
  TCG_WhenOneEnemyCardDefeated: <LangCodeMap> {
    CH: ``,
    DE: ``,
    EN: `When the player defeats one of {name}'s Character Cards`,
    ES: ``,
    FR: ``,
    ID: ``,
    IT: ``,
    JP: ``,
    KR: ``,
    PT: ``,
    RU: ``,
    TH: ``,
    TR: ``,
    VI: ``,
  },
  TCG_WhenTwoEnemyCardsDefeated: <LangCodeMap> {
    CH: ``,
    DE: ``,
    EN: `When the player defeats two of {name}'s Character Cards`,
    ES: ``,
    FR: ``,
    ID: ``,
    IT: ``,
    JP: ``,
    KR: ``,
    PT: ``,
    RU: ``,
    TH: ``,
    TR: ``,
    VI: ``,
  },
  TCG_WhenOnePlayerCardDefeated: <LangCodeMap> {
    CH: ``,
    DE: ``,
    EN: `When {name} defeats one of the player's Character Cards`,
    ES: ``,
    FR: ``,
    ID: ``,
    IT: ``,
    JP: ``,
    KR: ``,
    PT: ``,
    RU: ``,
    TH: ``,
    TR: ``,
    VI: ``,
  },
  TCG_WhenEnemyUsesBurst: <LangCodeMap> {
    CH: ``,
    DE: ``,
    EN: `When {name} uses an Elemental Burst`,
    ES: ``,
    FR: ``,
    ID: ``,
    IT: ``,
    JP: ``,
    KR: ``,
    PT: ``,
    RU: ``,
    TH: ``,
    TR: ``,
    VI: ``,
  }
}

export const HSR_I18N_MAP = {

}

export const ZENLESS_I18N_MAP = {

}

export function genshin_i18n(key: keyof typeof GENSHIN_I18N_MAP, langCode: LangCode, vars?: Record<string, string|number>): string {
  if (langCode === 'CHS' || langCode === 'CHT')
    langCode = 'CH';
  let text = GENSHIN_I18N_MAP[key][langCode] || GENSHIN_I18N_MAP[key]['EN'];

  if (vars) {
    for (let [varName, varValue] of Object.entries(vars)) {
      text = text.replace(new RegExp('\\{\\s*' + varName + '\\s*\\}'), String(varValue));
    }
  }

  return text;
}

export function hsr_i18n(key: keyof typeof HSR_I18N_MAP, langCode: LangCode, vars?: Record<string, string|number>): string {
  if (langCode === 'CHS' || langCode === 'CHT')
    langCode = 'CH';
  let text = HSR_I18N_MAP[key][langCode] || HSR_I18N_MAP[key]['EN'];

  return text;
}

export function zenless_i18n(key: keyof typeof ZENLESS_I18N_MAP, langCode: LangCode, vars?: Record<string, string|number>): string {
  if (langCode === 'CHS' || langCode === 'CHT')
    langCode = 'CH';
  let text = ZENLESS_I18N_MAP[key][langCode] || ZENLESS_I18N_MAP[key]['EN'];

  return text;
}