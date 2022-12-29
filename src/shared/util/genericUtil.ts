import moment from 'moment/moment';
import { arrayContains, isArrayLike, isIterable } from './arrayUtil';

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
    } else if (typeof x === 'string') {
        return !x.trim().length;
    } else if (Array.isArray(x)) {
        return x.length === 0;
    } else if (isArrayLike(x)) {
        return x.length === 0;
    } else if (x instanceof Map) {
        return x.size === 0;
    } else if (x instanceof Set) {
        return x.size === 0;
    } else if (isIterable(x)) {
        return [... x[Symbol.iterator]()].length === 0;
    } else if (typeof x === 'object') {
        return Object.keys(x).length === 0;
    } else {
        return !x;
    }
}

export function isNotEmpty(x: any): boolean {
    return !isEmpty(x);
}

export function includes<T>(obj: any, item: any) {
    if (typeof obj === 'string' && typeof item === 'string') {
        return obj.includes(item);
    } else if (Array.isArray(obj)) {
        return obj.includes(item);
    } else if (isArrayLike(obj)) {
        return arrayContains(<any> obj, item);
    } else if (obj instanceof Map) {
        return [... obj.entries()].includes(item);
    } else if (obj instanceof Set) {
        return obj.has(item);
    } else if (isIterable(obj)) {
        return [... obj[Symbol.iterator]()].includes(item);
    } else {
        return false;
    }
}

