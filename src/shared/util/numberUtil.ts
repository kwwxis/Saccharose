/**
 * Returns true if empty (false, null, undefined), otherwise returns false if non-empty (zero is considered non-empty).
 */
export function isNumberEmpty(n: number): boolean {
    return !n && n !== 0;
}

export function isInteger(value: any): boolean {
  if (typeof value === 'number') {
    return (value | 0) === value;
  } else if (typeof value === 'string') {
    return /^-?\d+$/.test(value);
  } else {
    return isInteger(String(value));
  }
}

export function isInt(value: any): boolean {
    return isInteger(value);
}

export function toNumber(x: string | number) {
    if (typeof x === 'number') {
        return x;
    } else if (x.includes('.')) {
        return parseFloat(x);
    } else {
        return parseInt(x);
    }
}

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