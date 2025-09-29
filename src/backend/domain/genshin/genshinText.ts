import { toInt } from '../../../shared/util/numberUtil.ts';
import { LangCode, LangCodeMap } from '../../../shared/types/lang-types.ts';
import { wordRejoin, wordSplit } from '../../../shared/util/stringUtil.ts';
import {
  genericNormText,
  mergeMcTemplate,
  NormTextOptions,
  postProcessBoldItalic,
} from '../abstract/genericNormalizers.ts';
import {
  HyperLinkNameExcelConifgData,
  SpriteTagExcelConfigData,
} from '../../../shared/types/genshin/general-types.ts';
import { getGenshinControl } from './genshinControl.ts';
import { mapBy } from '../../../shared/util/arrayUtil.ts';
import { logInitData } from '../../util/logger.ts';
import { ManualTextMapHashes } from '../../../shared/types/genshin/manual-text-map.ts';
import { isSiteModeDisabled } from '../../loadenv.ts';
import { AvatarSkillExcelConfigData, ProudSkillExcelConfigData } from '../../../shared/types/genshin/avatar-types.ts';

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
        return 'Kleiner';
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

  text = genericNormText(text, langCode, opts, {
    brFormat: '<br>'
  });
  text = text.replace(/<right>/g, '<div class="align-right">');
  text = text.replace(/<\/right>/g, '</div>');
  text = text.replace(/<size=([^>]+)>(.*?)<\/size>/gs, '$2');
  text = text.replace(/<image\s+name=([^\s\/>]+)\s*\/>/g,'{{tx|Image: $1}}');

  // TODO: link
  // TODO: fancy quotes

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

    // Menu:
    if (langCode === 'EN') {
      text = text.replace(/<color=#FFD780(?:FF)?>(.*?)<\/color>/g, '{{Color|menu|$1}}');
    }

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
      let image = GENSHIN_SPRITE_TAGS[toInt(g1)].Image;
      image = image.split('/').pop();
      return '{{tx|Sprite: ' + image + '}}';
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

  if (text.includes('{LINK#')) {
    text = processLink(langCode, text, opts.plaintext);
  }

  return text;
}

