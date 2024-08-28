import { toInt } from '../../../shared/util/numberUtil.ts';
import { LangCode, LangCodeMap } from '../../../shared/types/lang-types.ts';
import { wordRejoin, wordSplit } from '../../../shared/util/stringUtil.ts';
import {
  genericNormText,
  mergeMcTemplate,
  NormTextOptions,
  postProcessBoldItalic,
} from '../abstract/genericNormalizers.ts';
import { SpriteTagExcelConfigData } from '../../../shared/types/genshin/general-types.ts';
import { getGenshinControl } from './genshinControl.ts';
import { toMap } from '../../../shared/util/arrayUtil.ts';
import { logInitData } from '../../util/logger.ts';
import fs, { promises as fsp } from 'fs';
import { ManualTextMapHashes } from '../../../shared/types/genshin/manual-text-map.ts';
import { GENSHIN_DISABLED } from '../../loadenv.ts';

export type GenshinNormTextOpts = {
  wandererPlaceholderPlainForm?: boolean,
  littleOnePlaceholderPlainForm?: boolean,
};

function __convertGenshinRubi(langCode: LangCode, text: string): string {
  const rubiMap: { [index: number]: string } = {};
  const rubiRegex = /{RUBY#\[([SD])]([^}]+)}/;

  while (rubiRegex.test(text)) {
    const exec = rubiRegex.exec(text);
    const rubiType: string = exec[1]; // either 'S' or 'D'
    const rubiText: string = exec[2];
    let rubiIndex: number = exec.index;

    if (rubiType === 'S') {
      rubiIndex--;
    }

    rubiMap[rubiIndex] = rubiText;

    text = text.replace(rubiRegex, '');
  }

  let parts: Intl.SegmentData[] = wordSplit(langCode, text);

  for (let i = 0; i < parts.length; i++) {
    const part: Intl.SegmentData = parts[i];
    const rubiIndices: number[] = [];

    for (let rubiIndex of Object.keys(rubiMap).map(toInt)) {
      if (part.index <= rubiIndex && rubiIndex < (part.index + part.segment.length)) {
        rubiIndices.push(rubiIndex);
      }
    }

    if (rubiIndices.length) {
      let rubiText = rubiIndices.map(rubiIndex => rubiMap[rubiIndex]).join('');
      part.segment = `{{Rubi|${part.segment}|${rubiText}}}`;
    }
  }
  return wordRejoin(parts);
}

function __travelerPlaceholder(langCode: LangCode = 'EN', degender: boolean = false): string {
  switch (langCode) {
    case 'CH':
      return '(旅行者)';
    case 'CHS':
      return '(旅行者)';
    case 'CHT':
      return '(旅行者)';
    case 'DE':
      return degender ? '(Reisender)' : '(Reisender/Reisende)';
    case 'EN':
      return '{{Traveler}}';
    case 'ES':
      return degender ? '(Viajero)' : '(Viajero/Viajera)';
    case 'FR':
      return degender ? '(Voyageur)' : '(Voyageur/Voyageuse)';
    case 'ID':
      return '(Pengembara)';
    case 'IT':
      return degender ? '(Viaggiatore)' : '(Viaggiatore/Viaggiatrice)';
    case 'JP':
      return '(旅人)';
    case 'KR':
      return '(여행자)';
    case 'PT':
      return '(Viajante)';
    case 'RU':
      return '{{Имя}}';
    case 'TH':
      return '(นักเดินทาง)';
    case 'TR':
      return '(Gezgin)';
    case 'VI':
      return '(Nhà Lữ Hành)';
  }
}

function __wandererPlaceholder(langCode: LangCode = 'EN', plainForm: boolean = false): string {
  const nameText: string = (() => {
    switch (langCode) {
      case 'CH':
      case 'CHS':
        return '流浪者';
      case 'CHT':
        return '流浪者';
      case 'DE':
        return 'Wanderer';
      case 'EN':
        return 'Wanderer';
      case 'ES':
        return 'Trotamundos';
      case 'FR':
        return 'Nomade';
      case 'ID':
        return 'Wanderer';
      case 'IT':
        return 'Vagabondo';
      case 'JP':
        return '放浪者';
      case 'KR':
        return '방랑자';
      case 'PT':
        return 'Andarilho';
      case 'RU':
        return 'Странник';
      case 'TH':
        return 'ผู้พเนจร';
      case 'TR':
        return 'Avare';
      case 'VI':
        return 'Kẻ Lang Thang';
    }
  })();
  if (plainForm) {
    return nameText;
  } else if (langCode === 'EN') {
    return '{{' + nameText + '}}';
  } else {
    return '(' + nameText + ')';
  }
}

function __littleOnePlaceholder(langCode: LangCode = 'EN', plainForm: boolean = false): string {
  const nameText: string = (() => {
    switch (langCode) {
      case 'CH':
      case 'CHS':
        return '小家伙';
      case 'CHT':
        return '小傢伙';
      case 'DE':
        return 'Kleinen';
      case 'EN':
        return 'Little One';
      case 'ES':
        return 'Pequeñín';
      case 'FR':
        return 'P\'tit gaillard';
      case 'ID':
        return 'Si Kecil';
      case 'IT':
        return 'Piccolino';
      case 'JP':
        return 'ちび';
      case 'KR':
        return '꼬마 용';
      case 'PT':
        return 'Pequenino';
      case 'RU':
        return 'Малыш';
      case 'TH':
        return 'ตัวเล็ก';
      case 'TR':
        return 'Ufaklık';
      case 'VI':
        return 'Đồng Hành Nhỏ';
    }
  })();
  if (plainForm) {
    return nameText;
  } else if (langCode === 'EN') {
    return '{{' + nameText + '}}';
  } else {
    return '(' + nameText + ')';
  }
}

/**
 * **Never use this function directly!!!**
 *
 * Always go through {@link AbstractControl#normText|AbstractControl.normText()}
 *
 * There are options that the Control may add on depending on user preferences.
 */
export function __normGenshinText(text: string, langCode: LangCode, opts: NormTextOptions<GenshinNormTextOpts> = {}): string {
  if (!text) {
    return text;
  }

  if (!opts)
    opts = {};
  if (!opts.mcPlaceholderProvider)
    opts.mcPlaceholderProvider = __travelerPlaceholder;

  text = genericNormText(text, langCode, opts);
  text = text.replace(/<right>/g, '<div class="align-right">');
  text = text.replace(/<\/right>/g, '</div>');
  text = text.replace(/<size=([^>]+)>(.*?)<\/size>/gs, '$2');
  text = text.replace(/<image\s+name=([^\s\/>]+)\s*\/>/g,'{{tx|Image: $1}}');

  if (!opts.decolor && !opts.plaintext) {
    // Bold:
    text = text.replace(/<color=#\{0}>(.*?)<\/color>/g, `<b>$1</b>`);
    text = text.replace(/<color=#FFFFFF(?:FF)?>(.*?)<\/color>/g, `<b>$1</b>`);
    text = text.replace(/<color=#37FFFF(?:FF)?>(.*?) ?<\/color>/g, `<b>$1</b>`);
    text = postProcessBoldItalic(text, opts);

    // Misc:
    text = text.replace(/<color=#00E1FF(?:FF)?>(.*?)<\/color>/g, '{{Color|buzzword|$1}}');
    text = text.replace(/<color=#00E2FF(?:FF)?>(.*?)<\/color>/g, '{{Color|buzzword|$1}}');
    text = text.replace(/<color=#FFCC33(?:FF)?>(.*?)<\/color>/g, '{{Color|help|$1}}');
    text = text.replace(/<color=#FFE14B(?:FF)?>(.*?)<\/color>/g, '{{Color|help|$1}}');
    text = text.replace(/<color=#CC8000(?:FF)?>(.*?)<\/color>/g, '{{Color|bp|$1}}');

    // Elements:
    text = text.replace(/<color=#FFACFF(?:FF)?>(.*?)<\/color>/g,
      (fm, g1) => elementColorTemplate(langCode, 'ELECTRO', 'Electro', fm, g1));

    text = text.replace(/<color=#99FFFF(?:FF)?>(.*?)<\/color>/g,
      (fm, g1) => elementColorTemplate(langCode, 'CRYO', 'Cryo', fm, g1));

    text = text.replace(/<color=#80C0FF(?:FF)?>(.*?)<\/color>/g,
      (fm, g1) => elementColorTemplate(langCode, 'HYDRO', 'Hydro', fm, g1));

    text = text.replace(/<color=#FF9999(?:FF)?>(.*?)<\/color>/g,
      (fm, g1) => elementColorTemplate(langCode, 'PYRO', 'Pyro', fm, g1));

    text = text.replace(/<color=#99FF88(?:FF)?>(.*?)<\/color>/g,
      (fm, g1) => elementColorTemplate(langCode, 'DENDRO', 'Dendro', fm, g1));

    text = text.replace(/<color=#80FFD7(?:FF)?>(.*?)<\/color>/g,
      (fm, g1) => elementColorTemplate(langCode, 'ANEMO', 'Anemo', fm, g1));

    text = text.replace(/<color=#FFE699(?:FF)?>(.*?)<\/color>/g,
      (fm, g1) => elementColorTemplate(langCode, 'GEO', 'Geo', fm, g1));

    // Unknown:
    text = text.replace(/<color=(#[0-9a-fA-F]{6})(?:FF)?>(.*?)<\/color>/g, '{{Color|$1|$2}}');
  }

  text = text.replace(/\{REALNAME\[ID\(1\)(\|HOSTONLY\(true\))?(\|SHOWHOST\(true\))?(\|DELAYHANDLE\((true|false)\))?]}/g,
    __wandererPlaceholder(langCode, opts?.customOpts?.wandererPlaceholderPlainForm));

  text = text.replace(/\{REALNAME\[ID\(2\)(\|HOSTONLY\(true\))?(\|SHOWHOST\(true\))?(\|DELAYHANDLE\((true|false)\))?]}/g,
    __littleOnePlaceholder(langCode, opts?.customOpts?.littleOnePlaceholderPlainForm));

  if (!opts.plaintext) {
    text = text.replace(/\{SPRITE_PRESET#(\d+)}/g, (_fm: string, g1: string) => {
      let image = GENSHIN_SPRITE_TAGS[parseInt(g1)].Image;
      image = image.split('/').pop();
      return '{{Sprite|' + image + '}}';
    });
  }

  if (text.includes('RUBY#[')) {
    text = __convertGenshinRubi(langCode, text);
  }

  if (text && text.includes('REGEX#OVERSEA') && serverBrandTipsOverseas && serverEmailAskOverseas) {
    text = text.replace(/\{REGEX#OVERSEA\[Server_BrandTips_Oversea.*?}/, serverBrandTipsOverseas[langCode]);
    text = text.replace(/\{REGEX#OVERSEA\[Server_Email_Ask_Oversea.*?}/, serverEmailAskOverseas[langCode]);
  }

  text = mergeMcTemplate(text, langCode, opts.plaintext);

  if (/\|s1:/.test(text)) {
    let parts = text.split(/\|s\d+:/);
    if (opts.sNum && opts.sNum <= parts.length - 1) {
      text = parts[opts.sNum];
    } else {
      text = parts[0];
    }
  }

  return text;
}

// Wikis that use Module:Color and have "_searchTextForKeyword" function and updated their "colors" map
// to include their language keywords and not just English keywords
const wikisSupportingInTextColorKeyword: Set<LangCode> = new Set(['EN', 'JP', 'RU', 'TH', 'TR', 'VI']);

// Wikis supporting the element name as template name, e.g. {{Hydro}} or {{水}}
const wikisSupportingElementNameTemplates: Set<LangCode> = new Set(['EN', 'JP', 'TH', 'TR', 'VI']);

function elementColorTemplate(langCode: LangCode,
                              ELEMENT_TEXTMAP_KEY: keyof typeof ELEMENT_TEXTMAP,
                              TPL_COLOR_NAME: string,
                              _fullMatch: string, g1: string) {
  const elementName: LangCodeMap = ELEMENT_TEXTMAP[ELEMENT_TEXTMAP_KEY];

  // Exact element name match: <color>Hydro</color> --> {{Hydro}}
  if (wikisSupportingElementNameTemplates.has(langCode) && g1.toLowerCase() === elementName.EN.toLowerCase()) {
    return `{{${TPL_COLOR_NAME}}}`;
  }

  // Contains element name: <color>Hydro DMG</color> --> {{Color|Hydro DMG}}
  else if (wikisSupportingInTextColorKeyword.has(langCode) && g1.toLowerCase().includes(elementName.EN.toLowerCase())) {
    return `{{Color|${g1}}}`;
  }

  // Does not contain element name: <color>Lorem ipsum</color> --> {{Color|hydro|Lorem ipsum}}
  else {
    return `{{Color|${TPL_COLOR_NAME.toLowerCase()}|${g1}}}`;
  }
}

export const GENSHIN_SPRITE_TAGS: { [spriteId: number]: SpriteTagExcelConfigData } = {};

let serverBrandTipsOverseas: LangCodeMap = null;
let serverEmailAskOverseas: LangCodeMap = null;

let ELEMENT_TEXTMAP: {
  PYRO: LangCodeMap,
  HYDRO: LangCodeMap,
  DENDRO: LangCodeMap,
  ELECTRO: LangCodeMap,
  ANEMO: LangCodeMap,
  CRYO: LangCodeMap,
  GEO: LangCodeMap,
  PHYSICAL: LangCodeMap,
} = {
  PYRO: null,
  HYDRO: null,
  DENDRO: null,
  ELECTRO: null,
  ANEMO: null,
  CRYO: null,
  GEO: null,
  PHYSICAL: null,
};

export async function loadGenshinTextSupportingData(): Promise<void> {
  if (GENSHIN_DISABLED)
    return;
  logInitData('Loading Genshin-supporting text data -- starting...');

  const ctrl = getGenshinControl();

  serverBrandTipsOverseas = await ctrl.createLangCodeMap(2874657049);
  serverEmailAskOverseas = await ctrl.createLangCodeMap(2535673454);

  ELEMENT_TEXTMAP.PYRO = await ctrl.createLangCodeMap(ManualTextMapHashes.Pyro);
  ELEMENT_TEXTMAP.HYDRO = await ctrl.createLangCodeMap(ManualTextMapHashes.Hydro);
  ELEMENT_TEXTMAP.DENDRO = await ctrl.createLangCodeMap(ManualTextMapHashes.Dendro);
  ELEMENT_TEXTMAP.ELECTRO = await ctrl.createLangCodeMap(ManualTextMapHashes.Electro);
  ELEMENT_TEXTMAP.ANEMO = await ctrl.createLangCodeMap(ManualTextMapHashes.Anemo);
  ELEMENT_TEXTMAP.CRYO = await ctrl.createLangCodeMap(ManualTextMapHashes.Cryo);
  ELEMENT_TEXTMAP.GEO = await ctrl.createLangCodeMap(ManualTextMapHashes.Geo);
  ELEMENT_TEXTMAP.PHYSICAL = await ctrl.createLangCodeMap(ManualTextMapHashes.Physical);

  toMap(await ctrl.readExcelDataFile<SpriteTagExcelConfigData[]>('SpriteTagExcelConfigData.json'), 'Id', GENSHIN_SPRITE_TAGS);

  logInitData('Loading Genshin-supporting text data -- done!');
}
