// noinspection RedundantIfStatementJS

import moment from 'moment';
import { arrayContains, isArrayLike, isIterable } from './arrayUtil.ts';
import cloneDeep from 'clone-deep';
import { sentenceJoin } from './stringUtil.ts';
import { escapeHtml } from './stringHtmlUtil.ts';

export type Type<T> = { new(...args: any[]): T };

/**
 * Checks if the given value is unset (i.e., undefined or null).
 *
 * Named this way as the "opposite" of {@link isset}.
 *
 * @param x The value to check.
 * @returns {boolean} true if the value is unset, false otherwise.
 */
export function isUnset(x: any): boolean {
  return typeof x === 'undefined' || x === null;
}

/**
 * Checks if the given value is set (i.e., not undefined and not null).
 *
 * Named this way after PHP's `isset()` function.
 *
 * @param x The value to check.
 * @returns {boolean} true if the value is set, false otherwise.
 */
export function isset(x: any): boolean {
  return !isUnset(x);
}

/**
 * Checks if the given value is an object (i.e., not null and of type 'object').
 *
 * @param x The value to check.
 * @returns {boolean} true if the value is an object, false otherwise.
 */
export function isObject(x: any): boolean {
  return !!x && typeof x === 'object'; // must check !!x because `typeof null` also returns 'object'
}

/**
 * Checks if the given value is "empty". The definition of "empty" varies based on the type of the value:
 * - `undefined` or `null` are considered empty.
 * - Booleans and numbers are never considered empty. This is because `false` and `0` are semantically meaningful values.
 * - Strings are considered empty if they are empty or contain only whitespace.
 * - Arrays and array-like objects are considered empty if they have a length of 0.
 * - Maps and Sets are considered empty if they have a size of 0.
 * - Iterables are considered empty if they yield no values.
 * - Plain objects are considered empty if they have no own enumerable properties.
 *
 * @param x The value to check for emptiness.
 * @returns {boolean} true if the value is considered empty, false otherwise.
 */
export function isEmpty(x: any): boolean {
  if (typeof x === 'undefined' || x === null) {
    return true;
  } else if (typeof x === 'boolean' || typeof x === 'number') {
    return false; // don't consider any booleans or numbers to be empty
  } else if (typeof x === 'string') {
    return !x.trim().length;
  } else if (typeof x === 'object' && typeof x.nodeType === 'number' && typeof x.nodeName === 'string') {
    return false;
  } else if (Array.isArray(x)) {
    return x.length === 0;
  } else if (isArrayLike(x)) {
    return x.length === 0;
  } else if (x instanceof Map) {
    return x.size === 0;
  } else if (x instanceof Set) {
    return x.size === 0;
  } else if (isIterable(x)) {
    return [...x[Symbol.iterator]()].length === 0;
  } else if (typeof x === 'object') {
    return Object.keys(x).length === 0;
  } else {
    return !x;
  }
}

/**
 * Checks if the given value is not "empty". This is the negation of the {@link isEmpty} function.
 * @param x The value to check for non-emptiness.
 * @returns {boolean} true if the value is not considered empty, false otherwise.
 */
export function isNotEmpty(x: any): boolean {
  return !isEmpty(x);
}

/**
 * Checks if the given object (which can be a string, array, Map, Set, or iterable) includes the specified item.
 * @param obj The object to check for inclusion. It can be a string, array, Map, Set, or any iterable.
 * @param item The item to check for inclusion in the object.
 * @returns {boolean} true if the item is included in the object, false otherwise.
 */
export function includes(obj: any, item: any) {
  if (typeof obj === 'string' && typeof item === 'string') {
    return obj.includes(item);
  } else if (Array.isArray(obj)) {
    return obj.includes(item);
  } else if (isArrayLike(obj)) {
    return arrayContains(<any> obj, item);
  } else if (obj instanceof Map) {
    return [...obj.entries()].includes(item);
  } else if (obj instanceof Set) {
    return obj.has(item);
  } else if (isIterable(obj)) {
    return [...obj[Symbol.iterator]()].includes(item);
  } else {
    return false;
  }
}

/**
 * Checks if the given object does not include the specified item. This is the negation of the {@link includes} function.
 * @param obj The object to check for non-inclusion. It can be a string, array, Map, Set, or any iterable.
 * @param item The item to check for non-inclusion in the object.
 * @returns {boolean} true if the item is not included in the object, false otherwise.
 */
export function notIncludes(obj: any, item: any) {
  return !includes(obj, item);
}

/**
 * Checks if the input object is a Promise.
 * @returns {boolean} true if a promise, false otherwise
 */
