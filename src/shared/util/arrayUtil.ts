// noinspection JSUnusedGlobalSymbols

import { isAtomic, isEmpty, isNotEmpty, isObject, isPromise, isset, isUnset } from './genericUtil.ts';
import { isStringBlank, trim } from './stringUtil.ts';
import { isInt } from './numberUtil.ts';
import { ArrayElement, KeysMatching, NonArray } from '../types/utility-types.ts';

export type SortComparator<T> = (a: T, b: T) => number;
export type ElementComparator<T> = (arrayElement: T, expectedElement: T) => boolean;

export function valuesOf<T>(obj: {[key: string|number|symbol]: T}): T[] {
  return !obj ? [] : Object.values(obj);
}

export function keysOf<T>(obj: {[key: string|number|symbol]: T}): string[] {
  return !obj ? [] : Object.keys(obj);
}

export function entriesOf<T>(obj: {[key: string|number|symbol]: T}): [string, T][] {
  return !obj ? [] : Object.entries(obj);
}

/**
 * Ensures that the given object is returned as an array.
 * If the object is already an array, it is returned as-is. If the object is not an array, it is wrapped in a new array.
 *
 * @template T The type of the object or array elements.
 * @param obj The object to be converted to an array.
 * @returns An array containing the object, or the object itself if it is already an array.
 */
export function toArray<T>(obj: T|T[]): T[] {
    return Array.isArray(obj) ? obj : [obj];
}

/**
 * Checks if the given object is iterable, meaning it has a `Symbol.iterator` method.
 *
 * This function returns `true` for arrays, strings, Maps, Sets, and any other object that implements the iterable protocol.
 *
 * @param obj The object to check for iterability.
 * @returns `true` if the object is iterable, `false` otherwise.
 */
