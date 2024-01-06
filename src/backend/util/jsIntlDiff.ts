import { BaseOptions, Diff, diffWordsWithSpace, WordsOptions } from 'diff';
import { pathToFileURL } from 'url';

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
  const segmenter = new Intl.Segmenter(this.options.locale, { granularity: 'word' });
  return Array.from(segmenter.segment(value)).map(s => s.segment);
};

export function generateOptions(options, defaults) {
  if (typeof options === 'function') {
    defaults.callback = options;
  } else if (options) {
    for (let name in options) {
      if (options.hasOwnProperty(name)) {
        defaults[name] = options[name];
      }
    }
  }
  return defaults;
}

export interface JsIntlDiffOptions extends WordsOptions {
  locale: string
}

export function diffIntl(oldStr, newStr, options: JsIntlDiffOptions) {
  options = generateOptions(options, {
    locale: 'en-US',
    ignoreWhitespace: true
  });
  return intlDiff.diff(oldStr, newStr, options);
}

export function diffIntlWithSpace(oldStr, newStr, options: JsIntlDiffOptions) {
  options = generateOptions(options, {
    locale: 'en-US'
  });
  return intlDiff.diff(oldStr, newStr, options);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log('Intl:', diffIntlWithSpace(
    `The quick brown fox jumps over the lazy dog!`,
    `The very quick red fox jumps over the lazy dog!`,
    {
      locale: 'en-US'
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
      locale: 'ja-JP'
    }
  ));

  console.log('Words:', diffWordsWithSpace(
    '素早い青いキツネが怠惰な犬を飛び越えます。',
    '素早いアカギツネが怠惰な犬を飛び越えます。'
  ));
}
