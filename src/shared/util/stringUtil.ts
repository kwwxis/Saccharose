export function toString(x) {
    if (typeof x === 'undefined' || x === null || typeof x === 'string') {
        return x;
    }
    if (x && typeof x.toString === 'function') {
        return x.toString()
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

export function sentenceJoin(s: string[]) {
    if (!s || !s.length) return '';
    if (s.length == 1) return s[0];
    if (s.length == 2) return s.join(' and ');
    return s.slice(0, -1).join(', ') + ' and ' + s[s.length - 1];
}

export function titleCase(s: string) {
    return !s ? s : s.replace(/(^|\b(?!(and?|at?|the|for|to|but|by|of)\b))\w+/g, word => word[0].toUpperCase() + word.slice(1));
}

const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};

export function escapeHtml(html: string) {
    return String(html).replace(/[&<>"'`=\/]/g,  s => entityMap[s]);
}

/**
 * Escape HTML but allow HTML entities like &mdash;
 * @param html
 */
export function escapeHtmlAllowEntities(html: string) {
    // same as escapeHtml but without '&'
    return String(html).replace(/[<>"'`=\/]/g,  s => entityMap[s]);
}

/**
 * Escapes a string for regex.
 * from: https://stackoverflow.com/a/6969486
 */
export function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}


export function snakeToTitleCase(str: string) {
    return !str ? str : titleCase(str.replace(/_/g, ' ').toLowerCase());
}

export function snakeToUpperCamelCase(str: string) {
    return snakeToTitleCase(str).replace(/\s+/g, '');
}

export function splitCamelcase(str: string) {
    return !str ? [] : str.split(/([A-Z][a-z]+)/).filter(e => e);
}

export function camelCaseToTitleCase(str: string) {
    return !str ? str : titleCase(splitCamelcase(str).join(' '));
}

// This function was taken from here: https://github.com/elgs/splitargs
export function splitArgs(input: string, sep?: string|RegExp, onlyDoubleQuotes: boolean = false, keepQuotes: boolean = false): string[] {
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
        if (element === "'" && !doubleQuoteOpen && !onlyDoubleQuotes) {
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
 * Generate new GUID.
 * @returns {string}
 */
export function uuidv4(): string {
    return (`${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`).replace(/[018]/g, (c: any) =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16),
    );
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
export function replace_prefix(str: string, prefix: string, replacement: string = ''): string {
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
export function remove_prefix(str: string, prefix: string): string {
    return this.replace_prefix(str, prefix);
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
export function replace_suffix(str: string, suffix: string, replacement: string = ''): string {
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
export function remove_suffix(str: string, suffix: string): string {
    return this.replace_suffix(str, suffix);
}

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
    return this.trim(str, char_mask, 1);
}

/**
 * PHP rtrim() equivalent
 * @returns {string}
 */
export function rtrim(str, char_mask = undefined): string {
    return this.trim(str, char_mask, 2);
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