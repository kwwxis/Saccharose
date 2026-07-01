import { reformatPrimitiveArrays } from '../../../src/shared/util/stringUtil.ts';

describe('reformatPrimitiveArrays - additional cases', () => {
  describe('number formats', () => {
    test('should not compact array with invalid number format (leading zeros)', () => {
      const malformed = '{\n  "arr": [\n    01,\n    2\n  ]\n}';
      const result = reformatPrimitiveArrays(malformed);

      // Should not compact invalid numbers
      expect(result).toContain('01');
    });

    test('should handle very large numbers', () => {
      const testInput = {
        arr: [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, 999999999999999999]
      };
      const jsonStr = JSON.stringify(testInput, null, 2);
      const result = reformatPrimitiveArrays(jsonStr);

      expect(result).toMatch(/\[.*\]/);
      const parsed = JSON.parse(result);
      expect(parsed.arr).toHaveLength(3);
    });

    test('should handle negative numbers', () => {
      const testInput = { arr: [-1, -0, -123.456, -1e10] };
      const jsonStr = JSON.stringify(testInput, null, 2);
      const result = reformatPrimitiveArrays(jsonStr);

      expect(result).toMatch(/\[ -1, 0, -123\.456, -10000000000 \]/);
      const parsed = JSON.parse(result);
      expect(parsed).toEqual({ arr: [-1, 0, -123.456, -1e10] });
    });

    test('should handle fractional numbers', () => {
      const testInput = { arr: [0.1, 0.123456789, 1.0, 0.0] };
      const jsonStr = JSON.stringify(testInput, null, 2);
      const result = reformatPrimitiveArrays(jsonStr);

      expect(result).toMatch(/\[.*0\.1.*\]/);
      const parsed = JSON.parse(result);
      expect(parsed).toEqual(testInput);
    });
  });

  describe('complex nested structures', () => {
    test('should handle deeply nested structure', () => {
      const testInput = {
        outer: [
          {
            inner: [1, 2, 3],
            other: "test"
          },
          [4, 5, 6],
          {
            another: [7, 8, 9]
          }
        ],
        primitiveArray: [10, 11, 12]
      };
      const jsonStr = JSON.stringify(testInput, null, 2);
      const result = reformatPrimitiveArrays(jsonStr);

      // Inner primitive arrays should be compacted
      expect(result).toMatch(/\[ 1, 2, 3 \]/);
      expect(result).toMatch(/\[ 4, 5, 6 \]/);
      expect(result).toMatch(/\[ 7, 8, 9 \]/);
      expect(result).toMatch(/\[ 10, 11, 12 \]/);

      const parsed = JSON.parse(result);
      expect(parsed).toEqual(testInput);
    });
  });

  describe('single element arrays', () => {
    test('should compact single element arrays', () => {
      const testInput = {
        num: [1],
        str: ["test"],
        bool: [true],
        nul: [null]
      };
      const jsonStr = JSON.stringify(testInput, null, 2);
      const result = reformatPrimitiveArrays(jsonStr);

      expect(result).toMatch(/\[ 1 \]/);
      expect(result).toMatch(/\[ "test" \]/);
      expect(result).toMatch(/\[ true \]/);
      expect(result).toMatch(/\[ null \]/);

      const parsed = JSON.parse(result);
      expect(parsed).toEqual(testInput);
    });
  });

  describe('edge cases without arrays', () => {
    test('should leave unchanged when no arrays present', () => {
      const testInput = {
        a: 1,
        b: "test",
        c: {
          d: true,
          e: null
        }
      };
      const jsonStr = JSON.stringify(testInput, null, 2);
      const result = reformatPrimitiveArrays(jsonStr);

      expect(result).toBe(jsonStr);
    });
  });

  describe('whitespace handling', () => {
    test('should handle different whitespace patterns', () => {
      const testInput = '{\n  "arr":  [  1  ,  2  ,  3  ]  \n}';
      const result = reformatPrimitiveArrays(testInput);

      expect(result).toMatch(/\[ 1, 2, 3 \]/);
      expect(() => JSON.parse(result)).not.toThrow();
    });
  });
});

