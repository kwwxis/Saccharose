import { LangCode } from '../../../shared/types/lang-types';
import { wordRejoin, wordSplit } from '../../../shared/util/stringUtil';
import { toInt } from '../../../shared/util/numberUtil';
import { pathToFileURL } from 'url';
import { doQuotes, html2quotes, unnestHtmlTags } from '../../../shared/mediawiki/mwQuotes';


export interface NormTextOptions {
  decolor?: boolean,
  plaintext?: boolean,
  plaintextMcMode?: 'both' | 'male' | 'female',
  sNum?: number,
  mcPlaceholderProvider?: (langCode: LangCode, degender?: boolean) => string,
  mcPlaceholderForceLangCode?: LangCode,
  plaintextDash?: string,
  skipHtml2Quotes?: boolean,
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

export function genericNormText(text: string, langCode: LangCode, opts: NormTextOptions): string {
  if (!text) {
    return text;
  }

  if (!opts.plaintextMcMode)
    opts.plaintextMcMode = 'both';
  if (!opts.mcPlaceholderProvider)
    throw new Error('mcPlaceholderProvider is required');

  text = text.replace(/—/g, opts.plaintext ? (opts.plaintextDash || '-') : '&mdash;').trim();
  text = text.replace(/{NICKNAME}/g, opts.mcPlaceholderProvider(opts.mcPlaceholderForceLangCode || langCode, true));
  text = text.replace(/{NON_BREAK_SPACE}/g, opts.plaintext ? ' ' : '&nbsp;');
  text = text.replace(/\u00A0/g, opts.plaintext ? ' ' : '&nbsp;');
  text = text.replace(/<size=[^>]+>(.*?)<\/size>/gs, '$1');
  text = text.replace(/<i>(.*?)<\/i>/gs, opts.plaintext ? '$1' : `''$1''`);
  text = text.replace(/<\/?c\d>/g, '');

  if (opts.plaintext) {
    if (opts.plaintextMcMode === 'male') {
      text = text.replace(/{F#([^}]*)}{M#([^}]*)}/g, '$2');
      text = text.replace(/{M#([^}]*)}{F#([^}]*)}/g, '$1');
    } else if (opts.plaintextMcMode === 'female') {
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

  if (opts.decolor || opts.plaintext) {
    text = text.replace(/<color=#[^>]+>(.*?)<\/color>/gs, '$1');
  }

  if (!opts.plaintext) {
    text = text.replace(/« /g, '«&nbsp;');
    text = text.replace(/ »/g, '&nbsp;»');
    text = text.replace(/(?<=\S) (:|%|\.\.\.)/g, '&nbsp;$1');
  }

  text = text.replace(/\\"/g, '"');
  text = text.replace(/\r/g, '');
  text = text.replace(/\\?\\n|\\\n|\n/g, opts.plaintext ? '\n' : '<br />')
    .replace(/<br \/><br \/>/g, '\n\n');

  if (text.startsWith('#')) {
    text = text.slice(1);
  }

  return text;
}