export function isIterable(obj: any): obj is IterableIterator<any> {
    if (!obj) {
        return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
}

/**
 * Checks if the given object is array-like, meaning it has a `length` property and can be indexed like an array.
 *
 * This function returns `true` for actual arrays, as well as for objects that have a numeric `length` property and can be accessed using indices (e.g., `obj[0]`, `obj[1]`, etc.).
 *
 * @param obj The object to check for array-like behavior.
 * @returns `true` if the object is array-like, `false` otherwise.
 */
export function isArrayLike(obj: any): boolean {
  return (
    Array.isArray(obj) ||
    (!!obj &&
      typeof obj === "object" &&
      typeof (obj.length) === "number" &&
      (obj.length === 0 ||
        (obj.length > 0 &&
          (obj.length - 1) in obj)
      )
    )
  );
}

/**
 * Filters an array in-place, removing elements that do not satisfy the provided condition.
 * @param a The array to be filtered in-place.
 * @param condition A function that takes an element, its index, and the array itself, and returns a boolean indicating whether the element should be kept (true) or removed (false).
 * @param thisArg An optional value to use as `this` when executing the condition function.
 * @returns The filtered array, which is the same reference as the input array `a`.
 *
 * @example
 *   let myArr = [1, 2, 3, 4, 5];
 *   filterInPlace(myArr, (item) => item % 2 === 0); // myArr is now [2, 4]
 */
export function filterInPlace<T>(a: T[], condition: (item: T, i?: number, a?: T[]) => boolean, thisArg: any = null): T[] {
    let j = 0;

    a.forEach((e: T, i: number) => {
        if (condition.call(thisArg, e, i, a)) {
            if (i !== j) a[j] = e;
            j++;
        }
    });

    // From: https://stackoverflow.com/a/37319954
    // This is a little weird, but you can actually change the 'length' property of an array
    a.length = j;
    return a;
}

/**
 * Create an object with the given set of keys where each key will have the same value.
 * @param keys
 * @param value
 */
export function fromKeysWithFixedValue<T>(keys: string[], value: T): { [key: string]: T } {
    let obj = {};
    for (let key of keys) {
        obj[key] = value;
    }
    return obj;
}

/**
 * Represents a field in an object, including its path, basename, value, and whether it's a leaf node (i.e., not an object or array).
 */
export type PathAndValue = {
  /**
   * The full path to the field in the object, represented as a string in dot notation.
   * Each segment of the path is separated by a dot (.) for object properties and square brackets ([]) for array indices.
   *
   * For example, `myObj.myArray[0].myProperty`
   */
  path: string,

  /**
   * The basename of the field, which is the last segment of the path. For example, if the path is "a.b.c", the basename would be "c".
   *
   * For array elements, this would be the index integer in string form without brackets. Guaranteed to be parseable
   * as an integer if {@link isArrayElement} is true.
   */
  basename: string,

  /**
   * The value of the field. This can be any type, including objects, arrays, or primitive values.
   */
  value: any,

  /**
   * Indicates whether the value is an element of an array. This is true if the field is part of an array, and false otherwise.
   */
  isArrayElement: boolean,

  /**
   * If the value is a "leaf" node. This is true when {@link isAtomic} returns true for the value.
   */
  isLeaf: boolean
};

/**
 * Checks if two objects are equivalent.
 *
 * @param a The first object to compare.
 * @param b The second object to compare.
 * @param fieldSkipper If this function returns true, then field passed in will be ignored from the equivalence check
 * @returns True if the objects are equivalent, false otherwise.
 */
export function isEquiv(a: any, b: any, fieldSkipper?: (field: PathAndValue) => boolean): boolean {
  if (a === b) {
    return true;
  }
  if (isObject(a) && isObject(b) && Object.keys(a).length === Object.keys(b).length) {
    for (let field of walkObjectGen(a)) {
      if (fieldSkipper && fieldSkipper(field)) {
        continue;
      }
      if (field.isLeaf && resolveObjectPath(b, field.path) !== field.value) {
        return false;
      }
      if (!field.isLeaf) {
        const isArray = Array.isArray(field.value);
        const bValue = resolveObjectPath(b, field.path);
        const bIsArray = Array.isArray(bValue);

        if (isArray) {
          if (!bIsArray) {
            return false;
          } else if (field.value.length !== bValue.length) {
            return false;
          }
        }

        if (!isArray) {
          if (!isObject(bValue)) {
            return false;
          } else if (Object.keys(field.value).length !== Object.keys(bValue).length) {
            return false;
          }
        }
      }
    }
    return true;
  } else {
    return false;
  }
}

/**
 * A callback function that is called for every field in an object when using {@link walkObjectGen} or {@link walkObject}.
 *
 * See the `interceptor` parameter on {@link walkObjectGen} for more details.
 */
export type WalkObjectProcessor = (curr: PathAndValue) => 'NO-DESCEND'|'QUIT'|'CONTINUE'|'DELETE'|void;

/**
 * Same as {@link walkObjectGen} but with only the callback function and not as a generator.
 * @param o The object to walk through.
 * @param processor See the `interceptor` parameter on {@link walkObjectGen}
 */
export function walkObject(o: any, processor: WalkObjectProcessor): void {
  for (let _ignore of walkObjectGen(o, false, processor)) {}
}


/**
 * A generator that walks through all the fields of any object (including within nested objects and arrays).
 *
 * @param o The object to walk through.
 * @param leafsOnly If true, only leaf properties (non-objects and non-arrays) will be yielded.
 * @param interceptor This function is called with every PathAndValue object (both branches and leafs), regardless of
 * the setting of the `leafsOnly` parameter.
 *
 * <ul>
 *   <li>Returning <strong><code>'NO-DESCEND'</code></strong>
 *     <ul>
 *       <li>If the interceptor was passed a branch field, then the generator will stop walking down that branch's path.
 *       <li>If the interceptor was passed a leaf field, then there's nothing to walk down anyway, so there'll be no effect.
 *     </ul>
 *   </li>
 *   <li>Returning <strong><code>'CONTINUE'</code></strong> or returning <strong>nothing</strong>: no effect</li>
 *   <li>Returning <strong><code>'QUIT'</code></strong>: stops walking down the object, stopping the generator.</li>
 *   <li>Returning <strong><code>'DELETE'</code></strong>: Delete the field on the object being walked (in-place) and if the field was a branch, then it'll no longer being walked down.
 *      <p>This action is equivalent to this code:</p>
 *
 *      ```ts
 *      (field: PathAndValue) => {
 *          resolveObjectPath(o, field.path, 'delete');
 *          return 'NO-DESCEND';
 *      }
 *      ```
 *   </li>
 * </ul>
 */
export function* walkObjectGen(o: any, leafsOnly: boolean = false, interceptor?: WalkObjectProcessor): Generator<PathAndValue> {
  if (isUnset(o) || typeof o !== 'object') {
    return;
  }
  let queue: PathAndValue[] = [];

  for (let entry of Object.entries(o)) {
    if (o.hasOwnProperty(entry[0])) {
      queue.push({
        path: entry[0],
        basename: entry[0],
        value: entry[1],
        isLeaf: isAtomic(entry[1]),
        isArrayElement: false
      });
    }
  }

  while (queue.length) {
    let curr = queue.shift();

    if (!leafsOnly || (leafsOnly && curr.isLeaf)) {
      yield curr;
    }

    if (interceptor) {
      const stopperResult = interceptor(curr);

      if (stopperResult === 'NO-DESCEND') {
        continue;
      } else if (stopperResult === 'QUIT') {
        break;
      } else if (stopperResult === 'DELETE') {
        resolveObjectPath(o, curr.path, 'delete');
        continue;
      }
    }

    if (!!curr.value && typeof curr.value === 'object') {
      if (Array.isArray(curr.value)) {
        for (let i = 0; i < curr.value.length; i++) {
          queue.push({
            path: curr.path + '[' + i + ']',
            basename: String(i),
            value: curr.value[i],
            isLeaf: isAtomic(curr.value[i]),
            isArrayElement: true
          });
        }
      } else {
        for (let entry of Object.entries(curr.value)) {
          if (curr.value.hasOwnProperty(entry[0])) {
            queue.push({
              path: curr.path + '.' + entry[0],
              basename: entry[0],
              value: entry[1],
              isLeaf: isAtomic(entry[1]),
              isArrayElement: false
            });
          }
        }
      }
    }
  }
}

/**
 * Resolves a property in an object
 *
 * @param o The object to resolve upon
 * @param s The path to resolve
 * @param mode One of `get`, `set`, or `delete` (default: `get`)
 *  - `get`: gets the value at the path, or `undefined` if not found
 *  - `set`: sets the property at the path to the parameter `newValue`. If objects within the path don't exist, then they'll be created.
 *  - `delete`: deletes the property at the path
 * @param newValue The value to set at the path if the `mode` is `set`
 *
 * @example
 *   resolveObjectPath(`nestedObject.someArray[0].someProperty`)
 */
export function resolveObjectPath(o: any, s: string, mode: 'get' | 'set' | 'delete' = 'get', newValue?: any): any {
  if (typeof s !== 'string') return undefined;
  s = s.replace(/\.?\[([^\]]+)]/g, '.$1'); // convert indexes to properties
  s = s.replace(/^\./, '');           // strip a leading dot
  if (isStringBlank(s)) return o;
  let a = s.split('.');
  let lastIdx = a.length - 1;
  for (let i = 0; i < a.length; i++) {
    let k = a[i];
    let isLast = i === lastIdx;
    if (typeof o === 'object' && k in o) {
      let v = o[k];
      if (isLast && mode === 'delete') {
        delete o[k];
      }
      if (isLast && mode === 'set') {
        o[k] = newValue;
      }
      if (!isLast && mode === 'set' && !v) {
         o[k] = {};
         v = o[k];
      }
      o = v;
    } else if (Array.isArray(o) && ['#ALL', '#EACH', '#EVERY'].includes(k.toUpperCase())) {
      return o.map(item => resolveObjectPath(item, a.slice(i + 1).join('.'), mode, newValue)).flat(Infinity);
    } else {
      if (mode === 'set') {
        if (isLast) {
          o[k] = newValue;
        } else {
          let nextKeyUC = a[i+1].toUpperCase();
          if (isInt(nextKeyUC) || ['#ALL', '#EACH', '#EVERY'].includes(nextKeyUC)) {
            o[k] = [];
          } else {
            o[k] = {};
          }
          o = o[k];
          continue;
        }
      }
      return undefined;
    }
  }
  return o;
}

