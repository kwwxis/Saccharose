import '../../loadenv.ts';
import { LangCode } from '../../../shared/types/lang-types.ts';
import {
  takeFromStartUntilFirstWord,
  takeFromEndUntilLastWord,
  wordRejoin,
  wordSplit,
} from '../../../shared/util/stringUtil.ts';
import { toInt } from '../../../shared/util/numberUtil.ts';
import { pathToFileURL } from 'url';
import { html2quotes, unnestHtmlTags } from '../../../shared/mediawiki/mwQuotes.ts';
import type { Change } from 'diff';
import { diffIntlWithSpace } from '../../util/jsIntlDiff.ts';

export interface NormTextOptions<T = any> {
  decolor?: boolean,
  plaintext?: boolean,
  plaintextMcMode?: 'both' | 'male' | 'female',
  sNum?: number,
  mcPlaceholderProvider?: (langCode: LangCode, degender?: boolean) => string,
  mcPlaceholderForceLangCode?: LangCode,
  forceFancyDash?: boolean,
  skipHtml2Quotes?: boolean,
  customOpts?: T,
}

export const EM_DASH = '—';
export const EN_DASH = '–';
export const FANCY_SINGLE_QUOTE_START = '‘';
export const FANCY_SINGLE_QUOTE_END = '’';
export const FANCY_DOUBLE_QUOTE_START = '“';
export const FANCY_DOUBLE_QUOTE_END = '”';

export interface GenericNormTextRequiredOptions {
  brFormat: '<br>' | '<br/>' | '<br />'
}

export function mergeMcTemplate(text: string, langCode: LangCode, plaintext: boolean): string {
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
}

export function postProcessBoldItalic(text: string, opts: NormTextOptions): string {
  if (text.includes('<b>') || text.includes('<i>')) {
    text = unnestHtmlTags(text);
    if (!opts.skipHtml2Quotes) {
      text = html2quotes(text);
    }
  }
  return text;
}

export function genericNormSearchText(searchText: string, inputLangCode: LangCode): string {
  if (!searchText) {
    return searchText;
  }
  searchText = searchText.replace(/<br ?\/?>/g, '\\n');
  return searchText;
}

