/**
 * Checks if a string is a valid Roman numeral.
 * @param str The string to check.
 * @returns True if the string is a valid Roman numeral, otherwise false.
 */
export function isValidRomanNumeral(str: string): boolean {
  return /^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(str);
}

export function extractRomanNumeral(str: string): string {
  return !str ? str : str.split(' ').find(s => isValidRomanNumeral(s));
}

export function replaceRomanNumerals(str: string, replacer: (roman: string) => string) {
  if (!str) {
    return str;
  }
  let split = str.split(' ');
  split = split.map(part => {
    if (isValidRomanNumeral(part)) {
      return replacer(part);
    } else {
      return part;
    }
  });
  return split.join(' ');
}

/**
 * Converts an integer to a Roman numeral string.
 * @param num The integer to convert.
 * @returns The Roman numeral representation of the integer, or NaN if the input is not a number.
 */
export function romanize(num: number) {
  if (isNaN(num))
    return NaN;
  let digits = String(+num).split(''),
    key = ['', 'C', 'CC', 'CCC', 'CD', 'D', 'DC', 'DCC', 'DCCC', 'CM',
      '', 'X', 'XX', 'XXX', 'XL', 'L', 'LX', 'LXX', 'LXXX', 'XC',
      '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'],
    roman = '',
    i = 3;
  while (i--)
    roman = (key[+digits.pop() + (i * 10)] || '') + roman;
  return Array(+digits.join('') + 1).join('M') + roman;
}

/**
 * Converts a Roman numeral string to an integer.
 * @param s The Roman numeral string to convert.
 * @returns The integer value of the Roman numeral, or -1 if the input is invalid.
 */
export function romanToInt(s: string) {
  if (!s) {
    return -1;
  }
  const sym = {
    'I': 1,
    'V': 5,
    'X': 10,
    'L': 50,
    'C': 100,
    'D': 500,
    'M': 1000,
  };
  let result = 0;
  for (let i = 0; i < s.length; i++) {
    const cur = sym[s[i]];
    const next = sym[s[i + 1]];

    if (cur < next) {
      result += next - cur; // IV -> 5 - 1 = 4
      i++;
    } else {
      result += cur;
    }
  }
  return result;
}