/**
 * A utility class for working with arrays in a promise-based, chainable manner.
 */
export class ArrayStream<T> {
  private arr: T[] = [];
  private promiseChain: Promise<any> = Promise.resolve();

  /**
   * Creates a new ArrayStream instance.
   *
   * @param arr The array or a promise that resolves to an array to be wrapped in the ArrayStream.
   */
  constructor(arr: T[]|Promise<T[]>) {
    if (isPromise(arr)) {
      this.chain(async () => {
        this.arr = await arr;
      });
    } else {
      this.arr = arr;
    }
  }

  private chain(fn: () => void|Promise<any>) {
    this.promiseChain = this.promiseChain.then(fn);
  }

  /**
   * Filters the array in the stream based on the provided function or predefined conditions.
   *
   * @param fn A function that takes an element of the array and returns a boolean indicating whether the element should be retained (true) or removed (false).
   */
  retain(fn: 'isset' | 'nonEmpty' | ((v: T) => boolean) = 'nonEmpty'): this {
    this.chain(() => {
      let cb: (v: T) => boolean;
      if (fn === 'isset') {
        cb = v => isset(v);
      } else if (fn === 'nonEmpty') {
        cb = v => isNotEmpty(v);
      } else {
        cb = fn;
      }
      this.arr = this.arr.filter(cb);
    });
    return this;
  }

