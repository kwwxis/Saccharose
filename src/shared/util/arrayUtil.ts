import { isEmpty, isNotEmpty, isPromise, isset, isUnset } from './genericUtil';
import { isStringBlank, trim } from './stringUtil';
import { isInt } from './numberUtil';
import { ArrayElement, KeysMatching, NonArray } from '../types/utility-types';

export type SortComparator<T> = (a: T, b: T) => number;
export type ElementComparator<T> = (arrayElement: T, expectedElement: T) => boolean;

export function toArray<T>(obj: T|T[]): T[] {
    return Array.isArray(obj) ? obj : [obj];
}

export function isIterable(obj: any): obj is IterableIterator<any> {
    if (!obj) {
        return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
}

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

export function filterInPlace<T>(a: T[], condition: (item: T) => boolean, thisArg: any = null): T[] {
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

export class ArrayStream<T> {
  private arr: T[] = [];
  private promiseChain: Promise<any> = Promise.resolve();

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

  retain(fn: 'isset' | 'nonEmpty' | ((v: T) => boolean) = 'nonEmpty'): this {
    this.chain(() => {
      let cb: (v: T) => boolean = undefined;
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

  async toMap<K extends KeysMatching<T, string | number>>(keyProp: K, out?: { [key: string|number]: T }): Promise<{ [key: string|number]: T }> {
    return this.promiseChain.then(() => {
      out = out || {};
      for (let item of this.arr) {
        let k: number|string = <any> item[keyProp];
        out[k] = item;
      }
      return out;
    });
  }
}

export function groupBy<T>(array: T[], property: string): { [groupedBy: string]: T[] } {
    let grouped = {};
    for (let obj of array) {
        if (!grouped.hasOwnProperty(obj[property])) {
            grouped[obj[property]] = [];
        }
        grouped[obj[property]].push(obj);
    }
    return grouped;
}

export function toMap<T, K extends KeysMatching<T, string | number>>(array: T[], keyProp: K, out?: { [key: string|number]: T }): { [key: string|number]: T } {
  out = out || {};
  for (let item of array) {
    let k: number|string = <any> item[keyProp];
    out[k] = item;
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

export function arrayEmpty(array: any[]) {
    return !array || array.length === 0;
}

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

export function arrayContains<T>(array: T[], obj: T, comparator?: ElementComparator<T>): boolean {
    return arrayIndexOf(array, obj, comparator) >= 0;
}

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

export function arraySum(array: number[]): number {
    return array.reduce((a: number, b: number) => a + b, 0);
}

export function pairArrays<T, U>(arr1: T[], arr2: U[]): [T, U][] {
  return !arr1 || !Array.isArray(arr1) ? [] : arr1.map((item: T, idx: number) => [item, arr2?.[idx]]);
}

declare global {
  interface Array<T> {
    asyncMap<U>(callbackfn: (value: T, index: number, array: T[]) => Promise<U>, skipNilResults?: boolean): Promise<U[]>;
  }
}

Array.prototype.asyncMap = async function<T, U>(callbackfn: (value: T, index: number, array: T[]) => Promise<U>, skipNilResults: boolean = true): Promise<U[]> {
  let ret: U[] = [];
  for (let i = 0; i < this.length; i++) {
    let fnRet = await callbackfn(this[i], i, this);
    if (skipNilResults && isUnset(fnRet)) {
      continue;
    }
    ret.push(fnRet);
  }
  return ret;
}

function arrayMove<T>(arr: T[], fromIndex: number, toIndex: number) {
  let element = arr[fromIndex];
  arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, element);
}

// Returns the number in 'arr' that is closest to 'target'
export function arrayClosestNumber(arr: number[], target: number) {
  return arr.reduce((prev: number, curr: number) => {
    return (Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev);
  });
}

export function arrayRemove<T>(arr: T[], items: T[]) {
  for (let item of items) {
    let index = arr.indexOf(item);
    if (index > -1) {
      arr.splice(index, 1);
    }
  }
}