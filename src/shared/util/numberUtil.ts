import { isUnset } from './genericUtil.ts';

/**
 * Returns true if empty (false, null, undefined), otherwise returns false if non-empty (zero is considered non-empty).
 */
export function isNumberEmpty(n: number): boolean {
    return !n && n !== 0;
}

export function isNumeric(value: any): boolean {
  if (typeof value === 'number') {
    return true;
  } else if (typeof value === 'string') {
    return /^[-+]?\d*(\.\d*)?$/.test(value);
  } else {
    return isNumeric(String(value));
  }
}

export function isInt(value: any): boolean {
  if (isNaN(value)) {
    return false;
  } else if (typeof value === 'number') {
    return Math.trunc(value) === value;
  } else if (typeof value === 'string') {
    return /^-?\d+$/.test(value);
  } else {
    try {
      return isInt(String(value));
    } catch (e) {
      return false;
    }
  }
}

export function toNumber(x: string | number) {
    if (typeof x === 'number') {
        return x;
    } else if (x.includes('.')) {
        return parseFloat(x);
    } else {
        return toInt(x);
    }
}

export function isSafeInt(x: any): boolean {
  if (!isInt(x)) {
    return false;
  }
  if (typeof x === 'string' && x.length > 16) {
    return false;
  }
  const num = Number(x);
  return !isNaN(num) && Number.isSafeInteger(num);
}

export function toInt(x: any): number {
  if (isUnset(x)) {
    return NaN;
  } else if (typeof x === 'number') {
    return x | 0;
  } else if (typeof x === 'string') {
    if (!isSafeInt(x)) {
      throw new Error('Unsafe integer: ' + x);
    }
    try {
      return parseInt(x);
    } catch (e) {
      return NaN;
    }
  } else {
    return NaN;
  }
}

/**
 * If the parameter passed into this function is in the form of an integer, then it'll be returned as an integer,
 * otherwise the original parameter will be returned.
 */
export function maybeInt(x: any): any {
  return isSafeInt(x) ? toInt(x) : x;
}

export function constrainNumber(n: number, min: number, max: number) {
  if (n < min) {
    return min;
  }
  if (n > max) {
    return max;
  }
  return n;
}
