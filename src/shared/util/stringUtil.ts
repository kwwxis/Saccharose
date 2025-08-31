import { isUnset } from './genericUtil.ts';
import { LANG_CODE_TO_LOCALE, LangCode } from '../types/lang-types.ts';

export function isString(x: any): x is string {
  return typeof x === 'string';
}

export function isStringArray(x: any): x is string[] {
  return Array.isArray(x) && x.every(s => isString(s));
}


export function toString(x) {
  if (typeof x === 'undefined' || x === null || typeof x === 'string') {
    return x;
  }
  if (x && typeof x.toString === 'function') {
    return x.toString();
  }
  return String(x);
}

export function isStringNonEmpty(str) {
  return !!str && typeof str === 'string' && str.length;
}

export function isStringEmpty(str) {
  return !isStringNonEmpty(str);
}

export function isStringNotBlank(str) {
  return !!str && typeof str === 'string' && str.trim().length;
}

export function isStringBlank(str) {
  return !isStringNotBlank(str);
}

export function ucFirst(str: string): string {
  return str == null ? null : str.charAt(0).toUpperCase() + str.slice(1);
}

export function toLower(str: any): string {
  if (typeof str !== 'string') {
    str = String(str);
  }
  return str? str.toLowerCase() : str;
}

export function toUpper(str: any): string {
  if (typeof str !== 'string') {
    str = String(str);
  }
  return str? str.toUpperCase() : str;
}

export function strSplice(s: string, start: number, end: number, insert?: string): string {
  if (start < 0) start = 0;
  if (end > s.length) end = s.length;
  return s.slice(0, start) + (insert || '') + s.slice(end);
}

/**
 * Sentence join.
 *
 * Examples:
 *   - `sentenceJoin(['X']) -> 'X'`
 *   - `sentenceJoin(['X', 'Y']) -> 'X and Y'`
 *   - `sentenceJoin(['X', 'Y', 'Z']) -> 'X, Y, and Z'`
 */
export function sentenceJoin(s: string[], disableOxfordComma: boolean = false) {
  if (!s || !s.length) return '';
  if (s.length == 1) return s[0];
  if (s.length == 2) return s.join(' and ');
  return s.slice(0, -1).join(', ') + (disableOxfordComma ? '' : ',') + ' and ' + s[s.length - 1];
}

const titleCase_allUppercaseWords: Set<string> = new Set<string>(['ID']);
export function titleCase(s: string) {
  return !s ? s : s.replace(/(^|\b(?!(and?|at?|the|for|to|but|by|of)\b))\w+/g, word => {
    if (titleCase_allUppercaseWords.has(word.toUpperCase())) {
      return word.toUpperCase();
    }
    return word[0].toUpperCase() + word.slice(1);
  });
}

const entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