export function isPromise(o: any): o is Promise<any> {
  return (
    o &&
    (o instanceof Promise ||
      Promise.resolve(o) === o ||
      Object.prototype.toString.call(o) === '[object Promise]' ||
      typeof o.then === 'function')
  );
}

/**
 * Converts a Promise of any type to a Promise of void, effectively ignoring the resolved value.
 * @param x The input Promise of any type.
 * @returns A Promise that resolves to void, ignoring the resolved value of the input Promise.
 */
export function toVoidPromise(x: Promise<any>): Promise<void> {
  return x.then(() => {
  });
}

/**
 * A list of strings that are considered "truthy" when converting to a boolean. This is used in the `toBoolean` function to determine if a string should be treated as true.
 * The list includes common representations of true, such as "true", "1", "yes", "on", and various symbols like "✓" and "✔".
 */
export const TRUTHY_STRINGS = new Set(['t', 'true', '1', 'y', 'yes', 'on', 'en', 'enable', 'enabled',
  'active', 'activated', 'positive', 'allow', 'allowed', '+', '+', '✓', '✔', '🗸', '☑', '🗹', '✅']);

/**
 * Converts a value to a boolean. The conversion rules are as follows:
 * - If the value is already a boolean, it is returned as-is.
 * - If the value is a string, it is converted to lowercase and trimmed, and then checked against a set of truthy strings. If it matches any of those strings, it returns true; otherwise, false.
 * - If the value is a number, it returns true if the number is greater than 0; otherwise, false.
 * - If the value is an array or array-like object, it returns true if the length is greater than 0; otherwise, false.
 * - If the value is a Map or Set, it returns true if the size is greater than 0; otherwise, false.
 * - If the value is an iterable object, it converts it to an array and checks if the length is greater than 0; otherwise, false.
 * - For all other types of values, it uses JavaScript's built-in truthiness evaluation (i.e., `!!x`)
 *
 * @param x The value to convert to a boolean.
 * @returns A boolean representation of the input value.
 */
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
    return [...x[Symbol.iterator]()].length > 0;
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

  let a: moment.Moment;
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

export type HumanTimingOpts = {
  /**
   * The suffix. Default is `from now` or `ago` depending on whether the time is in the future or in the past.
   *
   * Null or undefined will use default. Set to empty string to have no suffix.
   */
  suffix?: string | ((inPast: boolean) => string) | {past: string, future: string},

  /**
   * The timestamp to use as the "current time".
   */
  currentTime?: Date | number,

  /**
   * The return value if there has been no time elapsed (default: "Just now")
   */
  justNowText?: string,

  /**
   * The number of units to show.
   */
  precision?: number,
};

/**
 * Returns time in formats such as `X days ago` or `X seconds ago`
 *
 * @param inputTime The timestamp, either as a Date object or as a UNIX timestamp (milliseconds).
 * @param opts Options.
 */
export function humanTiming(inputTime: Date | number | null, opts?: HumanTimingOpts): string {
  let { suffix, currentTime, justNowText, precision } = (opts || {});

  if (inputTime instanceof Date)
    inputTime = inputTime.getTime();
  if (typeof inputTime === 'undefined' || inputTime === null || inputTime <= 0)
    return 'never';
  if (currentTime instanceof Date)
    currentTime = currentTime.getTime();
  if (!currentTime)
    currentTime = Date.now();
  if (!precision || precision < 1)
    precision = 1;

  // get delta:
  const deltaTime = Math.abs(inputTime - currentTime);
  const inFuture = inputTime >= currentTime;

  // suffix:
  if (suffix && typeof suffix === 'function')
    suffix = suffix(inFuture);
  if (suffix && typeof suffix === 'object')
    suffix = inFuture ? suffix.future : suffix.past;
  if (typeof suffix !== 'string')
    suffix = null;
  if (typeof suffix === 'undefined' || suffix === null)
    suffix = inFuture ? 'from now' : 'ago';

  if (deltaTime <= 1)
    return justNowText || 'Just now';

  const units: [label: string, ms: number][] = [
    ['year',    365.25 * 24 * 60 * 60 * 1000],
    ['month',   30.44  * 24 * 60 * 60 * 1000],
    ['week',    7     * 24 * 60 * 60 * 1000],
    ['day',     24    * 60 * 60 * 1000],
    ['hour',    60    * 60 * 1000],
    ['minute',  60    * 1000],
    ['second',  1000],
  ];

  const parts: string[] = [];
  let remaining: number = deltaTime;

  for (let [label, ms] of units) {
    if (parts.length >= precision) {
      break;
    }

    const value = Math.floor(remaining / ms);
    if (value > 0) {
      parts.push(`${value} ${label}${value > 1 ? 's' : ''}`);
      remaining -= value * ms;
    }
  }

  return sentenceJoin(parts) + (suffix ? ' ' + suffix : suffix);
}

