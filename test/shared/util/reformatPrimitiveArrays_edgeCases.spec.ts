import { reformatPrimitiveArrays } from '../../../src/shared/util/stringUtil.ts';

describe('reformatPrimitiveArrays - edge cases', () => {
  describe('escape sequence handling', () => {
    test('should handle string ending with escaped quote', () => {
      const testInput = { arr: ['test"', 'another'] };
      const jsonStr = JSON.stringify(testInput, null, 2);
      const result = reformatPrimitiveArrays(jsonStr);
      
      expect(result).toContain('[ "test\\"", "another" ]');
      const parsed = JSON.parse(result);
      expect(parsed).toEqual(testInput);
    });

    test('should handle multiple consecutive backslashes', () => {
      const testInput = { arr: ['a\\b', 'c\\\\d', 'e\\\\\\f'] };
      const jsonStr = JSON.stringify(testInput, null, 2);
      const result = reformatPrimitiveArrays(jsonStr);
      
      expect(result).toContain('[ "a\\\\b", "c\\\\\\\\d", "e\\\\\\\\\\\\f" ]');
      const parsed = JSON.parse(result);
      expect(parsed).toEqual(testInput);
    });

    test('should handle string containing just a quote', () => {
      const testInput = { arr: ['"', 'normal'] };
      const jsonStr = JSON.stringify(testInput, null, 2);
      const result = reformatPrimitiveArrays(jsonStr);
      
      expect(result).toContain('[ "\\"", "normal" ]');
      const parsed = JSON.parse(result);
      expect(parsed).toEqual(testInput);
    });

    test('should handle various escape sequences', () => {
      const testInput = {
        arr: ['quote:"', 'backslash:\\', 'newline:\n', 'tab:\t', 'return:\r', 'slash:/']
      };
      const jsonStr = JSON.stringify(testInput, null, 2);
      const result = reformatPrimitiveArrays(jsonStr);
      
      expect(result).toMatch(/\[.*\]/);
      const parsed = JSON.parse(result);
      expect(parsed).toEqual(testInput);
    });
  });

  describe('empty and whitespace strings', () => {
    test('should handle empty strings', () => {
      const testInput = { arr: ['', 'test', ''] };
      const jsonStr = JSON.stringify(testInput, null, 2);
      const result = reformatPrimitiveArrays(jsonStr);
      
      expect(result).toContain('[ "", "test", "" ]');
      const parsed = JSON.parse(result);
      expect(parsed).toEqual(testInput);
    });
  });
});