export function escapeHtml(html: any) {
  return String(html).replace(/[&<>"'`=\/]/g, s => entityMap[s]);
}

/**
 * Escape HTML but allow HTML entities like &mdash;
 * @param html
 */
export function escapeHtmlAllowEntities(html: string) {
  // same as escapeHtml but without '&'
  return String(html).replace(/[<>"'`=\/]/g, s => entityMap[s]);
}

/**
 * Escapes a string for regex.
 * from: https://stackoverflow.com/a/6969486
 */
export function escapeRegExp(str: string): string {
  return str ? str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : ''; // $& means the whole matched string
}

/**
 * Checks whether a string is a valid regex pattern.
 * @returns {boolean}
 */
export function validateRegExp(pattern: string, options?: string): boolean {
  try {
    new RegExp(pattern, options || '');
    return true;
  } catch(e) {
    return false;
  }
}

export const REGEX_ISO_8601 = /(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:[+-]\d\d:\d\d|Z)?)/;
export const PM2_TIME_PREFIX = /(?:\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:[+-]\d\d:\d\d|Z)?:\s*)?/;
export const REGEX_ISO_8601_EXACT = new RegExp('^' + REGEX_ISO_8601.source + '$');

export function concatRegExp(regs: RegExp[], flags?: string) {
  return new RegExp(regs.map(reg => reg.source).join(''), flags);
}

export function snakeToTitleCase(str: string) {
  return !str ? str : titleCase(str.replace(/_/g, ' ').toLowerCase());
}

export function snakeToUpperCamelCase(str: string) {
  return snakeToTitleCase(str).replace(/\s+/g, '');
}

export function splitCamelcase(str: string) {
  return !str ? [] : str.split(/([A-Z][a-z]+)/).map(x => x.replace('_', '')).filter(e => e);
}

export function camelCaseToTitleCase(str: string) {
  return !str ? str : titleCase(splitCamelcase(str).join(' '));
}

// This function was taken from here: https://github.com/elgs/splitargs
export function splitArgs(input: string, sep?: string | RegExp, onlyDoubleQuotes: boolean = false, keepQuotes: boolean = false): string[] {
  if (!input) return [];
  var separator = sep || /\s/g;
  var singleQuoteOpen = false;
  var doubleQuoteOpen = false;
  var tokenBuffer: string[] = [];
  var ret: string[] = [];

  var arr: string[] = input.split('');
  for (var i = 0; i < arr.length; ++i) {
    var element = arr[i];
    var matches = element.match(separator);
    if (element === '\'' && !doubleQuoteOpen && !onlyDoubleQuotes) {
      if (keepQuotes === true) {
        tokenBuffer.push(element);
      }
      singleQuoteOpen = !singleQuoteOpen;
      continue;
    } else if (element === '"' && !singleQuoteOpen) {
      if (keepQuotes === true) {
        tokenBuffer.push(element);
      }
      doubleQuoteOpen = !doubleQuoteOpen;
      continue;
    }

    if (!singleQuoteOpen && !doubleQuoteOpen && matches) {
      if (tokenBuffer.length > 0) {
        ret.push(tokenBuffer.join(''));
        tokenBuffer = [];
      } else if (!!sep) {
        ret.push(element);
      }
    } else {
      tokenBuffer.push(element);
    }
  }
  if (tokenBuffer.length > 0) {
    ret.push(tokenBuffer.join(''));
  } else if (!!sep) {
    ret.push('');
  }
  return ret;
}

export function splitLines(str: string): string[] {
  return str.split(/\r?\n|[\n\v\f\r\x85\u2028\u2029]/g);
}

export function countPrecedingWhitespace(str: string): number {
  let match = str.match(/^\s+/);
  let len = 0;
  if (Array.isArray(match)) len = match[0].length;
  return len;
}

export function trimRelative(str: string, leftpad = '', removeEmptyLines = true): string {
  let maxLen = null;

  return splitLines(str).reduce((acc, line) => {
    let len = countPrecedingWhitespace(line);

    if (maxLen == null && len < line.length) {
      maxLen = len;
    }

    if (maxLen != null && len >= maxLen) {
      line = line.slice(maxLen).trimEnd();
    } else {
      line = line.trim();
    }
    if (!line.length && removeEmptyLines) {
      return acc;
    }
    if (leftpad)
      line = leftpad + line;
    return acc + (acc.length ? '\n' : '') + line;
  }, '');
}

/**
 * If the string has the specified prefix, returns the string with that prefix replaced by
 * the specified replacement string.
 *
 * @param {string} str
 * @param {string} prefix
 * @param {string} replacement
 * @returns {string}
 */
export function replacePrefix(str: string, prefix: string, replacement: string = ''): string {
  if (str.slice(0, prefix.length) == prefix) {
    str = replacement + str.slice(prefix.length);
  }
  return str;
}

/**
 * If the string has the specified prefix, returns the string with that prefix removed.
 *
 * @param {string} str
 * @param {string} prefix
 * @returns {string}
 */
export function removePrefix(str: string, prefix: string): string {
  return replacePrefix(str, prefix);
}

/**
 * If the string has the specified suffix, returns the string with that suffix replaced by
 * the specified replacement string.
 *
 * @param {string} str
 * @param {string} suffix
 * @param {string} replacement
 * @returns {string}
 */
export function replaceSuffix(str: string, suffix: string, replacement: string = ''): string {
  if (str.slice(-suffix.length) == suffix) {
    str = str.slice(0, -suffix.length) + replacement;
  }
  return str;
}

/**
 * If the string has the specified suffix, returns the string with that suffix removed.
 *
 * @param {string} str
 * @param {string} suffix
 * @returns {string}
 */
export function removeSuffix(str: string, suffix: string): string {
  return replaceSuffix(str, suffix);
}

export const whitespace = [
  ' ',
  '\n',
  '\r',
  '\t',
  '\f',
  '\x0b',
  '\xa0',
  '\u2000',
  '\u2001',
  '\u2002',
  '\u2003',
  '\u2004',
  '\u2005',
  '\u2006',
  '\u2007',
  '\u2008',
  '\u2009',
  '\u200a',
  '\u200b',
  '\u2028',
  '\u2029',
  '\u3000',
];

export const whitespaceCombined = whitespace.join('');

/**
 * PHP trim() equivalent
 * @returns {string}
 */
export function trim(str, char_mask = undefined, mode = undefined): string {
  if (!str) {
    return str;
  }

  if (typeof str !== 'string') {
    str += '';
  }

  const l = str.length;
  let i = 0;

  if (!l) return '';

  if (char_mask) {
    char_mask = char_mask + '';
    if (!char_mask.length) return str;
  } else {
    char_mask = whitespaceCombined;
  }

  mode = mode || 1 | 2;

  // noinspection JSBitwiseOperatorUsage
  if (mode & 1) {
    for (i = 0; i < l; i++) {
      if (char_mask.indexOf(str.charAt(i)) === -1) {
        str = str.substring(i);
        break;
      }
    }
    if (i == l) return '';
  }

  // noinspection JSBitwiseOperatorUsage
  if (mode & 2) {
    for (i = l - 1; i >= 0; i--) {
      if (char_mask.indexOf(str.charAt(i)) === -1) {
        str = str.substring(0, i + 1);
        break;
      }
    }
    if (i == -1) return '';
  }

  return str;
}

/**
 * PHP ltrim() equivalent
 * @returns {string}
 */
export function ltrim(str, char_mask = undefined): string {
  return trim(str, char_mask, 1);
}

/**
 * PHP rtrim() equivalent
 * @returns {string}
 */
export function rtrim(str, char_mask = undefined): string {
  return trim(str, char_mask, 2);
}

export async function replaceAsync(str: string, regex: RegExp, asyncFn: Function): Promise<string> {
  const promises = [];
  str.replace(regex, (match, ...args) => {
    const promise = asyncFn(match, ...args);
    promises.push(promise);
    return match;
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift());
}

export function isValidRomanNumeral(str: string): boolean {
  return /^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(str);
}

export function extractRomanNumeral(str: string): string {
  return !str ? str : str.split(' ').find(s => isValidRomanNumeral(s));
}

export function replaceRomanNumerals(str: string, replacer: (roman: string) => string) {
  if (!str) {
    return str;
  }
  let split = str.split(' ');
  split = split.map(part => {
    if (isValidRomanNumeral(part)) {
      return replacer(part);
    } else {
      return part;
    }
  });
  return split.join(' ');
}

export function romanize(num: number) {
  if (isNaN(num))
    return NaN;
  let digits = String(+num).split(''),
    key = ['', 'C', 'CC', 'CCC', 'CD', 'D', 'DC', 'DCC', 'DCCC', 'CM',
      '', 'X', 'XX', 'XXX', 'XL', 'L', 'LX', 'LXX', 'LXXX', 'XC',
      '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'],
    roman = '',
    i = 3;
  while (i--)
    roman = (key[+digits.pop() + (i * 10)] || '') + roman;
  return Array(+digits.join('') + 1).join('M') + roman;
}

export function romanToInt(s: string) {
  if (!s) {
    return -1;
  }
  const sym = {
    'I': 1,
    'V': 5,
    'X': 10,
    'L': 50,
    'C': 100,
    'D': 500,
    'M': 1000,
  };
  let result = 0;
  for (let i = 0; i < s.length; i++) {
    const cur = sym[s[i]];
    const next = sym[s[i + 1]];

    if (cur < next) {
      result += next - cur; // IV -> 5 - 1 = 4
      i++;
    } else {
      result += cur;
    }
  }
  return result;
}

/**
 * Unlike [String.split(string, number)]{@link String#split}, this split method will keep parts after the limit.
 *
 * @example
 * '1_2_3_4'.split('_', 2); // => ['1', '2']
 *
 * splitLimit('1_2_3_4', '_', 2); // => ['1', '2_3_4']
 */
export function splitLimit(s: string, del: string, numParts: number): string[] {
  let limit = numParts - 1;
  let parts = s.split(del);
  if (parts.length > limit) {
    parts = parts.slice(0, limit).concat(parts.slice(limit, parts.length).join(del));
  }
  return parts;
}

export class SbOut {
  private out = '';
  private propPadLen: number = 0;
  private propPrefix: string = '';
  private propFilter: (name: string, value: string) => string;

  setPropPad(padLen: number) {
    this.propPadLen = padLen;
  }

  setPropPrefix(prefix: string) {
    this.propPrefix = prefix;
  }

  setPropFilter(filter: (name: string, value: string) => string) {
    this.propFilter = filter;
  }

  toString(noTrim: boolean = false) {
    if (noTrim) {
      return this.out;
    } else {
      return this.out.trim();
    }
  }

  get() {
    return this.out;
  }

  append(str: string) {
    this.out += str;
  }

  emptyLine() {
    this.out += '\n';
  }

  line(text?: string) {
    if (!this.out) {
      this.out += (text || '\n');
    } else {
      this.out += '\n' + (text || '');
    }
  }

  prop(propName: string, propValue: any = '', isFileValue: boolean = false) {
    if (isUnset(propValue)) {
      return;
    }
    if (typeof propValue !== 'string') {
      propValue = String(propValue);
    }
    if (this.propFilter) {
      propValue = this.propFilter(propName, propValue);
    }
    if (isUnset(propValue)) {
      return;
    }
    if (isFileValue) {
      propValue = String(propValue).replace(/[\\\/:*?"<>|]/g, '');
    }
    this.line('|' + (this.propPrefix + propName + ' ').padEnd(this.propPadLen) + '= ' + propValue);
  }

  clearOut() {
    this.out = '';
  }

  htmlComment(text: string) {
    this.line('<!-- ' + text + ' -->');
  }

  getLines(): string[] {
    return this.out.trim().split('\n');
  }

  lastLine(): string {
    if (!this.out) {
      return '';
    }
    let lines = this.getLines();
    return lines[lines.length - 1];
  }

  wtTableStart(cssClass: string = 'wikitable', cssStyle: string = 'width: 100%') {
    this.line(`{| class="${cssClass}" style="${cssStyle}"`);
  }

  wtTableRow(cells: string[], cellsOnOwnLine: boolean = false, isHeader: boolean = false) {
    let needsNewRowLine = /^\s*(\{\||\|-)/.test(this.lastLine());
    if (needsNewRowLine) {
      this.line('|-');
    }
    let ch = isHeader ? '!' : '|';
    this.line(ch + ' ');
    this.append(cells.join(cellsOnOwnLine ? ' ' + ch + ch + ' ' : '\n' + ch + ' '));
  }

  wtTableEnd() {
    this.line(`|}`);
  }
}

export const wordSplit = (langCode: LangCode, text: string): Intl.SegmentData[] => {
  const segmenter = new Intl.Segmenter(LANG_CODE_TO_LOCALE[langCode], { granularity: 'word' });
  return Array.from(segmenter.segment(text));
};

export const wordRejoin = (segments: Intl.SegmentData[]): string => {
  return segments.map(s => s.segment).join('');
};

/**
 * Removes the first word at the start of the segments.
 *
 * Modifies the segments passed in and returns the removed word segments.
 *
 * @param segments
 */
export function takeFromStartUntilFirstWord(segments: Intl.SegmentData[]): Intl.SegmentData[] {
  let i = 0;
  for (let segment of segments) {
    i++;
    if (segment.isWordLike) {
      break;
    }
  }
  return segments.splice(0, i);
}

/**
 * Removes the last word at the end of the segments.
 *
 * Modifies the segments passed in and returns the removed word segments.
 *
 * @param segments
 */
export function takeFromEndUntilLastWord(segments: Intl.SegmentData[]): Intl.SegmentData[] {
  let i = 0;
  for (let segment of segments.slice().reverse()) {
    i++;
    if (segment.isWordLike) {
      break;
    }
  }
  return segments.splice(-i);
}

export function toParam(x: any): string {
  if (isUnset(x)) {
    return '';
  }
  return encodeURIComponent(String(x).replace(/ /g, '_'));
}

export function fromParam(param: string): string {
  if (isUnset(param)) {
    return '';
  }
  return decodeURIComponent(param).replace(/_/g, ' ');
}

export function paramCmp(a: any, b: any) {
  if (a === b) {
    return true;
  }
  return String(a).trim().toLowerCase().replace(/_/g, ' ') === String(b).trim().toLowerCase().replace(/_/g, ' ');
}
