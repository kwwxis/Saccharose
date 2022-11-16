import moment from 'moment';
import { v4 as _uuidv4 } from 'uuid';

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

export function toInt(x: any): number {
  if (typeof x === 'number') {
    return Math.floor(x);
  } else if (typeof x === 'string') {
    try {
      return parseInt(x);
    } catch (e) {
      return NaN;
    }
  } else {
    return NaN;
  }
}

export const TRUTHY_STRINGS = new Set(['t', 'true', '1', 'y', 'yes', 'on', 'en', 'enable', 'enabled',
  'active', 'activated', 'positive', 'allow', 'allowed', '+', '+', '✓', '✔', '🗸', '☑', '🗹', '✅']);

export function toBoolean(x: any): boolean {
  if (typeof x === 'boolean') {
    return x;
  } else if (typeof x === 'string') {
    return TRUTHY_STRINGS.has(x.toLowerCase().trim());
  } else if (typeof x === 'number') {
    return x > 0;
  } else {
    return !!x;
  }
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

export function trimRelative(str: string, leftpad='', removeEmptyLines = true): string {
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

export function isInt(x: any): boolean {
  return !isNaN(parseInt(x));
}

/**
 * Checks if input object is a Promise.
 * @returns {boolean} true if promise, false otherwise
 */
export function isPromise(o): boolean {
  return (
    o &&
    (o instanceof Promise ||
      Promise.resolve(o) === o ||
      Object.prototype.toString.call(o) === '[object Promise]' ||
      typeof o.then === 'function')
  );
};
/**
 * Generate new GUID.
 * @returns {string}
 */
export function uuidv4(): string {
  return _uuidv4();
};
/**
 * Add slashes.
 * @param {string} str
 * @returns {string}
 */
export function addslashes(str: string): string {
  return String(str).replace(/[\\"'`]/g, '\\$&').replace(/\u0000/g, '\\0');
};
/**
 * Escapes a string for regex.
 * from: https://stackoverflow.com/a/6969486
 * @param {string} str
 * @returns {string}
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
};
/**
 * Format a date.
 *
 * @param {Date|number} UNIX_timestamp date object or unix timestamp integer
 * @param {boolean|string} [format] true for only date, false for date and time, or string for
 * custom format (moment.js format)
 * @param {number} [tzOffset] e.g. `-8`
 * @param {string} [tzAbrv] e.g. 'PST' or 'GMT'
 * @returns {string}
 */
export function timeConvert(UNIX_timestamp: Date|number, format: boolean|string = undefined, tzOffset: number = null, tzAbrv: string = null): string {
  if (!UNIX_timestamp) {
    return String(UNIX_timestamp);
  }

  if (UNIX_timestamp instanceof Date) {
    var a = moment(UNIX_timestamp);
  } else if (typeof UNIX_timestamp === 'number') {
    var a = moment(UNIX_timestamp * 1000);
  } else {
    return String(UNIX_timestamp);
  }

  if (typeof format !== 'string') {
    format = format ? 'MMM DD YYYY' : 'MMM DD YYYY hh:mm:ss a';
  }

  if (tzOffset && tzAbrv) {
    let ret = a.utcOffset(tzOffset).format(format);
    ret += ' ' + tzAbrv;
    return ret;
  } else {
    return a.format(format);
  }
};
/**
 * Returns time in formats such as `X days ago` or `X seconds ago`
 *
 * @param {Date} time
 * @param {string} [suffix] by default uses 'from now' or 'ago' based on whether input time is
 * before or after current time, or uses specified `suffix` parameter if provided
 * @returns {string}
 */
export function human_timing(time: Date|number|null, suffix: string): string {
  suffix = suffix || null;

  if (time instanceof Date) time = (time.getTime() / 1000) | 0;
  if (time === null) return null;
  if (time <= 0) return 'never';

  time = Math.floor(Date.now() / 1000) - time;
  suffix = suffix ? suffix : time < 0 ? 'from now' : 'ago';
  time = Math.abs(time);

  if (time <= 1) return 'Just now';

  var tokens = [
    [31536000, 'year'],
    [2592000, 'month'],
    [604800, 'week'],
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
    [1, 'second'],
  ];

  var ret = null;

  for (let i = 0; i < tokens.length; i++) {
    let token = tokens[i];
    var unit = <number> token[0];
    var text = <string> token[1];

    if (time < unit) continue;

    var numberOfUnits = Math.floor(time / unit);
    ret = numberOfUnits + ' ' + text + (numberOfUnits > 1 ? 's' : '') + ' ' + suffix;
    break;
  }

  return ret;
};

/**
 * If the string has the specified prefix, returns the string with that prefix replaced by
 * the specified replacement string.
 *
 * @param {string} str
 * @param {string} prefix
 * @param {string} replacement
 * @returns {string}
 */
export function replace_prefix(str: string, prefix: string, replacement: string = ''): string {
  if (str.slice(0, prefix.length) == prefix) {
    str = replacement + str.slice(prefix.length);
  }
  return str;
};

/**
 * If the string has the specified prefix, returns the string with that prefix removed.
 *
 * @param {string} str
 * @param {string} prefix
 * @returns {string}
 */
export function remove_prefix(str: string, prefix: string): string {
  return this.replace_prefix(str, prefix);
};

/**
 * If the string has the specified suffix, returns the string with that suffix replaced by
 * the specified replacement string.
 *
 * @param {string} str
 * @param {string} suffix
 * @param {string} replacement
 * @returns {string}
 */
export function replace_suffix(str: string, suffix: string, replacement: string = ''): string {
  if (str.slice(-suffix.length) == suffix) {
    str = str.slice(0, -suffix.length) + replacement;
  }
  return str;
};

/**
 * If the string has the specified suffix, returns the string with that suffix removed.
 *
 * @param {string} str
 * @param {string} suffix
 * @returns {string}
 */
export function remove_suffix(str: string, suffix: string): string {
  return this.replace_suffix(str, suffix);
};

/**
 * Checks whether a string is a valid regex pattern.
 * @returns {boolean}
 */
export function validate_regex(pattern, options): boolean {
  try {
    new RegExp(pattern, options || '');
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * PHP trim() equivalent
 * @returns {string}
 */
export function trim(str, char_mask = undefined, mode = undefined): string {
  if (typeof str !== 'string') {
    str += '';
  }

  var l = str.length,
    i = 0;

  if (!l) return '';

  if (char_mask) {
    char_mask = char_mask + '';
    if (!char_mask.length) return str;
  } else {
    char_mask = this.whitespaceCombined;
  }

  mode = mode || 1 | 2;

  if (mode & 1) {
    for (i = 0; i < l; i++) {
      if (char_mask.indexOf(str.charAt(i)) === -1) {
        str = str.substring(i);
        break;
      }
    }
    if (i == l) return '';
  }

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
};

/**
 * PHP ltrim() equivalent
 * @returns {string}
 */
export function ltrim(str, char_mask = undefined): string {
  return this.trim(str, char_mask, 1);
};

/**
 * PHP rtrim() equivalent
 * @returns {string}
 */
export function rtrim(str, char_mask = undefined): string {
  return this.trim(str, char_mask, 2);
};

/**
 * Escapes a string for HTML.
 *
 * @param {string} text
 * @returns {string} escaped text
 */
export function escapeHtml(text: string, onlyBrackets: boolean = false): string {
  var map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  if (onlyBrackets) {
    return text.replace(/[<>]/g, (m) => map[m]);
  } else {
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
};