/**
 * Returns a string of an HTML element that will represent the {@link humanTiming} of the given timestamp.
 * This element will be empty, and this method does not actually calculate the human timing itself;
 * client-side code will automatically and routinely update the element's inner text to the correct human timing.
 *
 * This way "5 seconds ago" will automatically update to "6 seconds ago", "7 seconds ago", and so on.
 *
 * The client-side code that does this is in `timestampInterval.ts`
 *
 * @param ts The timestamp, either as a Date object, a UNIX timestamp (milliseconds), or a string that can be parsed into a Date.
 * @param opts Options for the human timing display, such as suffix, current time, just now text, and precision.
 * @returns A string of an HTML element that will represent the human timing of the given timestamp.
 */
export function printHumanTiming(ts: Date|number|string, opts?: HumanTimingOpts): string {
  if (typeof ts === 'string')
    ts = new Date(ts);
  if (ts instanceof Date)
    ts = ts.getTime();

  const now = Date.now();

  if (typeof ts !== 'number')
    ts = now;

  const attrs = {
    class: 'timestamp is--humanTiming',
    innerText: ts > now ? 'some time from now' : 'some time ago',
    'data-timestamp': ts,
  };

  if (opts?.currentTime) {
    attrs['data-timestamp'] = typeof opts.currentTime === 'number' ? opts.currentTime : opts.currentTime.getTime();
  }
  if (opts?.justNowText) {
    attrs['data-justNowText'] = opts.justNowText;
  }
  if (opts?.precision) {
    attrs['data-precision'] = opts.precision;
  }
  if (opts?.suffix) {
    if (typeof opts.suffix === 'string') {
      attrs['data-suffix'] = opts.suffix;
    } else if (typeof opts.suffix === 'function') {
      attrs['data-pastSuffix'] = opts.suffix(true);
      attrs['data-futureSuffix'] = opts.suffix(false);
    } else {
      attrs['data-pastSuffix'] = opts.suffix.past;
      attrs['data-futureSuffix'] = opts.suffix.future;
    }
  }

  return createElementHtml('span', attrs);
}

/**
 * Creates an HTML element as a string with the given tag and attributes.
 *
 * Special attributes:
 * - `text`, `innerText`, or `textContent`: sets the text content of the element (escaped).
 * - `html`, `HTML`, `innerHTML`, or `innerHtml`: sets the inner HTML of the element (not escaped).
 *
 * @param tag   The HTML tag name (e.g., 'div', 'span', 'a').
 * @param attrs An object containing the attributes to set on the element.
 *              The keys are attribute names and the values are attribute values.
 * @returns A string representing the HTML element with the given tag and attributes.
 */
export function createElementHtml(tag: string, attrs: {[attr: string]: string|number|boolean} = {}): string {
  let part1: string = `<${tag}`;
  let part2: string = '>';
  let part3: string = '';
  let part4: string = `</${tag}>`;

  for (let attr of Object.keys(attrs)) {
    if (attr === 'text' || attr === 'innerText' || attr === 'textContent') {
      part3 = escapeHtml(String(attrs[attr]));
    } else if (attr === 'html' || attr === 'HTML' || attr === 'innerHTML' || attr === 'innerHtml') {
      part3 = String(attrs[attr]);
    } else if (typeof attrs[attr] === 'string') {
      part1 += ` ${attr}="${escapeHtml(attrs[attr])}"`
    } else if (typeof attrs[attr] === 'number') {
      part1 += ` ${attr}="${attrs[attr]}"`
    } else if (attrs[attr] === true) {
      part1 += ` ${attr}=""`
    }
  }
  return part1 + part2 + part3 + part4;
}

/**
 * Shallow clones an object or array.
 *
 * This is a simple utility function that uses the spread operator for arrays and `Object.assign` for objects.
 *
 * @param o The object or array to clone.
 * @returns A shallow clone of the object or array.
 */