  mappingVector<A extends KeysMatching<T, Array<any>>, B extends KeysMatching<T, Array<any>>>
  (inProp: A, outProp: B, mapper: (value: ArrayElement<T[A]>) => ArrayElement<T[B]>|Promise<ArrayElement<T[B]>>): this {
    this.chain(() => {
      let myPromises: Promise<any>[] = [];
      for (let item of this.arr) {
        if (Array.isArray(item[inProp])) {
          let newArray = [];

          (<any[]> item[inProp]).forEach((arrItem: any, arrIdx: number) => {
            let ret = mapper(arrItem);
            if (isPromise(ret)) {
              myPromises.push(ret.then(pRet => newArray[arrIdx] = pRet));
            } else {
              newArray[arrIdx] = ret;
            }
          });

          item[outProp] = <any> newArray;
        } else {
          item[outProp] = <any> item[inProp];
        }
      }
      return Promise.all(myPromises);
    });
    return this;
  }

  mappingScalar<A extends KeysMatching<T, NonArray>, B extends KeysMatching<T, NonArray>>
  (inProp: A, outProp: B, mapper: (value: T[A]) => T[B]|Promise<T[B]>): this {
    this.chain(() => {
      let myPromises: Promise<any>[] = [];
      for (let item of this.arr) {
        let ret = mapper(item[inProp]);

        if (isPromise(ret)) {
          myPromises.push(ret.then(pRet => item[outProp] = <any> pRet));
        } else {
          item[outProp] = <any> ret;
        }
      }
      return Promise.all(myPromises);
    })
    return this;
  }

  async toArray(): Promise<T[]> {
    return this.promiseChain.then(() => this.arr);
  }

  async toMap<K extends KeysMatching<T, string | number>>(keyProp: K, out?: Record<T[K] & (string | number), T>): Promise<Record<T[K] & (string | number), T>> {
    return this.promiseChain.then(() => {
      out = out || ({} as Record<T[K] & (string | number), T>);
      for (let item of this.arr) {
        let k: number|string = <any> item[keyProp];
        out[k] = item;
      }
      return out;
    });
  }
}

/**
 * Creates a map from an array of objects, where the keys are extracted from each object using the provided `keyProp`.
 *
 * @template T The type of the objects in the input array.
 * @template K The type of the key property, which must be a string or number.
 * @param array The input array of objects to be transformed into a map.
 * @param keyProp The property name of the objects in the array that will be used as keys in the resulting map.
 * This property must be of type string or number.
 * @param out An optional object to which the key-value pairs will be added. If not provided, a new object will be created.
 * @returns A map (Record<string, T>) where each key is derived from the `keyProp` of the objects in the input array,
 * and each value is the corresponding object.
 * @example
 *   const users = [{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}];
 *   const userMap = mapBy(users, 'id');
 *
 *   // userMap will be:
 *   {
 *     '1': {id: 1, name: 'Alice'},
 *     '2': {id: 2, name: 'Bob'}
 *   }
 */
export function mapBy<T, K extends KeysMatching<T, string | number>>(
  array: T[],
  keyProp: K,
  out?: Record<T[K] & (string | number), T>
): Record<T[K] & (string | number), T> {
  out = out || ({} as Record<T[K] & (string | number), T>);
  for (let item of array) {
    let k = item[keyProp] as unknown as T[K] & (string | number);
    out[k] = item;
  }
  return out;
}

