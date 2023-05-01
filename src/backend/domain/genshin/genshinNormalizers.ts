import { toInt } from '../../../shared/util/numberUtil';
import { SPRITE_TAGS } from './textmap';
import { LANG_CODE_TO_LOCALE, LangCode } from '../../../shared/types/lang-types';

export const convertRubi = (langCode: LangCode, text: string) => {
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
};

export const wordSplit = (langCode: LangCode, text: string): Intl.SegmentData[] => {
  const segmenter = new Intl.Segmenter(LANG_CODE_TO_LOCALE[langCode], { granularity: 'word' });
  return Array.from(segmenter.segment(text));
};

export const wordRejoin = (segments: Intl.SegmentData[]): string => {
  return segments.map(s => s.segment).join('');
};

export const travelerPlaceholder = (langCode: LangCode = 'EN', degender: boolean = false) => {
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
};

export const normText = (text: string, langCode: LangCode, decolor: boolean = false, plaintext: boolean = false, plaintextMcMode: 'both' | 'male' | 'female' = 'both'): string => {
  if (!text) {
    return text;
  }
  text = text.replace(/—/g, plaintext ? '-' : '&mdash;').trim();
  text = text.replace(/{NICKNAME}/g, travelerPlaceholder(langCode, true));
  text = text.replace(/{NON_BREAK_SPACE}/g, plaintext ? ' ' : '&nbsp;');
  text = text.replace(/\u00A0/g, plaintext ? ' ' : '&nbsp;');
  text = text.replace(/<size=[^>]+>(.*?)<\/size>/gs, '$1');
  text = text.replace(/<i>(.*?)<\/i>/gs, plaintext ? '$1' : `''$1''`);
  text = text.replace(/<\/?c\d>/g, '');

  if (plaintext) {
    if (plaintextMcMode === 'male') {
      text = text.replace(/{F#([^}]*)}{M#([^}]*)}/g, '$2');
      text = text.replace(/{M#([^}]*)}{F#([^}]*)}/g, '$1');
    } else if (plaintextMcMode === 'female') {
      text = text.replace(/{F#([^}]*)}{M#([^}]*)}/g, '$1');
      text = text.replace(/{M#([^}]*)}{F#([^}]*)}/g, '$2');
    } else {
      text = text.replace(/{F#([^}]*)}{M#([^}]*)}/g, '($2/$1)');
      text = text.replace(/{M#([^}]*)}{F#([^}]*)}/g, '($1/$2)');
    }
  } else {
    text = text.replace(/{F#([^}]*)}{M#([^}]*)}/g, '{{MC|m=$2|f=$1}}');
    text = text.replace(/{M#([^}]*)}{F#([^}]*)}/g, '{{MC|m=$1|f=$2}}');
  }

  if (decolor || plaintext) {
    text = text.replace(/<color=#[^>]+>(.*?)<\/color>/gs, '$1');
  } else {
    text = text.replace(/<color=#\{0}>(.*?)<\/color>/g, `'''$1'''`);
    text = text.replace(/<color=#00E1FFFF>(.*?)<\/color>/g, '{{color|buzzword|$1}}');
    text = text.replace(/<color=#FFCC33FF>(.*?)<\/color>/g, '{{color|help|$1}}');

    text = text.replace(/<color=#FFACFFFF>(.*?)<\/color>/g, '{{Electro|$1}}');
    text = text.replace(/<color=#99FFFFFF>(.*?)<\/color>/g, '{{Cryo|$1}}');
    text = text.replace(/<color=#80C0FFFF>(.*?)<\/color>/g, '{{Hydro|$1}}');
    text = text.replace(/<color=#FF9999FF>(.*?)<\/color>/g, '{{Pyro|$1}}');
    text = text.replace(/<color=#99FF88FF>(.*?)<\/color>/g, '{{Dendro|$1}}');
    text = text.replace(/<color=#80FFD7FF>(.*?)<\/color>/g, '{{Anemo|$1}}');
    text = text.replace(/<color=#FFE699FF>(.*?)<\/color>/g, '{{Geo|$1}}');

    text = text.replace(/<color=#FFE14BFF>(.*?)<\/color>/g, '{{color|help|$1}}');

    text = text.replace(/<color=#37FFFF>(.*?) ?<\/color>/g, '\'\'\'$1\'\'\'');
    text = text.replace(/<color=(#[0-9a-fA-F]{6})FF>(.*?)<\/color>/g, '{{color|$1|$2}}');
  }

  if (!plaintext) {
    text = text.replace(/« /g, '«&nbsp;');
    text = text.replace(/ »/g, '&nbsp;»');
    text = text.replace(/(?<=\S) (:|%|\.\.\.)/g, '&nbsp;$1');
  }

  text = text.replace(/\\"/g, '"');
  text = text.replace(/\r/g, '');
  text = text.replace(/\\?\\n|\\\n|\n/g, plaintext ? '\n' : '<br />').replace(/<br \/><br \/>/g, '\n\n');
  text = text.replace(/\{REALNAME\[ID\(1\)(\|HOSTONLY\(true\))?]}/g, '(Wanderer)');
  if (!plaintext) {
    text = text.replace(/\{SPRITE_PRESET#(\d+)}/g, (fm: string, g1: string) => {
      let image = SPRITE_TAGS[parseInt(g1)].Image;
      image = image.split('/').pop();
      return '{{Sprite|' + image + '}}';
    });
  }

  if (text.includes('RUBY#[')) {
    text = convertRubi(langCode, text);
  }

  if (text.startsWith('#')) {
    text = text.slice(1);
  }

  if (langCode && !plaintext && text.includes('{{MC')) {
    const mcParts = [];

    const textForWordSplit = text.replaceAll(/\{\{MC\|.*?}}/g, s => {
      const i = mcParts.length;
      mcParts.push(s);
      return `__MCTMPL${i}__`;
    });

    const words = wordSplit(langCode, textForWordSplit).map(word => {
      word.segment = word.segment.replaceAll(/__MCTMPL(\d+)__/g, (fm: string, g1: string) => mcParts[toInt(g1)]);

      if (word.segment.includes('{{MC')) {
        word.segment = word.segment.replace(/(.*)\{\{MC\|m=(.*?)\|f=(.*?)}}(.*)/g, (fm: string, before: string, maleText: string, femaleText: string, after: string) => {
          let suffix = '';
          if (maleText.endsWith(`'s`) && femaleText.endsWith(`'s`)) {
            maleText = maleText.slice(0, -2);
            femaleText = femaleText.slice(0, -2);
            suffix = `'s`;
          }
          return `{{MC|m=${before}${maleText}${after}|f=${before}${femaleText}${after}}}${suffix}`;
        });
      }

      return word;
    });

    text = wordRejoin(words);

    // Merge multiple subsequent {{MC}} with only spaces between:
    const regex = /\{\{MC\|m=((?:.(?<!\{\{MC))*?)\|f=((?:.(?<!\{\{MC))*?)}}(\s*)\{\{MC\|m=(.*?)\|f=(.*?)}}/;
    while (regex.test(text)) {
      text = text.replace(regex, (s, maleText1, femaleText1, whitespace, maleText2, femaleText2) => {
        return `{{MC|m=${maleText1}${whitespace}${maleText2}|f=${femaleText1}${whitespace}${femaleText2}}}`;
      });
    }
  }

  return text;
};