export function shallowClone(o: any): any {
  if (Array.isArray(o)) {
    return [...o];
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
export function removeCyclicRefs<T>(obj: T, cyclicValueReplacer?: CyclicValueReplacer, deepCopy: boolean = true, tryClone: boolean = true): T {
  if (tryClone && deepCopy) {
    obj = cloneDeep(obj);
  }

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
    if (typeof value === 'object' && value !== null) {
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
 */
export function safeStringify(data: any, cyclicValueReplacer?: CyclicValueReplacer, indent?: number) {
  return JSON.stringify(data, getCircularReplacer(cyclicValueReplacer), indent);
}

type CompareTernaryMode = 'equals' | 'notEquals' | 'includes' | 'notIncludes' | 'isEmpty' | 'isNotEmpty'
  | 'isTruthy' | 'isFalsy' | 'isGreaterThan' | 'isLessThan' | 'isGreaterThanOrEqual' | 'isLessThanOrEqual';
type CompareTernaryComparison<T> = { value: T, mode: CompareTernaryMode };

// noinspection JSUnusedGlobalSymbols
/**
 * Semantic ternary expression builder. This is the base class for CompareTernary, which is the main class to use.
 *
 * @example
 *   const result = new CompareTernaryGroup(value)
 *     .equals(1).or.equals(2)
 *     .or.group(g => g.isGreaterThan(3).and.isLessThanOrEqual(30))
 *     .then('one or two, or between 3 and 30', 'not one or two, and not between 3 and 30');
 *
 * @param value The value to compare against.
 * @returns A CompareTernaryGroup object that allows for chaining comparisons and then/else values.
 */
export class CompareTernaryGroup<T> {
  protected value: T;
  protected comparisons: (CompareTernaryComparison<T> | CompareTernaryGroup<T>)[] = [];
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
    this.comparisons.push({ value, mode });
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
    return this.addComparison(value, 'notEquals');
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

  empty(): this { // alias for isEmpty
    return this.isEmpty();
  }

  isNotEmpty(): this {
    return this.addComparison(null, 'isNotEmpty');
  }

  notEmpty(): this { // alias for isNotEmpty
    return this.isNotEmpty();
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

  /**
   * Sets the default value to return if no comparisons match and no else value is provided in the `then` method.
   *
   * @param elseValue The default value to return if no comparisons match and no else value is provided in the `then` method.
   * @returns The CompareTernary instance for chaining.
   */
  setDefaultElse(elseValue: any): CompareTernary<T> {
    this.defaultElseValue = elseValue;
    return this;
  }

  /**
   * Returns the `thenValue` if the comparisons match, otherwise returns the `elseValue` (or the default else value if `elseValue` is not set).
   *
   * @param thenValue The value to return if the comparisons match.
   * @param elseValue The value to return if the comparisons do not match. If not provided, the default else value will be used if set.
   * @returns The `thenValue` if the comparisons match, otherwise the `elseValue` (or the default else value if `elseValue` is not set).
   */
  then<R>(thenValue: R, elseValue?: R): R {
    if (typeof elseValue === 'undefined') {
      elseValue = this.defaultElseValue;
    }
    return this.cmpResult() ? thenValue : elseValue;
  }

  /**
   * Returns true if the comparisons match, otherwise false.
   */
  get(): boolean {
    return !!this.cmpResult();
  }
}

/**
 * Semantic ternary expression builder.
 *
 * @example
 *   const result = ternary(value)
 *     .equals(1).or.equals(2)
 *     .then('one or two', 'not one or two');
 *
 * @param value The value to compare against.
 * @returns A CompareTernary object that allows for chaining comparisons and then/else values.
 */
export function ternary<T>(value: T): CompareTernary<T> {
  return new CompareTernary(value);
}

/**
 * Creates a plain object "map" that returns a default value for any property that doesn't exist yet.
 * This is very useful for use cases like counting occurrences of things, grouping things, etc.
 *
 * @param defaultValue The default value to return for any property that doesn't exist yet and is actually set as the
 * value for that property. Possible values:
 * - A function that takes the property name and returns a value.
 * - A string indicating a built-in type to use as the default value. Possible values:
 *   `Set`, `Map`, `Array`, `Object`, `Zero`, `One`, `Infinity`, `-Infinity`.
 * - A constructor function (class) that will be called with `new` to create the default value.
 * @param initialObj The initial object to use as the base for the map. If not provided, an empty object will be used.
 * @example
 *   const counts = defaultMap<number>('Zero');
 *   counts['apples']++;
 *   counts['oranges'] += 2;
 *   console.log(counts); // { apples: 1, oranges: 2 }
 * @example
 *   const groups = defaultMap<Set<string>>('Set');
 *   groups['fruits'].add('apple');
 *   groups['fruits'].add('banana');
 *   console.log(groups); // { fruits: Set { 'apple', 'banana' } }
 */
export function defaultMap<T extends object>(defaultValue:
                                               ((prop: keyof T) => T[keyof T])
                                               |'Set'|'Map'|'Array'|'Object'|'Zero'|'One'|'Infinity'|'-Infinity'
                                               |{new (prop?: keyof T): T[keyof T]},
                                             initialObj?: T): T {
  return new Proxy<T>(initialObj || {} as T, {
    get(obj: T, prop: string | symbol) {
      if (prop === 'toJSON') {
        return () => obj;
      } else if (prop in obj || prop === 'then' || prop === 'catch' || prop === 'finally') {
        return obj[prop];
      } else {
        if (defaultValue === 'Set') {
          obj[prop] = new Set();
        } else if (defaultValue === 'Map') {
          obj[prop] = new Map();
        } else if (defaultValue === 'Array') {
          obj[prop] = [];
        } else if (defaultValue === 'Object') {
          obj[prop] = {};
        } else if (defaultValue === 'Zero') {
          obj[prop] = 0;
        } else if (defaultValue === 'One') {
          obj[prop] = 1;
        } else if (defaultValue === 'Infinity') {
          obj[prop] = Infinity;
        } else if (defaultValue === '-Infinity') {
          obj[prop] = -Infinity;
        } else if (isESClass(defaultValue)) {
          obj[prop] = new defaultValue(prop as keyof T);
        } else {
          obj[prop] = defaultValue(prop as keyof T);
        }
        return obj[prop];
      }
    }
  });
}

/**
 * Checks if the given value is an ES6 class (i.e., a constructor function that cannot be called without `new`).
 * @param fn The value to check.
 * @returns true if the value is an ES6 class, false otherwise.
 */
export function isESClass(fn: any): fn is Type<any> {
  return typeof fn === 'function' &&
    Object.getOwnPropertyDescriptor(
      fn,
      'prototype'
    )?.writable === false
}

// noinspection JSUnusedGlobalSymbols
/**
 * Returns the approximate size of an object in bytes.
 * This is used for testing/debugging and is not ordinarily used otherwise, hence the unused warning suppression.
 *
 * @param object The object to measure.
 * @returns The approximate size of the object in bytes.
 */
export function getRoughSizeOfObject(object: any) {
  const seenObjects = [];
  const stack = [object];
  let bytes = 0;

  while (stack.length) {
    const value = stack.pop();

    switch (typeof value) {
      case 'boolean':
        bytes += 4;
        break;
      case 'string':
        bytes += value.length * 2;
        break;
      case 'number':
        bytes += 8;
        break;
      case 'object':
        if (!seenObjects.includes(value)) {
          seenObjects.push(value);
          if (Array.isArray(value)) {
            for (let v of value) {
              stack.push(v);
            }
          } else {
            for (let [k, v] of Object.entries(value)) {
              bytes += k.length * 2;
              stack.push(v);
            }
          }
        }
        break;
    }
  }
  seenObjects.length = 0;
  return bytes;
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
export function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Checks if the given value is "atomic" (i.e., a single indivisible value). This does not necessarily mean that an
 * atomic type doesn't have any internal state, but rather than it is to be treated as a single value for the purposes
 * of comparison, copying, traversal, etc.
 *
 * This, however, only takes into account built-in types/objects of JavaScript.
 *
 * List of what this function considers atomic:
 * - null, undefined
 * - All primitive types (string, number, boolean, symbol, bigint)
 * - Functions (semantically atomic)
 * - Date
 * - RegExp
 * - Error
 * - Promise
 * - ArrayBuffer
 * - DataView
 * - WeakMap
 * - WeakSet
 * - Typed arrays (e.g., Uint8Array, Float32Array, etc.)
 *
 * Anything else is considered non-atomic, including but not necessarily limited to:
 * - Plain objects (e.g., {})
 * - Arrays (e.g., [])
 * - Maps
 * - Sets
 * - Custom classes/objects
 *
 * @param value
 */
export function isAtomic(value: any) {
  if (isUnset(value)) return true;

  const type = typeof value;

  // All primitives
  if (type !== "object" && type !== "function") {
    return true;
  }

  // Functions are semantically atomic
  if (type === "function") {
    return true;
  }

  // Atomic-ish built-in objects
  if (
    value instanceof Date ||
    value instanceof RegExp ||
    value instanceof Error ||
    value instanceof Promise ||
    value instanceof ArrayBuffer ||
    value instanceof DataView ||
    value instanceof WeakMap ||
    value instanceof WeakSet
  ) {
    return true;
  }

  // Includes Uint8Array, Float32Array, etc.
  if (ArrayBuffer.isView(value)) {
    return true;
  }

  return false;
}