/**
 * Creates a map from an array of objects, where the keys and values are extracted from each object using the provided `kvExtractor` function.
 *
 * @template T The type of the objects in the input array.
 * @template V The type of the values in the resulting map.
 * @param array The input array of objects to be transformed into a map.
 * @param kvExtractor A function that takes an object of type T and returns a tuple containing the key (string) and value (V) for the resulting map.
 * @returns A map (Record<string, V>) where each key-value pair is derived from the input array using the `kvExtractor` function.
 */
export function arrayToMap<T, V>(array: T[], kvExtractor: (item: T) => [string, V]): Record<string, V> {
  const out: Record<string, V> = {};
  for (let item of array) {
    let [k, v] = kvExtractor(item);
    out[k] = v;
  }
  return out;
}

export function compare<T>(a: T, b: T, field?: string|SortComparator<T>, nullsLast: boolean = false): number {
    if (isUnset(a) && !isUnset(b)) return nullsLast ? 1 : -1;
    if (!isUnset(a) && isUnset(b)) return nullsLast ? -1 : 1;
    if (isUnset(a) && isUnset(b)) return 0;

    let reverse = false;
    if (typeof field === 'string' && field.startsWith('-')) {
        reverse = true;
        field = field.slice(1);
    }
    if (typeof field === 'string' && field.startsWith('+')) {
        field = field.slice(1);
    }

    let n = 0;

    if (typeof a === 'string' && typeof b === 'string') {
        n = trim(a, `"`).localeCompare(trim(b, `"`));
    } else if (typeof a === 'number' && typeof b === 'number') {
        n = a - b;
    } else if (typeof a === 'boolean' && typeof b === 'boolean') {
      n = (a ? 1 : -1) - (b ? 1 : -1);
    } else if (typeof a === 'object' && typeof b === 'object' && !!field) {
        if (typeof field === 'function') {
          n = field(a, b);
        } else {
          n = compare(resolveObjectPath(a, field), resolveObjectPath(b, field), field, reverse ? !nullsLast : nullsLast);
        }
    } else {
        if (a < b) n = -1;
        if (a > b) n = 1;
    }
    return reverse ? -n : n;
}

/**
 * Sorts an array **in-place**.
 *
 * Standard sort (can sort number/strings):
 * ```
 *   let myArr = [5, -1, 4, 2, 3, 0, 1];
 *   sort(myArr); // => [-1, 0, 1, 2, 3, 4, 5]
 * ```
 *
 * Reverse sort:
 * ```
 *   let myArr = [5, -1, 4, 2, 3, 0, 1];
 *   sort(myArr, '-'); // => [5, 4, 3, 2, 1, 0, -1]
 * ```
 *
 * Sorting on a field:
 * ```
 *   let myArr = [{n: 3}, {n: 1}, {n: 5}, {n: 4}, {n: 2}];
 *   sort(myArr, 'n'); // => [{n: 1}, {n: 2}, {n: 3}, {n: 4}, {n: 5}]
 * ```
 *
 * Sorting on a field (desc):
 * ```
 *   let myArr = [{n: 3}, {n: 1}, {n: 5}, {n: 4}, {n: 2}];
 *   sort(myArr, '-n'); // => [{n: 5}, {n: 4}, {n: 3}, {n: 2}, {n: 1}]
 * ```
 *
 * Reverse sort on nested field:
 * ```
 *   let myArr = [{n: {x: 3}}, {n: {x: 1}}, {n: {x: 5}}, {n: {x: 4}}, {n: {x: 2}}];
 *   sort(myArr, '-n.x'); // => [{n: {x: 5}}, {n: {x: 4}}, {n: {x: 3}}, {n: {x: 2}}, {n: {x: 1}}]
 * ```
 *
 * Sorting on multiple fields (x asc, y asc):
 * ```
 *   let myArr = [{x: 1}, {x: 9}, {x: 2}, {x: 3, y: 20}, {x: 3, y: 10}, {x: 3, y: 10}, {x: 3, y: -30}, {x: -3}];
 *   sort(myArr, 'x', 'y'); // => [{x:-3}, {x:1}, {x:2}, {x:3,y:-30}, {x:3,y:10}, {x:3,y:10}, {x:3,y:20}, {x:9}]
 * ```
 *
 * Sorting on multiple fields (x asc, y desc):
 * ```
 *   let myArr = [{x: 1}, {x: 9}, {x: 2}, {x: 3, y: 20}, {x: 3, y: 10}, {x: 3, y: 10}, {x: 3, y: -30}, {x: -3}];
 *   sort(myArr, 'x', '-y'); // => [{x:-3}, {x:1}, {x:2}, {x:3,y:20}, {x:3,y:10}, {x:3,y:10}, {x:3,y:-30}, {x:9}]
 * ```
 */
