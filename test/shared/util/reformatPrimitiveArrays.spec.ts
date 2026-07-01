import { reformatPrimitiveArrays } from '../../../src/shared/util/stringUtil.ts';

describe('reformatPrimitiveArrays', () => {
  describe('basic functionality', () => {
    test('should compact simple primitive array', () => {
      const input = JSON.stringify({ arr: [1, 2, 3] }, null, 2);
      const result = reformatPrimitiveArrays(input);
      expect(result).toMatch(/\[ 1, 2, 3 \]/);
    });

    test('should compact array with strings', () => {
      const input = JSON.stringify({ arr: ["a", "b", "c"] }, null, 2);
      const result = reformatPrimitiveArrays(input);
      expect(result).toMatch(/\[ "a", "b", "c" \]/);
    });

    test('should compact array with mixed primitive types', () => {
      const input = JSON.stringify({ arr: [1, true, false, null, "str", -3.14] }, null, 2);
      const result = reformatPrimitiveArrays(input);
      expect(result).toMatch(/\[ 1, true, false, null, "str", -3\.14 \]/);
    });

    test('should compact empty array', () => {
      const input = JSON.stringify({ arr: [] }, null, 2);
      const result = reformatPrimitiveArrays(input);
      expect(result).toMatch(/\[\]/);
    });

    test('should NOT compact array with objects', () => {
      const input = JSON.stringify({ arr: [{ a: 1 }, 2] }, null, 2);
      const result = reformatPrimitiveArrays(input);
      // Should remain multi-line, not compacted to single line
      expect(result).toContain('[\n');
    });
  });

  describe('string handling', () => {
    test('should handle strings with escaped quotes', () => {
      const input = JSON.stringify({ arr: ["he said \"hi\"", "test"] }, null, 2);
      const result = reformatPrimitiveArrays(input);
      expect(result).toMatch(/\[ "he said \\"hi\\"", "test" \]/);
      expect(() => JSON.parse(result)).not.toThrow();
    });

    test('should handle strings with backslashes', () => {
      const input = JSON.stringify({ arr: ["a\\b", "c"] }, null, 2);
      const result = reformatPrimitiveArrays(input);
      expect(result).toMatch(/\[ "a\\\\b", "c" \]/);
      expect(() => JSON.parse(result)).not.toThrow();
    });

    test('should handle strings with unicode', () => {
      const input = JSON.stringify({ arr: ["test\u0041test", "b"] }, null, 2);
      const result = reformatPrimitiveArrays(input);
      expect(result).toMatch(/\[ "[^"]+", "b" \]/);
      expect(() => JSON.parse(result)).not.toThrow();
    });

    test('should handle strings with special characters', () => {
      const input = JSON.stringify({ arr: ["test\nline", "tab\there"] }, null, 2);
      const result = reformatPrimitiveArrays(input);
      expect(result).toMatch(/\[ "[^"]+", "[^"]+" \]/);
      expect(() => JSON.parse(result)).not.toThrow();
    });

    test('should handle string ending with backslash', () => {
      const input = '{\n  "arr": [\n    "test\\\\",\n    "end"\n  ]\n}';
      const result = reformatPrimitiveArrays(input);
      expect(result).toMatch(/\[ "test\\\\", "end" \]/);
      expect(() => JSON.parse(result)).not.toThrow();
    });
  });

  describe('number handling', () => {
    test('should handle scientific notation', () => {
      const input = JSON.stringify({ arr: [1e5, 1.5e-10, -2.3e+4] }, null, 2);
      const result = reformatPrimitiveArrays(input);
      expect(result).toMatch(/\[ 100000, 1\.5e-10, -23000 \]/);
    });

    test('should handle multiple numbers', () => {
      const input = JSON.stringify({ arr: [1, 2, 3, 4, 5] }, null, 2);
      const result = reformatPrimitiveArrays(input);
      expect(result).toMatch(/\[ 1, 2, 3, 4, 5 \]/);
    });
  });

  describe('nested structures', () => {
    test('should compact nested primitive arrays', () => {
      const input = JSON.stringify({ arr: [[1, 2], [3, 4]] }, null, 2);
      const result = reformatPrimitiveArrays(input);
      expect(result).toMatch(/\[ 1, 2 \]/);
      expect(result).toMatch(/\[ 3, 4 \]/);
    });
  });

  describe('error handling', () => {
    test('should throw error for malformed JSON with unclosed string', () => {
      const input = '{ "arr": ["unclosed string }';
      expect(() => reformatPrimitiveArrays(input)).toThrow('Invalid JSON string: unterminated string');
    });
  });

  describe('output validation', () => {
    test('should produce valid JSON after compacting', () => {
      const input = JSON.stringify({ arr: ["a", "b\"c", "d\\e"] }, null, 2);
      const result = reformatPrimitiveArrays(input);
      const parsed = JSON.parse(result);
      expect(parsed).toEqual({ arr: ["a", "b\"c", "d\\e"] });
    });
  });
});

