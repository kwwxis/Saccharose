import { Diff, diffWords, diffWordsWithSpace, WordsOptions } from 'diff';
import { pathToFileURL } from 'url';
import { LANG_CODE_TO_LOCALE, LangCode, NON_SPACE_DELIMITED_LANG_CODES } from '../../shared/types/lang-types.ts';

const reWhitespace = /\S/;

export const intlDiff = new Diff();

intlDiff.equals = function(left, right) {
  if (this.options.ignoreCase) {
    left = left.toLowerCase();
    right = right.toLowerCase();
  }
  return left === right || (this.options.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right));
};

intlDiff.tokenize = function(value) {
  const segmenter = new Intl.Segmenter(LANG_CODE_TO_LOCALE[this.options.langCode || 'EN'], { granularity: 'word' });
  return Array.from(segmenter.segment(value)).map(s => s.segment);
};

export function generateOptions(options, defaults: Partial<JsIntlDiffOptions>) {
  return Object.assign(defaults, options || {});
}

export interface JsIntlDiffOptions extends WordsOptions {
  langCode: LangCode
}

export function diffIntl(oldStr, newStr, options: JsIntlDiffOptions) {
  options = generateOptions(options, {
    langCode: 'EN',
    ignoreWhitespace: true
  });
  if (NON_SPACE_DELIMITED_LANG_CODES.includes(options.langCode)) {
    return intlDiff.diff(oldStr, newStr, options);
  } else {
    return diffWords(oldStr, newStr, options);
  }
}

export function diffIntlWithSpace(oldStr, newStr, options: JsIntlDiffOptions) {
  options = generateOptions(options, {
    langCode: 'EN'
  });
  if (NON_SPACE_DELIMITED_LANG_CODES.includes(options.langCode)) {
    return intlDiff.diff(oldStr, newStr, options);
  } else {
    return diffWordsWithSpace(oldStr, newStr, options);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log('Intl:', diffIntlWithSpace(
    `The quick brown fox jumps over the lazy dog!`,
    `The very quick red fox jumps over the lazy dog!`,
    {
      langCode: 'EN'
    }
  ));

  console.log('Words:', diffWordsWithSpace(
    `The quick brown fox jumps over the lazy dog!`,
    `The very quick red fox jumps over the lazy dog!`
  ));

  console.log('----------')

  console.log('Intl:', diffIntlWithSpace(
    '素早い青いキツネが怠惰な犬を飛び越えます。',
    '素早いアカギツネが怠惰な犬を飛び越えます。',
    {
      langCode: 'JP'
    }
  ));

  console.log('Words:', diffWordsWithSpace(
    '素早い青いキツネが怠惰な犬を飛び越えます。',
    '素早いアカギツネが怠惰な犬を飛び越えます。'
  ));
}