export function sort<T>(array: T[], ...fields: (string|SortComparator<T>)[]): T[] {
    if (!Array.isArray(array)) throw new Error('Must be an array!');
    array.sort((a: T, b: T) => {
        if (!fields || !fields.length)
            return compare(a, b, null, true);
        return fields.map(field => compare(a, b, field, true)).find(n => n !== 0) || 0;
    });
    return array;
}

/**
 * Recursively removes empty values from an object or array. See {@link isEmpty} for what is considered empty.
 *
 * @param o The object or array to clean.
 */
export function cleanEmpty<T>(o: T): T {
    if (isEmpty(o)) {
        return o;
    } else if (Array.isArray(o)) {
        return <T> o.map(item => cleanEmpty(item)).filter(x => !isEmpty(x));
    } else if (typeof o === 'object') {
        let copy = Object.assign({}, o);
        for (let key of Object.keys(copy)) {
            copy[key] = cleanEmpty(copy[key]);
            if (isEmpty(copy[key])) {
                delete copy[key];
            }
        }
        return copy;
    } else {
        return o;
    }
}

export function arrayUnique<T>(a: T[]): T[] {
    let prims = { 'boolean': {}, 'number': {}, 'string': {} }, objs = [];
    return a.filter(function(item) {
        let type = typeof item;
        if (type in prims)
            return prims[type].hasOwnProperty(item) ? false : (prims[type][item] = true);
        else
            return objs.indexOf(item) >= 0 ? false : objs.push(item);
    });
}

/**
 * Checks if an array is empty or not defined.
 * @param array The array to check.
 * @returns `true` if the array is empty or not defined, `false` otherwise.
 */
export function arrayEmpty(array: any[]) {
    return !array || array.length === 0;
}

/**
 * Finds the index of an object in an array using a custom comparator function.
 * @param array The array to search in.
 * @param obj The object to find the index of.
 * @param comparator An optional comparator function that takes two arguments (an element from the array and the object
 * to find) and returns a boolean indicating whether they are considered equal.
 * @returns The index of the object in the array if found, or -1 if not found.
 */
export function arrayIndexOf<T>(array: T[], obj: T, comparator?: ElementComparator<T>): number {
    if (!comparator)
        return array.indexOf(obj);
    for (let i = 0; i < array.length; i++) {
        let item = array[i];
        if (item === obj || comparator(item, obj))
            return i;
    }
    return -1;
}

/**
 * Checks if an array contains a specific object using a custom comparator function.
 *
 * @param array The array to search in.
 * @param obj The object to check for in the array.
 * @param comparator An optional comparator function that takes two arguments (an element from the array and the object
 * to find) and returns a boolean indicating whether they are considered equal.
 * @returns `true` if the object is found in the array, `false` otherwise.
 */
export function arrayContains<T>(array: T[], obj: T, comparator?: ElementComparator<T>): boolean {
    return arrayIndexOf(array, obj, comparator) >= 0;
}

/**
 * Finds the intersection of multiple arrays, returning an array of elements that are present in all input arrays.
 *
 * @param args An array of arrays to find the intersection of.
 * @param comparator An optional comparator function that takes two arguments (an element from the arrays and the object
 * to find) and returns a boolean indicating whether they are considered equal.
 * @returns An array containing the elements that are present in all input arrays.
 */
export function arrayIntersect<T>(args: T[][], comparator?: ElementComparator<T>): T[] {
    let result = [];
    let lists: T[][] = args;

    for (let i = 0; i < lists.length; i++) {
        let currentList = lists[i];
        for (let y = 0; y < currentList.length; y++) {
            let currentValue = currentList[y];
            if (!arrayContains(result, currentValue, comparator)) {
                if (lists.filter(list => !arrayContains(list, currentValue, comparator)).length == 0) {
                    result.push(currentValue);
                }
            }
        }
    }
    return result;
}

/**
 * Calculates the sum of all numbers in an array.
 *
 * @param array An array of numbers to sum.
 * @returns The sum of the numbers in the array.
 */