export function genericNormText(text: string, langCode: LangCode, opts: NormTextOptions, reqOptions: GenericNormTextRequiredOptions): string {
  if (!text) {
    return text;
  }

  if (!opts.plaintextMcMode)
    opts.plaintextMcMode = 'both';
  if (!opts.mcPlaceholderProvider)
    throw new Error('mcPlaceholderProvider is required');


  text = text.replace(/—/g, opts.forceFancyDash ? EM_DASH : (opts.plaintext ? '-' : '&mdash;')).trim();
  text = text.replace(/–/g, opts.forceFancyDash ? EN_DASH : (opts.plaintext ? '-' : '&ndash;')).trim();

  if (opts.plaintext) {
    text = text.replace(/‘/g, `'`).trim();
    text = text.replace(/’/g, `'`).trim();
    text = text.replace(/“/g, `"`).trim();
    text = text.replace(/”/g, `"`).trim();
  }

  text = text.replace(/{NICKNAME}|{PlayerName}/g, opts.mcPlaceholderProvider(opts.mcPlaceholderForceLangCode || langCode, true));
  text = text.replace(/(\S){NON_BREAK_SPACE}(\S)/g, (fm, g1, g2) => {
    return `${g1} ${g2}`;
  });
  text = text.replace(/{NON_BREAK_SPACE}/g, opts.plaintext ? ' ' : '&nbsp;');
  text = text.replace(/\u00A0/g, opts.plaintext ? ' ' : '&nbsp;');
  text = text.replace(/<i>(.*?)<\/i>/gs, opts.plaintext ? '$1' : `''$1''`);
  text = text.replace(/<\/?c\d>/g, '');

  if (opts.plaintext) {
    if (opts.plaintextMcMode === 'male') {
      text = text.replace(/{F#([^}]*)}{M#([^}]*)}/g, '$2');
      text = text.replace(/{M#([^}]*)}{F#([^}]*)}/g, '$1');

      text = text.replace(/{F#([^}]*)}/g, '');

      // Wuwa:
      text = text.replace(/{Male=([^;]*);Female=([^}]*)}/g, '$1');
    } else if (opts.plaintextMcMode === 'female') {
      text = text.replace(/{F#([^}]*)}{M#([^}]*)}/g, '$1');
      text = text.replace(/{M#([^}]*)}{F#([^}]*)}/g, '$2');

      text = text.replace(/{M#([^}]*)}/g, '');

      // Wuwa:
      text = text.replace(/{Male=([^;]*);Female=([^}]*)}/g, '$2');
    } else {
      text = text.replace(/{F#([^}]*)}{M#([^}]*)}/g, '($2/$1)');
      text = text.replace(/{M#([^}]*)}{F#([^}]*)}/g, '($1/$2)');

      text = text.replace(/{F#([^}]*)}/g, '($1)');
      text = text.replace(/{M#([^}]*)}/g, '($1)');

      // Wuwa:
      text = text.replace(/{Male=([^;]*);Female=([^}]*)}/g, '($1/$2)');
    }
  } else {
    text = text.replace(/{F#([^}]*)}{M#([^}]*)}/g, '{{MC|m=$2|f=$1}}');
    text = text.replace(/{M#([^}]*)}{F#([^}]*)}/g, '{{MC|m=$1|f=$2}}');

    text = text.replace(/{F#([^}]*)}/g, '{{MC|f=$1}}');
    text = text.replace(/{M#([^}]*)}/g, '{{MC|m=$1}}');

    // Wuwa:
    text = text.replace(/{Male=([^;]*);Female=([^}]*)}/g, '{{MC|m=$1|f=$2}}');

    text = text.replace(/~~~+/, fm => `<nowiki>${fm}</nowiki>`);
  }

  if (opts.decolor || opts.plaintext) {
    text = text.replace(/<color=#[^>]+>(.*?)<\/color>/gs, '$1');
  }

  // No longer needed as these are now automatically converted by Fandom or the OL module:
  // if (!opts.plaintext) {
  //   text = text.replace(/« /g, '«&nbsp;');
  //   text = text.replace(/ »/g, '&nbsp;»');
  //   text = text.replace(/(?<=\S) (:|%|\.\.\.)/g, '&nbsp;$1');
  // }

  text = text.replace(/\\"/g, '"');
  text = text.replace(/\r/g, '');
  text = text.replace(/\\?\\n|\\\n|\n/g, opts.plaintext ? '\n' : reqOptions.brFormat)
    .replace(/<br ?\/?><br ?\/?>/g, '\n\n');

  if (text.startsWith('#')) {
    text = text.slice(1);
  }

  return text;
}

export function mcify(lang: LangCode, maleText: string, femaleText: string): string {
  if (maleText === femaleText) {
    return maleText;
  }
  if (!maleText && !femaleText) {
    return null;
  }

  const changes: Change[] = diffIntlWithSpace(maleText || '', femaleText || '', {
    langCode: lang
  });
  const out: { value: string }[] = [];

  // removed -> male text
  // added -> female text

  for (let i = 0; i < changes.length; i++) {
    let change = changes[i];
    let prevChange = changes[i - 1];
    let nextChange = changes[i + 1];

    if (change.removed && nextChange && nextChange.added) {
      out.push({value: `{{MC|m=${change.value}|f=${nextChange.value}}}`});
      i++;
    } else if (change.removed) {
      let maleText = change.value;
      let femaleText =  '';

      if (nextChange) {
        const words = wordSplit(lang, nextChange.value);
        const extra = wordRejoin(takeFromStartUntilFirstWord(words));
        femaleText = extra;
        maleText += extra;
        nextChange.value = wordRejoin(words);
      }
      out.push({value: `{{MC|m=${maleText}|f=${femaleText}}}`});
    } else if (change.added) {
      let maleText = '';
      let femaleText = change.value;

      if (prevChange) {
        const words = wordSplit(lang, prevChange.value);
        const extra = wordRejoin(takeFromEndUntilLastWord(words));
        maleText = extra;
        femaleText = extra + femaleText;
        prevChange.value = wordRejoin(words);
      }
      out.push({value: `{{MC|m=${maleText}|f=${femaleText}}}`});
    } else {
      out.push(change);
    }
  }

  return out.map(c => c.value).join('');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const maleText = `'''Paimon:''' Mondstadt has so many windmills, doesn't it?<br>'''(Traveler):''' Well, the city is built above water, so it probably relies on the windmills to draw water upwards.<br>'''Paimon:''' That's correct! The winds blow through Mondstadt all year, so this supply of water is very stable.<br>'''Paimon:''' Also, the windmills are what they call "visible winds" &mdash; and wind chimes are called the "audible winds."<br>'''Paimon:''' Paimon guesses they can be thought of as mascots and prayers to the Anemo Archon for protection.<br>'''(Traveler):''' Ah, mascots. So, like you then, Paimon?<br>'''Paimon:''' No! Not at all! They're made of wood, and you can't eat them in an emergency either, 'cause all you'll do is grind your teeth down!<br>'''(Traveler):''' Uhh...<br>'''(Traveler):'''&nbsp;...I don't know what to say to that.`;
  const femaleText = `'''Paimon:''' Mondstadt has so many windmills, doesn't it?<br>'''(Traveler):''' Well, the city is built above water, so it probably relies on windmills to draw the water upwards.<br>'''Paimon:''' That's correct! The winds blow through Mondstadt all year, so this supply of water is very stable.<br>'''Paimon:''' Also, the windmills are what they call "visible winds" &mdash; and wind chimes are called the "audible winds."<br>'''Paimon:''' Paimon guesses they can be thought of as mascots and prayers to the Anemo Archon for protection.<br>'''(Traveler):''' Ah, mascots. So, like you then, Paimon?<br>'''Paimon:''' No! Not at all! They're made of wood, and you can't eat them in an emergency either, 'cause all you'll do is grind your teeth down!<br>'''(Traveler):''' Umm...<br>'''(Traveler):'''&nbsp;...I don't know what to say to that.`;

  const split = wordSplit('EN', ' Hello world!');
  console.log(wordRejoin(takeFromEndUntilLastWord(split)));
  console.log(wordRejoin(split));
  console.log(mcify('EN', maleText, femaleText));
}