export function notIncludes(obj: any, item: any) {
    return !includes(obj, item);
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

export const TRUTHY_STRINGS = new Set(['t', 'true', '1', 'y', 'yes', 'on', 'en', 'enable', 'enabled',
    'active', 'activated', 'positive', 'allow', 'allowed', '+', '+', '✓', '✔', '🗸', '☑', '🗹', '✅']);

export function toBoolean(x: any): boolean {
    if (typeof x === 'boolean') {
        return x;
    } else if (typeof x === 'string') {
        return TRUTHY_STRINGS.has(x.toLowerCase().trim());
    } else if (typeof x === 'number') {
        return x > 0;
    } else if (Array.isArray(x) || isArrayLike(x)) {
        return x.length > 0;
    } else if (x instanceof Map || x instanceof Set) {
        return x.size > 0;
    } else if (isIterable(x)) {
        return [... x[Symbol.iterator]()].length > 0;
    } else {
        return !!x;
    }
}

/**
 * Format a date.
 *
 * @param UNIX_timestamp The timestamp, either as a Date object or as a UNIX timestamp (milliseconds).
 * @param format true for only date (`MMM DD YYYY`), falsy for date and time (`MMM DD YYYY hh:mm:ss a`), or string for custom format (moment.js format)
 * @param tzOffset e.g. `-8`
 * @param tzAbrv e.g. 'PST' or 'GMT'
 */
export function timeConvert(UNIX_timestamp: Date | number, format: boolean | string = undefined, tzOffset: number = null, tzAbrv: string = null): string {
    if (!UNIX_timestamp) {
        return String(UNIX_timestamp);
    }

    let a;
    if (UNIX_timestamp instanceof Date) {
        a = moment(UNIX_timestamp);
    } else if (typeof UNIX_timestamp === 'number') {
        a = moment(UNIX_timestamp);
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
 * @param time The timestamp, either as a Date object or as a UNIX timestamp (milliseconds).
 * @param suffix The suffix. Default is `from now` or `ago` depending on whether the time is in the future or in the past.
 * @param currentTime The timestamp to use as the "current time".
 */
export function humanTiming(time: Date | number | null, suffix?: string|((inPast: boolean) => string), currentTime?: Date|number): string {
    suffix = suffix || null;

    if (time instanceof Date)
        time = time.getTime();
    if (typeof time === 'undefined' || time === null || time <= 0)
        return 'never';
    if (currentTime instanceof Date)
        currentTime = currentTime.getTime();
    if (!currentTime)
        currentTime = Date.now();

    // convert from MS to seconds:
    time = (time / 1000) | 0;
    currentTime = (currentTime / 1000 | 0);

    // get delta:
    time = currentTime - time;
    let inFuture = time < 0;
    time = Math.abs(time);

    if (suffix && typeof suffix == 'function') {
        suffix = suffix(inFuture);
    }
    if (typeof suffix === 'undefined' || suffix === null) {
        suffix = inFuture ? 'from now' : 'ago';
    }

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
}

/**
 * Stringifies JSON with circular references removed.
 * @param data
 */
export function safeStringify(data: any) {
    return JSON.stringify(data, getCircularReplacer());
}

type CompareTernaryMode = 'equals' | 'notEquals' | 'includes' | 'notIncludes' | 'isEmpty' | 'isNotEmpty'
  | 'isTruthy' | 'isFalsy' | 'isGreaterThan' | 'isLessThan' | 'isGreaterThanOrEqual' | 'isLessThanOrEqual';
type CompareTernaryComparison<T> = {value: T, mode: CompareTernaryMode};

export class CompareTernaryGroup<T> {
    protected value: T;
    protected comparisons: (CompareTernaryComparison<T>|CompareTernaryGroup<T>)[] = [];
    protected chainMode: 'or' | 'and' = null;
    protected flagAllowChain: boolean = true;
    protected flagIgnoreCase: boolean = false;

    protected constructor(value: T) {
        this.value = value;
    }

    private addComparison(value: T, mode: CompareTernaryMode): this {
        if (!this.flagAllowChain) {
            throw 'CompareTernary: must use .or/.and to chain';
        }
        this.flagAllowChain = false;
        this.comparisons.push({value, mode});
        return this;
    }

    get or(): this {
        if (this.chainMode === 'and') {
            throw 'Cannot change chain mode to "or" after it has already been set to "and"';
        }
        this.chainMode = 'or';
        this.flagAllowChain = true;
        return this;
    }

    get and(): this {
        if (this.chainMode === 'or') {
            throw 'Cannot change chain mode to "and" after it has already been set to "or"';
        }
        this.chainMode = 'and';
        this.flagAllowChain = true;
        return this;
    }

    ignoreCase(): this {
        this.flagIgnoreCase = true;
        return this;
    }

    equals(value: T): this {
        return this.addComparison(value, 'equals');
    }

    notEquals(value: T): this {
        return this.addComparison(value, 'equals');
    }

    includes(value: T): this {
        return this.addComparison(value, 'includes');
    }

    notIncludes(value: T): this {
        return this.addComparison(value, 'notIncludes');
    }

    isEmpty(): this {
        return this.addComparison(null, 'isEmpty');
    }

    isNotEmpty(): this {
        return this.addComparison(null, 'isNotEmpty');
    }

    isTruthy(): this {
        return this.addComparison(null, 'isTruthy');
    }

    isFalsy(): this {
        return this.addComparison(null, 'isFalsy');
    }

    isGreaterThan(value: T) {
        return this.addComparison(value as any, 'isGreaterThan');
    }

    isLessThan(value: T) {
        return this.addComparison(value as any, 'isLessThan');
    }

    isGreaterThanOrEqual(value: T) {
        return this.addComparison(value as any, 'isGreaterThanOrEqual');
    }

    isLessThanOrEqual(value: T) {
        return this.addComparison(value as any, 'isLessThanOrEqual');
    }

    group(callback: (group: CompareTernaryGroup<T>) => void): this {
        let newGroup = new CompareTernaryGroup(this.value);
        this.comparisons.push(newGroup);
        callback(newGroup);
        return this;
    }

    protected cmpResult() {
        if (!this.comparisons.length) {
            return true;
        }
        if (this.flagIgnoreCase && typeof this.value === 'string') {
            this.value = <T> <any> this.value.toUpperCase();
        }
        if (!this.chainMode) {
            this.chainMode = 'or';
        }
        let fullResult = this.chainMode === 'and';
        for (let cmp of this.comparisons) {
            let cmpResult = false;
            if (cmp instanceof CompareTernaryGroup) {
                cmpResult = cmp.cmpResult();
            } else {
                if (this.flagIgnoreCase && typeof cmp.value === 'string') {
                    cmp.value = <T> <any> cmp.value.toUpperCase();
                }
                switch (cmp.mode) {
                    case 'equals':
                        cmpResult = this.value === cmp.value;
                        break;
                    case 'notEquals':
                        cmpResult = this.value !== cmp.value;
                        break;
                    case 'includes':
                        cmpResult = includes(this.value, cmp.value);
                        break;
                    case 'notIncludes':
                        cmpResult = notIncludes(this.value, cmp.value);
                        break;
                    case 'isEmpty':
                        cmpResult = isEmpty(this.value);
                        break;
                    case 'isNotEmpty':
                        cmpResult = isNotEmpty(this.value);
                        break;
                    case 'isTruthy':
                        cmpResult = toBoolean(this.value);
                        break;
                    case 'isFalsy':
                        cmpResult = !toBoolean(this.value);
                        break;
                    case 'isLessThan':
                        cmpResult = this.value < cmp.value;
                        break;
                    case 'isGreaterThan':
                        cmpResult = this.value > cmp.value;
                        break;
                    case 'isLessThanOrEqual':
                        cmpResult = this.value <= cmp.value;
                        break;
                    case 'isGreaterThanOrEqual':
                        cmpResult = this.value >= cmp.value;
                        break;
                }
            }
            if (this.chainMode === 'or' && cmpResult) {
                return true;
            }
            if (this.chainMode === 'and') {
                fullResult &&= cmpResult;
            }
        }
        return fullResult;
    }
}

export class CompareTernary<T> extends CompareTernaryGroup<T> {
    private defaultElseValue: any = undefined;

    constructor(value: T) {
        super(value);
    }

    setDefaultElse(elseValue: any): CompareTernary<T> {
        this.defaultElseValue = elseValue;
        return this;
    }

    then<R>(thenValue: R, elseValue?: R): R {
        if (typeof elseValue === 'undefined') {
            elseValue = this.defaultElseValue;
        }
        return this.cmpResult() ? thenValue : elseValue;
    }
}

export function ternary<T>(value: T): CompareTernary<T> {
    return new CompareTernary(value);
}

export function throttle<T extends Function>(fn: T, delayMs: number): T {
    let lastTime: number = 0;
    return <T> <any> function(... args) {
        let now: number = new Date().getTime();
        if (now - lastTime >= delayMs) {
            fn(... args);
            lastTime = now;
        }
    };
}