export function arraySum(array: number[]): number {
    return array.reduce((a: number, b: number) => a + b, 0);
}

/**
 * Pairs elements from two arrays into an array of tuples.
 *
 * If the arrays are of unequal length, the resulting array will have the length of the longer array,
 * with `undefined` filling in for missing elements from the shorter array.
 *
 * @template T The type of elements in the first array.
 * @template U The type of elements in the second array.
 * @param arr1 The first array to pair.
 * @param arr2 The second array to pair.
 * @returns An array of tuples, where each tuple contains one element from `arr1` and one element from `arr2`.
 */
export function pairArrays<T, U>(arr1: T[], arr2: U[]): [T, U][] {
  arr1 = !arr1 || !Array.isArray(arr1) ? [] : arr1;
  arr2 = !arr2 || !Array.isArray(arr2) ? [] : arr2;

  if (arr1.length >= arr2.length) {
    return arr1.map((item: T, idx: number) => [item, arr2?.[idx]]);
  } else {
    return arr2.map((item: U, idx: number) => [arr1?.[idx], item]);
  }
}

declare global {
  interface Array<T> {
    /**
     * Asynchronously maps over the array, applying the provided callback function to each element and returning a promise that resolves to an array of results.
     *
     * @param callbackfn A function that takes an element of the array, its index, and the array itself, and returns a promise that resolves to a value or void.
     * @param skipNilResults If true, any results that are `null` or `undefined` will be skipped in the final result array. Defaults to true.
     * @returns A promise that resolves to an array of results from the callback function, with `null` or `undefined` values optionally skipped.
     */
    asyncMap<U>(callbackfn: (value: T, index: number, array: T[]) => Promise<U|void>, skipNilResults?: boolean): Promise<U[]>;

    /**
     * Asynchronously iterates over the array, applying the provided callback function to each element.
     *
     * The iteration is done in parallel, and the method returns a promise that resolves when all iterations are complete.
     *
     * @param callbackfn A function that takes an element of the array, its index, and the array itself, and returns a promise that resolves to void.
     * @param skipNilResults If true, any results that are `null` or `undefined` will be skipped in the final result array. Defaults to true.
     * @returns A promise that resolves when all iterations are complete.
     */
    asyncForEach(callbackfn: (value: T, index: number, array: T[]) => Promise<void>, skipNilResults?: boolean): Promise<void>;
  }
}

Object.defineProperty(Array.prototype, 'asyncMap', {
  value: async function<T, U>(callbackFn: (value: T, index: number, array: T[]) => Promise<U|void>, skipNilResults: boolean = true): Promise<U[]> {
    const promises: Promise<U|void>[] = [];

    for (let i = 0; i < this.length; i++) {
      promises.push(callbackFn(this[i], i, this));
    }

    const results: U[] = [];

    for (let result of await Promise.all(promises)) {
      if (skipNilResults && isUnset(result)) {
        continue;
      }
      results.push(<any> result);
    }

    return results;
  }
});

Object.defineProperty(Array.prototype, 'asyncForEach', {
  value: async function<T>(callbackFn: (value: T, index: number, array: T[]) => Promise<void>): Promise<void> {
    const promises: Promise<void>[] = [];

    for (let i = 0; i < this.length; i++) {
      promises.push(callbackFn(this[i], i, this));
    }

    await Promise.all(promises);
  }
});

/**
 * Moves an element in an array from one index to another, modifying the original array in place.
 * @param arr The array in which the element will be moved.
 * @param fromIndex The index of the element to move.
 * @param toIndex The index to which the element should be moved.
 */
function arrayMove<T>(arr: T[], fromIndex: number, toIndex: number) {
  let element = arr[fromIndex];
  arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, element);
}

/**
 * Finds the number in an array that is closest to a specified target number.
 * @param arr An array of numbers to search through.
 * @param target The target number to find the closest match for.
 * @returns The number from the array that is closest to the target number.
 */
export function arrayClosestNumber(arr: number[], target: number) {
  return arr.reduce((prev: number, curr: number) => {
    return (Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev);
  });
}

/**
 * Removes specified items from an array, modifying the original array in place.
 * @param arr The array from which items will be removed.
 * @param items An array of items to be removed from the original array.
 */
