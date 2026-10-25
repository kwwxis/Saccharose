import { isUnset } from './genericUtil.ts';

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

/**
 * Concatenates multiple RegExp objects into a single RegExp.
 * @param regs An array of RegExp objects to concatenate.
 * @param flags Optional flags for the resulting RegExp.
 * @returns A new RegExp that matches the concatenation of the input RegExps.
 */
export function concatRegExp(regs: RegExp[], flags?: string) {
  return new RegExp(regs.map(reg => reg.source).join(''), flags);
}

/**
 * Handles creating regexes from strings like:
 *
 * ```js
 * console.log(toRegExp("/a\\/b/gi"));   // /a\/b/gi
 * console.log(toRegExp("/a/b/gi"));     // /a/b/gi
 * console.log(toRegExp("/^asdf$/i"));   // /^asdf$/i
 * console.log(toRegExp("/^asdf$/"));    // /^asdf$/
 * console.log(toRegExp("^asdf$"));      // /^asdf$/
 * console.log(toRegExp("/foo/xyz"));    // /foo/  (invalid flags ignored)
 * console.log(toRegExp("/[a-z]+/d"));   // /[a-z]+/d
 * console.log(toRegExp("plain-text"));  // /plain-text/
 * ```
 *
 * @param input
 */
export function toRegExp(input: string) {
  if (typeof input !== "string") throw new TypeError("Input must be a string");

  input = input.trim();

  // Must start and end with /.../
  if (input.startsWith("/") && input.length > 1) {
    // Find the last unescaped slash
    let end = input.length - 1;
    while (end > 0) {
      if (input[end] === "/" && input[end - 1] !== "\\") break;
      end--;
    }

    if (end > 0) {
      const pattern = input.slice(1, end);
      let flags = input.slice(end + 1).trim();

      // Allow only valid JS RegExp flags
      const validFlags = /^[gimsuyd]*$/;
      if (!validFlags.test(flags)) {
        // If invalid flags, treat entire thing as pattern
        flags = "";
      }

      try {
        return new RegExp(pattern, flags);
      } catch {
        // fallback for malformed regex
        return new RegExp(input);
      }
    }
  }

  try {
    return new RegExp(input);
  } catch {
    return new RegExp(escapeRegExp(input));
  }
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

/**
 * Splits a string into an array of lines, handling various newline characters including CR, LF, CRLF, and Unicode line separators.
 * @param str The string to split into lines.
 * @returns An array of lines.
 */
export function splitLines(str: string): string[] {
  return str.split(/\r?\n|[\n\v\f\r\x85\u2028\u2029]/g);
}

/**
 * Counts the number of whitespace characters at the beginning of a string.
 * @param str The string to count leading whitespace in.
 * @returns The number of leading whitespace characters.
 */
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

/**
 * List of whitespace characters, including non-breaking spaces and other Unicode whitespace characters.
 */
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

/**
 * A string containing all whitespace characters combined, for use in trimming functions.
 */
export const whitespaceCombined = whitespace.join('');

/**
 * Trims whitespace or specified characters from the beginning and/or end of a string.
 *
 * This is the equivalent of PHP's `trim()` function.
 *
 * @param str The string to trim. If not a string, it will be converted to a string.
 * @param char_mask Optional string of characters to trim. If not provided, all whitespace characters will be trimmed.
 * @param mode Optional bitwise mode to specify which side(s) to trim: 1 for left, 2 for right, 3 for both (default).
 * @returns The trimmed string.
 */
export function trim(str: any, char_mask: any = undefined, mode: number = undefined): string {
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

/**
 * Asynchronously replaces matches of a regex in a string using an asynchronous function.
 *
 * @param str The input string to perform replacements on.
 * @param regex The regular expression to match substrings for replacement.
 * @param asyncFn An asynchronous function that takes a match and returns a Promise resolving to the replacement string.
 * The arguments follow the format of [Specifying a function as the replacement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_function_as_the_replacement)
 * @returns A Promise that resolves to the modified string with all replacements applied.
 */
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

/**
 * A utility class representing a StringBuilder (Sb) for building strings with various wikitext-related formatting options.
 */
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

/**
 * Takes in a JSON string and reformats arrays of primitive values (numbers, strings, booleans, null) to be compacted
 * into a single line, while leaving any other unrelated formatting intact.
 *
 * @param jsonStr
 */
export function reformatPrimitiveArrays(jsonStr: string): string {
  function isWhitespace(ch: string): boolean {
    return ch === " " || ch === "\n" || ch === "\r" || ch === "\t";
  }

  function skipWhitespace(i: number): number {
    while (i < jsonStr.length && isWhitespace(jsonStr[i])) i++;
    return i;
  }

  function scanString(i: number): number {
    // jsonStr[i] must be '"'
    i++;

    while (i < jsonStr.length) {
      const ch = jsonStr[i];

      if (ch === "\\") {
        // Skip escaped character, including escaped quote/backslash/etc.
        i += 2;
        continue;
      }

      if (ch === '"') {
        return i + 1;
      }

      i++;
    }

    throw new Error("Invalid JSON string: unterminated string");
  }

  function scanPrimitive(i: number): number | null {
    i = skipWhitespace(i);

    if (jsonStr[i] === '"') {
      return scanString(i);
    }

    const rest = jsonStr.slice(i);

    const literalMatch = /^(true|false|null)/.exec(rest);
    if (literalMatch) {
      return i + literalMatch[0].length;
    }

    // JSON number grammar, not just \d+(\.\d+)?
    const numberMatch = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(rest);
    if (numberMatch) {
      return i + numberMatch[0].length;
    }

    return null;
  }

  function compactArrayIfPrimitive(start: number): { end: number; replacement: string } | null {
    // jsonStr[start] must be '['
    let i = skipWhitespace(start + 1);
    const rawItems: string[] = [];

    if (jsonStr[i] === "]") {
      return {
        end: i + 1,
        replacement: "[]",
      };
    }

    while (i < jsonStr.length) {
      const itemStart = skipWhitespace(i);
      const itemEnd = scanPrimitive(itemStart);

      if (itemEnd === null) {
        return null;
      }

      rawItems.push(jsonStr.slice(itemStart, itemEnd));

      i = skipWhitespace(itemEnd);

      if (jsonStr[i] === ",") {
        i = skipWhitespace(i + 1);
        continue;
      }

      if (jsonStr[i] === "]") {
        return {
          end: i + 1,
          replacement: `[ ${rawItems.join(", ")} ]`,
        };
      }

      return null;
    }

    return null;
  }

  let result = "";
  let i = 0;

  while (i < jsonStr.length) {
    const ch = jsonStr[i];

    if (ch === '"') {
      const end = scanString(i);
      result += jsonStr.slice(i, end);
      i = end;
      continue;
    }

    if (ch === "[") {
      const compacted = compactArrayIfPrimitive(i);

      if (compacted) {
        result += compacted.replacement;
        i = compacted.end;
        continue;
      }
    }

    result += ch;
    i++;
  }

  return result;
}

/**
 * Computes a relevance rank for how well `text` matches `searchText`, for use when sorting search results so
 * that the best matches come first. Lower rank is better. An exact (case-normalized) match ranks highest (0),
 * followed by prefix/suffix matches (1), then any other substring match (2), with everything else last (3).
 */
export function textMatchRank(searchText: string, text: string, caseInsensitive: boolean = true): number {
  if (!text || !searchText) {
    return 3;
  }
  const needle: string = caseInsensitive ? searchText.toLowerCase() : searchText;
  const haystack: string = caseInsensitive ? text.toLowerCase() : text;
  if (haystack === needle) {
    return 0;
  }
  if (haystack.startsWith(needle) || haystack.endsWith(needle)) {
    return 1;
  }
  if (haystack.includes(needle)) {
    return 2;
  }
  return 3;
}

/**
 * Collects `(id, text)` pairs reported by a {@link TextMapSearchIndexStreamOpts.stream} callback (deduping by
 * `id`), then produces a list of ids ordered so that the best text matches to `searchText` come first (see
 * {@link textMatchRank}). Ids that are added via `prependIds` (e.g. an id that was matched directly rather than
 * via text search) are always placed before the ranked ids, in the order given.
 */
export function createTextMatchRanker(searchText: string, caseInsensitive: boolean = true) {
  const seenIds: Set<number> = new Set();
  const matches: { id: number, text: string }[] = [];
  return {
    add(id: number, text: string): void {
      if (!seenIds.has(id)) {
        seenIds.add(id);
        matches.push({ id, text });
      }
    },
    has(id: number): boolean {
      return seenIds.has(id);
    },
    orderedIds(prependIds: number[] = []): number[] {
      const ranked: number[] = matches.slice().sort((a, b) => {
        const rankDiff: number = textMatchRank(searchText, a.text, caseInsensitive) - textMatchRank(searchText, b.text, caseInsensitive);
        if (rankDiff !== 0) {
          return rankDiff;
        }
        return (a.text?.length ?? 0) - (b.text?.length ?? 0);
      }).map(m => m.id);

      const result: number[] = [];
      for (const id of prependIds) {
        if (!result.includes(id)) {
          result.push(id);
        }
      }
      for (const id of ranked) {
        if (!result.includes(id)) {
          result.push(id);
        }
      }
      return result;
    }
  };
}