function processLink(langCode: LangCode, text: string, plaintext: boolean): string {
  text = text.replace(/{LINK#(\w)(\d+)}(.*?){\/LINK}/g, (fm: string, LINK_TYPE: string, LINK_ID: string, text: string) => {
    if (plaintext) {
      return text;
    }

    let link: GenshinTextLink;

    switch (LINK_TYPE) {
      case 'P':
        link = GENSHIN_TEXTLINKS_PROUDSKILL[LINK_ID]; // ProudSkill
        break;
      case 'S':
        link = GENSHIN_TEXTLINKS_AVATARSKILL[LINK_ID]; // AvatarSkill
        break;
      case 'N':
        link = GENSHIN_TEXTLINKS_HYPERLINK[LINK_ID]; // HyperLinkName
        break;
    }

    if (!link) {
      return fm;
    }

    let title: string = link.Name[langCode];
    let desc: string = link.Desc[langCode];

    if (link.DescParamList && link.DescParamList.length) {
      for (let i = 0; i < link.DescParamList.length; i++) {
        desc = desc.replace(new RegExp(`\\{${i}\\}`, 'g'), () => {
          return link.DescParamList[i];
        });
      }
    }

    desc = desc.replace(/\n+/g, (fm) => {
      return '<br>'.repeat(fm.length);
    });

    return `{{Extra Effect|${text}|${title}|${desc}}}`;
  });

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

type GenshinTextLink = {
  Id: number,
  Name: LangCodeMap,
  Desc: LangCodeMap,
  DescParamList?: string[],
};
const GENSHIN_TEXTLINKS_HYPERLINK: { [id: number]: GenshinTextLink } = {};
const GENSHIN_TEXTLINKS_PROUDSKILL: { [id: number]: GenshinTextLink } = {};
const GENSHIN_TEXTLINKS_AVATARSKILL: { [id: number]: GenshinTextLink } = {};

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
  if (isSiteModeDisabled('genshin'))
    return;
  logInitData('Loading Genshin-supporting text data -- starting...');

  const ctrl = getGenshinControl();

  // Server Overseas
  // --------------------------------------------------------------------------------------------------------------
  serverBrandTipsOverseas = await ctrl.cached('TextSupportingData:ServerBrandTipsOverseas', 'json', async () => {
    return await ctrl.createLangCodeMap(2874657049);
  });
  serverEmailAskOverseas = await ctrl.cached('TextSupportingData:ServerEmailAskOverseas', 'json', async () => {
    return await ctrl.createLangCodeMap(2535673454);
  });

  // Element TextMap
  // --------------------------------------------------------------------------------------------------------------
  ELEMENT_TEXTMAP = await ctrl.cached('TextSupportingData:ElementTextMap', 'json', async () => {
    ELEMENT_TEXTMAP.PYRO = await ctrl.createLangCodeMap(ManualTextMapHashes.Pyro);
    ELEMENT_TEXTMAP.HYDRO = await ctrl.createLangCodeMap(ManualTextMapHashes.Hydro);
    ELEMENT_TEXTMAP.DENDRO = await ctrl.createLangCodeMap(ManualTextMapHashes.Dendro);
    ELEMENT_TEXTMAP.ELECTRO = await ctrl.createLangCodeMap(ManualTextMapHashes.Electro);
    ELEMENT_TEXTMAP.ANEMO = await ctrl.createLangCodeMap(ManualTextMapHashes.Anemo);
    ELEMENT_TEXTMAP.CRYO = await ctrl.createLangCodeMap(ManualTextMapHashes.Cryo);
    ELEMENT_TEXTMAP.GEO = await ctrl.createLangCodeMap(ManualTextMapHashes.Geo);
    ELEMENT_TEXTMAP.PHYSICAL = await ctrl.createLangCodeMap(ManualTextMapHashes.Physical);
    return ELEMENT_TEXTMAP;
  });

  // Sprite Tags
  // --------------------------------------------------------------------------------------------------------------
  const spriteTags = await ctrl.cached('TextSupportingData:SpriteTags', 'json', async () => {
    return mapBy(await ctrl.readExcelDataFile<SpriteTagExcelConfigData[]>('SpriteTagExcelConfigData.json'), 'Id');
  });
  Object.assign(GENSHIN_SPRITE_TAGS, spriteTags);

  // Text Links: Hyper Link Names
  // --------------------------------------------------------------------------------------------------------------
  const hyperTextLinks = await ctrl.cached('TextSupportingData:HyperLinkNameTextLinks', 'json', async () => {
    const dataArray = await ctrl.readExcelDataFile<HyperLinkNameExcelConifgData[]>('HyperLinkNameExcelConifgData.json');
    const links: GenshinTextLink[] = await dataArray.asyncMap(async item => {
      return {
        Id: item.Id,
        Name: await ctrl.createLangCodeMap(item.NameTextMapHash),
        Desc: await ctrl.createLangCodeMap(item.DescTextMapHash),
        DescParamList: item.DescParamList
      };
    });
    return mapBy(links, 'Id');
  });
  Object.assign(GENSHIN_TEXTLINKS_HYPERLINK, hyperTextLinks);

  // Text Links: Proud Skill
  // --------------------------------------------------------------------------------------------------------------
  const proudSkillTextLinks = await ctrl.cached('TextSupportingData:ProudSkillTextLinks', 'json', async () => {
    const dataArray = await ctrl.readExcelDataFile<ProudSkillExcelConfigData[]>('ProudSkillExcelConfigData.json');
    const links: GenshinTextLink[] = await dataArray.asyncMap(async item => {
      return {
        Id: item.ProudSkillId,
        Name: await ctrl.createLangCodeMap(item.NameTextMapHash),
        Desc: await ctrl.createLangCodeMap(item.DescTextMapHash),
      };
    });
    return mapBy(links, 'Id');
  });
  Object.assign(GENSHIN_TEXTLINKS_PROUDSKILL, proudSkillTextLinks);

  // Text Links: Avatar SKill
  // --------------------------------------------------------------------------------------------------------------
  const avatarSkillTextLinks = await ctrl.cached('TextSupportingData:AvatarSkillTextLinks', 'json', async () => {
    const dataArray = await ctrl.readExcelDataFile<AvatarSkillExcelConfigData[]>('AvatarSkillExcelConfigData.json');
    const links: GenshinTextLink[] = await dataArray.asyncMap(async item => {
      return {
        Id: item.Id,
        Name: await ctrl.createLangCodeMap(item.NameTextMapHash),
        Desc: await ctrl.createLangCodeMap(item.DescTextMapHash),
      };
    });
    return mapBy(links, 'Id');
  });
  Object.assign(GENSHIN_TEXTLINKS_AVATARSKILL, avatarSkillTextLinks);

  logInitData('Loading Genshin-supporting text data -- done!');
}