export function arrayRemove<T>(arr: T[], items: T[]) {
  for (let item of items) {
    let index = arr.indexOf(item);
    if (index > -1) {
      arr.splice(index, 1);
    }
  }
}

/**
 * Creates an array filled with a range of numbers from `start` to `end`, inclusive.
 * @param start The starting number of the range.
 * @param end The ending number of the range.
 * @returns An array containing the numbers from `start` to `end` inclusively.
 */
export function arrayFillRange(start: number, end: number): number[] {
  let arr: number[] = [];
  for (let i = start; i <= end; i++) {
    arr.push(i);
  }
  return arr;
}

/**
 * Simple object representing an arbitrary indexed range with a `start` and `end` property, both of which are numbers.
 */
export type IndexedRange = {start: number, end: number};

/**
 * Calculates the length of a given range defined by an object with `start` and `end` properties.
 *
 * @param range An object representing the range, with `start` and `end` properties.
 * @returns The length of the range, calculated as `end - start`. If the range is invalid (i.e., `end` is less than `start`), it returns 0.
 * @param range
 */
export function rangeLen(range: IndexedRange): number {
  if (!range || range.end < range.start) {
    return 0;
  }
  return range.end - range.start;
}

/**
 * Calculates the intersection of two indexed ranges, returning a new range that represents the overlapping portion of the two ranges.
 *
 * If the two ranges do not overlap, the function returns `null`.
 *
 * @param a The first indexed range, with `start` and `end` properties.
 * @param b The second indexed range, with `start` and `end` properties.
 * @returns A new indexed range representing the intersection of the two input ranges, or `null` if there is no overlap.
 */
export function intersectRange(a: IndexedRange, b: IndexedRange): IndexedRange {
  const doOverlap = b.start < a.start
    ? b.end > a.start
    : b.start < a.end;

  if (!doOverlap) {
    return null;
  }

  let min = a.start < b.start ? a : b;
  let max = min === a ? b : a;

  return {
    start: max.start,
    end: min.end < max.end ? min.end : max.end,
  };
}

/**
 * Checks if a number is within a specified indexed range, inclusive of the start and end values.
 * @param n The number to check.
 * @param r The indexed range, defined by an object with `start` and `end` properties.
 * @returns `true` if the number is within the range (inclusive), `false` otherwise.
 */
export function inRange(n: number, r: IndexedRange): boolean {
  return n >= r.start
    && n <= r.end;
}

/**
 * Chunk an array by the total number of chunks there should be.
 *
 * @param arr The array to split into chunks.
 * @param options Either `numChunks` or `chunkSize` must be specified, and not both.
 * @param options.numChunks The total number of chunks there should be. This is *not* the number of items per chunk.
 * @param options.chunkSize The number of items that should be in each chunk. The last chunk may have fewer items if the array length isn't divisible by `chunkSize`.
 * @param options.drainSource If true, the source array will be emptied in-place as chunks are created, reducing memory usage.
 *
 * @example
 *   chunkArray([1, 2, 3, 4, 5], {numChunks: 2}); // => [[1, 3, 5], [2, 4]]
 *   chunkArray([1, 2, 3, 4, 5], {chunkSize: 2}); // => [[1, 2], [3, 4], [5]]
 *   chunkArray([1, 2, 3, 4, 5], {chunkSize: 2, drainSource: true}); // => [[1, 2], [3, 4], [5]], arr is now []
 */
export function chunkArray<T>(arr: T[], options: {numChunks?: number, chunkSize?: number, drainSource?: boolean}): T[][] {
  if (isInt(options.numChunks)) {
    const chunks: T[][] = Array.from({ length: options.numChunks }, () => []);

    for (let i = 0; i < arr.length; i++) {
      chunks[i % options.numChunks].push(arr[i]);
    }

    if (options.drainSource) {
      arr.length = 0;
    }

    return chunks.filter((chunk) => chunk.length > 0);
  } else if (isInt(options.chunkSize)) {
    const result: T[][] = [];

    if (options.drainSource) {
      while (arr.length > 0) {
        result.push(arr.splice(0, options.chunkSize));
      }
    } else {
      for (let i = 0; i < arr.length; i += options.chunkSize) {
        result.push(arr.slice(i, i + options.chunkSize));
      }
    }

    return result;
  } else {
    throw new Error('Either numChunks or chunkSize must be specified, and they must be integers.');
  }
}
