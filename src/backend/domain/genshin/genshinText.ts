import { toInt } from '../../../shared/util/numberUtil';
import { LangCode, LangCodeMap } from '../../../shared/types/lang-types';
import { wordRejoin, wordSplit } from '../../../shared/util/stringUtil';
import {
  genericNormText,
  mergeMcTemplate,
  NormTextOptions,
  postProcessBoldItalic,
} from '../generic/genericNormalizers';
import { SpriteTagExcelConfigData } from '../../../shared/types/genshin/general-types';
import { getGenshinControl } from './genshinControl';
import { toMap } from '../../../shared/util/arrayUtil';
import { html2quotes, unnestHtmlTags } from '../../../shared/mediawiki/mwQuotes';
import { logInitData } from '../../util/logger';

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
      return '(Traveler)';
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
      return degender ? '(Путешественник)' : '(Путешественник/Путешественница)';
    case 'TH':
      return '(นักเดินทาง)';
    case 'TR':
      return '(Gezgin)';
    case 'VI':
      return '(Nhà Lữ Hành)';
  }
  return '(Traveler)';
}

/**
 * **Never use this function directly!!!**
 *
 * Always go through {@link AbstractControl#normText|AbstractControl.normText()}
 *
 * There are options that the Control may add on depending on user preferences.
 */
export function __normGenshinText(text: string, langCode: LangCode, opts: NormTextOptions = {}): string {
  if (!text) {
    return text;
  }

  if (!opts)
    opts = {};
  if (!opts.mcPlaceholderProvider)
    opts.mcPlaceholderProvider = __travelerPlaceholder;

  text = genericNormText(text, langCode, opts);

  if (!opts.decolor && !opts.plaintext) {
    // Bold:
    text = text.replace(/<color=#\{0}>(.*?)<\/color>/g, `<b>$1</b>`);
    text = text.replace(/<color=#FFFFFF(?:FF)?>(.*?)<\/color>/g, `<b>$1</b>`);
    text = text.replace(/<color=#37FFFF(?:FF)?>(.*?) ?<\/color>/g, `<b>$1</b>`);
    text = postProcessBoldItalic(text, opts);

    // Misc:
    text = text.replace(/<color=#00E1FF(?:FF)?>(.*?)<\/color>/g, '{{color|buzzword|$1}}');
    text = text.replace(/<color=#FFCC33(?:FF)?>(.*?)<\/color>/g, '{{color|help|$1}}');
    text = text.replace(/<color=#FFE14B(?:FF)?>(.*?)<\/color>/g, '{{color|help|$1}}');
    text = text.replace(/<color=#CC8000(?:FF)?>(.*?)<\/color>/g, '{{color|bp|$1}}');

    // Elements:
    text = text.replace(/<color=#FFACFF(?:FF)?>(.*?)<\/color>/g, '{{Electro|$1}}');
    text = text.replace(/<color=#99FFFF(?:FF)?>(.*?)<\/color>/g, '{{Cryo|$1}}');
    text = text.replace(/<color=#80C0FF(?:FF)?>(.*?)<\/color>/g, '{{Hydro|$1}}');
    text = text.replace(/<color=#FF9999(?:FF)?>(.*?)<\/color>/g, '{{Pyro|$1}}');
    text = text.replace(/<color=#99FF88(?:FF)?>(.*?)<\/color>/g, '{{Dendro|$1}}');
    text = text.replace(/<color=#80FFD7(?:FF)?>(.*?)<\/color>/g, '{{Anemo|$1}}');
    text = text.replace(/<color=#FFE699(?:FF)?>(.*?)<\/color>/g, '{{Geo|$1}}');

    // Unknown:
    text = text.replace(/<color=(#[0-9a-fA-F]{6})(?:FF)?>(.*?)<\/color>/g, '{{color|$1|$2}}');
  }

  text = text.replace(/\{REALNAME\[ID\(1\)(\|HOSTONLY\(true\))?]}/g, '(Wanderer)');

  if (!opts.plaintext) {
    text = text.replace(/\{SPRITE_PRESET#(\d+)}/g, (fm: string, g1: string) => {
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

export const GENSHIN_SPRITE_TAGS: { [spriteId: number]: SpriteTagExcelConfigData } = {};

let serverBrandTipsOverseas: LangCodeMap = null;
let serverEmailAskOverseas: LangCodeMap = null;

export async function loadGenshinTextSupportingData(): Promise<void> {
  logInitData('Loading Genshin-supporting text data -- starting...');

  const ctrl = getGenshinControl();

  serverBrandTipsOverseas = await ctrl.createLangCodeMap(2874657049);
  serverEmailAskOverseas = await ctrl.createLangCodeMap(2535673454);

  toMap(await ctrl.readExcelDataFile<SpriteTagExcelConfigData[]>('SpriteTagExcelConfigData.json'), 'Id', GENSHIN_SPRITE_TAGS);

  logInitData('Loading Genshin-supporting text data -- done!');
}