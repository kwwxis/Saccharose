import moment from 'moment/moment';

export type Type<T> = { new (...args: any[]): T };

export function isUnset(x: any): boolean {
    return x === null || typeof x === 'undefined';
}

export function isset(x: any): boolean {
    return !isUnset(x);
}

export function isEmpty(x: any): boolean {
    if (typeof x === 'boolean' || typeof x === 'number') {
        return false; // don't consider any booleans or numbers to be empty
    }
    return !x || (typeof x === 'string' && !x.trim().length) || (Array.isArray(x) && !x.length) || (typeof x === 'object' && !Object.keys(x).length);
}

export function isNotEmpty(x: any): boolean {
    return !isEmpty(x);
}

/**
 * Checks if input object is a Promise.
 * @returns {boolean} true if a promise, false otherwise
 */
export function isPromise(o): boolean {
    return (
      o &&
      (o instanceof Promise ||
        Promise.resolve(o) === o ||
        Object.prototype.toString.call(o) === '[object Promise]' ||
        typeof o.then === 'function')
    );
}

export function toVoidPromise(x: Promise<any>): Promise<void> {
    return x.then(() => {});
}

export function strToBool(s: string) {
    if (!s) return false;
    s = s.toLowerCase();
    return (s === 'true' || s === 'yes' || s === 'y' || s === '1');
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
export function timeConvert(UNIX_timestamp: Date | number, format: boolean | string = undefined, tzOffset: number = null, tzAbrv: string = null): string {
    if (!UNIX_timestamp) {
        return String(UNIX_timestamp);
    }

    let a;
    if (UNIX_timestamp instanceof Date) {
        a = moment(UNIX_timestamp);
    } else if (typeof UNIX_timestamp === 'number') {
        a = moment(UNIX_timestamp * 1000);
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
}

/**
 * Returns time in formats such as `X days ago` or `X seconds ago`
 *
 * @param {Date} time
 * @param {string} [suffix] by default uses 'from now' or 'ago' based on whether input time is
 * before or after current time, or uses specified `suffix` parameter if provided
 * @returns {string}
 */
export function human_timing(time: Date | number | null, suffix?: string): string {
    suffix = suffix || null;

    if (time instanceof Date) time = (time.getTime() / 1000) | 0;
    if (time === null) return null;
    if (time <= 0) return 'never';

    time = Math.floor(Date.now() / 1000) - time;
    suffix = suffix ? suffix : time < 0 ? 'from now' : 'ago';
    time = Math.abs(time);

    if (time <= 1) return 'Just now';

    const tokens = [
        [31536000, 'year'],
        [2592000, 'month'],
        [604800, 'week'],
        [86400, 'day'],
        [3600, 'hour'],
        [60, 'minute'],
        [1, 'second'],
    ];

    let ret = null;

    for (let i = 0; i < tokens.length; i++) {
        let token = tokens[i];
        let unit = <number>token[0];
        let text = <string>token[1];

        if (time < unit) continue;

        let numberOfUnits = Math.floor(time / unit);
        ret = numberOfUnits + ' ' + text + (numberOfUnits > 1 ? 's' : '') + ' ' + suffix;
        break;
    }

    return ret;
}

export function shallowClone(o: any): any {
    if (Array.isArray(o)) {
        return [... o];
    } else {
        return Object.assign({}, o);
    }
}

/**
 * Checks if the given object contains any circular references.
 * @param obj The object to check.
 */
export function hasCyclicRefs(obj: any): boolean {
    let queue: any[] = [obj];
    const seen = new WeakSet();
    while (queue.length) {
        let o = queue.shift();
        for (let k in o) {
            if (o[k] !== null && typeof o[k] === 'object') {
                if (seen.has(obj)) {
                    return true;
                }
                seen.add(obj);
                queue.push(o[k]);
            }
        }
    }
    return false;
}

/**
 * Removes any circular references from an object **in-place**.
 */
export function removeCyclicRefs<T>(obj: T, cyclicValueReplacer?: CyclicValueReplacer): T {
    let queue: any[] = [obj];
    let cr = getCircularReplacer(cyclicValueReplacer);

    while (queue.length) {
        let o = queue.shift();
        for (let k in o) {
            let nv = cr(k, o[k]);
            if (typeof nv === 'undefined') {
                delete o[k];
            } else {
                o[k] = nv;
            }
            if (o[k] !== null && typeof o[k] === 'object') {
                queue.push(o[k]);
            }
        }
    }
    return obj;
}

export type CyclicValueReplacer = (cyclicKey: string, cyclicValue: any) => any;

function getCircularReplacer(cyclicValueReplacer?: CyclicValueReplacer) {
    const seen = new WeakSet();
    return (key: string, value: any) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                if (cyclicValueReplacer) {
                    return cyclicValueReplacer(key, value);
                } else {
                    return;
                }
            }
            seen.add(value);
        }
        return value;
    };
};

/**
 * Stringifies JSON with circular references removed.
 * @param data
 */
export function safeStringify(data: any) {
    return JSON.stringify(data, getCircularReplacer());
}