import { isset, isUnset } from './genericUtil.ts';

/**
 * Returns true if empty (false, null, undefined), otherwise returns false if non-empty (zero is considered non-empty).
 */
export function isNumberEmpty(n: number): boolean {
    return !n && n !== 0;
}

/**
 * Returns true if the value is numeric (number or string that can be converted to a number), otherwise returns false.
 *
 * Considered numeric if already a number or matching the regex for a number (including optional sign and decimal point).
 *
 * This does not consider scientific notation (e.g., "1e10") as numeric.
 *
 * @param value The value to check.
 * @returns True if the value is numeric, otherwise false.
 */
export function isNumeric(value: any): boolean {
  if (typeof value === 'number') {
    return true;
  } else if (typeof value === 'string') {
    return /^[-+]?\d*(\.\d*)?$/.test(value);
  } else {
    return isNumeric(String(value));
  }
}

/**
 * Returns true if the value is an integer (number or string that can be converted to an integer), otherwise returns false.
 *
 * @param value The value to check.
 * @returns True if the value is an integer, otherwise false.
 */
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

/**
 * Converts a string or number to a number.
 *
 * If the input is a string with a decimal point, it will be converted to a float.
 *
 * If it is an integer string, it will be converted to an integer.
 *
 * If the input is already a number, it will be returned as-is.
 *
 * @param x The string or number to convert.
 * @returns The converted number.
 */
export function toNumber(x: string | number) {
    if (typeof x === 'number') {
        return x;
    } else if (x.includes('.')) {
        return parseFloat(x);
    } else {
        return toInt(x);
    }
}

/**
 * Returns true if the value is a safe integer (number or string that can be converted to a safe integer), otherwise returns false.
 *
 * A safe integer is one that isn't `NaN` and within the max and min safe integer range in JavaScript.
 *
 * @param x The value to check.
 * @returns True if the value is a safe integer, otherwise false.
 */
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

/**
 * Converts a string or number to an integer.
 *
 * If the input is already an integer, it will be returned as-is.
 *
 * If the input contains a decimal point, it will be truncated to an integer.
 *
 * @param x The string or number to convert.
 * @param defaultIfNaN The value to return if the input cannot be converted to an integer. If not provided, `NaN` will be returned.
 * @returns The converted integer, or `defaultIfNaN` if the input cannot be converted.
 */
export function toInt(x: any, defaultIfNaN?: number): number {
  if (isUnset(x)) {
    return isset(defaultIfNaN) ? defaultIfNaN : NaN;
  } else if (typeof x === 'number') {
    return x | 0;
  } else if (typeof x === 'string') {
    if (!isInt(x)) {
      return isset(defaultIfNaN) ? defaultIfNaN : NaN;
    } else if (!isSafeInt(x)) {
      throw new Error('Attempt to convert unsafe integer as string to number: ' + x);
    }
    try {
      return parseInt(x);
    } catch (e) {
      return isset(defaultIfNaN) ? defaultIfNaN : NaN;
    }
  } else {
    return isset(defaultIfNaN) ? defaultIfNaN : NaN;
  }
}

/**
 * The minimum and maximum values that fit in a Postgres/SQL `integer` (int4) column.
 */
export const INT32_MIN = -2147483648;
export const INT32_MAX = 2147483647;

/**
 * Returns true if the value is an integer (per {@link isInt}) that also fits within the bounds of a 32-bit signed
 * integer (i.e. a Postgres/SQL `integer` column). Use this before querying an `integer` id column with a
 * user-supplied value, since Postgres will throw a range error (rather than simply returning no rows) for
 * out-of-range values.
 *
 * @param value The value to check.
 * @returns True if the value is a 32-bit integer, otherwise false.
 */
export function isInt32(value: any): boolean {
  if (!isInt(value)) {
    return false;
  }
  const num = Number(value);
  return !isNaN(num) && num >= INT32_MIN && num <= INT32_MAX;
}

/**
 * If the parameter passed into this function is in the form of an integer, then it'll be returned as an integer,
 * otherwise the original parameter will be returned.
 *
 * @param x The value to check and possibly convert to an integer.
 * @returns The integer value if the input is a safe integer, otherwise the original input.
 */
export function maybeInt(x: any): any {
  return isSafeInt(x) ? toInt(x) : x;
}

/**
 * Constrains a number to be within a specified range.
 *
 * @param n The number to constrain.
 * @param min The minimum value the number can be.
 * @param max The maximum value the number can be.
 * @returns The constrained number, which will be the original number if it is within the range, or the min/max if it is outside the range.
 */
export function constrainNumber(n: number, min: number, max: number) {
  if (n < min) {
    return min;
  }
  if (n > max) {
    return max;
  }
  return n;
}
