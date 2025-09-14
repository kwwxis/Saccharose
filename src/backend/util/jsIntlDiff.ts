import { Diff, diffWords, diffWordsWithSpace } from '../../shared/jsdiff/jsdiff.js';
import type { WordsOptions } from 'diff';
import { fileURLToPath, pathToFileURL } from 'url';
import { LANG_CODE_TO_LOCALE, LangCode, NON_SPACE_DELIMITED_LANG_CODES } from '../../shared/types/lang-types.ts';
import path, { dirname } from 'path';
import fs from 'fs';

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

function generateOptions(options, defaults: Partial<JsIntlDiffOptions>) {
  return Object.assign(defaults, options || {});
}

export interface JsIntlDiffOptions extends WordsOptions {
  langCode: LangCode,

  /**
   * The Intl.Segmenter can be very slow on large texts.
   *
   * For space-delimited languages, we probably don't need to use the Intl.Segmenter
   * so we can just use the standard `diffWords`/`diffWordsWithSpace` instead, which simply splits on whitespace and would be faster.
   *
   * This 'forceIntl' option can be used to force the usage of Intl.Segmenter.
   */
  forceIntl?: boolean,
}

export function diffIntl(oldStr, newStr, options: JsIntlDiffOptions) {
  options = generateOptions(options, {
    langCode: 'EN',
    ignoreWhitespace: true
  });
  if (options.forceIntl || NON_SPACE_DELIMITED_LANG_CODES.includes(options.langCode)) {
    return intlDiff.diff(oldStr, newStr, options);
  } else {
    return diffWords(oldStr, newStr, options);
  }
}

export function diffIntlWithSpace(oldStr, newStr, options: JsIntlDiffOptions) {
  options = generateOptions(options, {
    langCode: 'EN'
  });
  if (options.forceIntl || NON_SPACE_DELIMITED_LANG_CODES.includes(options.langCode)) {
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

  console.log('----------')

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  console.log('Diff start');
  const result = diffWordsWithSpace(
    fs.readFileSync(path.resolve(__dirname, './jsIntlDiffTest.old.txt'), {encoding: 'utf-8'}),
    fs.readFileSync(path.resolve(__dirname, './jsIntlDiffTest.new.txt'), {encoding: 'utf-8'})
  );
  //console.log(result);
  console.log('Diff end');
}
