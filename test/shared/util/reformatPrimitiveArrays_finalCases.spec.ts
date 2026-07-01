import { reformatPrimitiveArrays } from '../../../src/shared/util/stringUtil.ts';

describe('reformatPrimitiveArrays - special characters and unicode', () => {
  describe('strings containing brackets', () => {
    test('should handle strings containing array brackets', () => {
      const testInput = {
        arr: ["test[array]", "another[test", "]bracket"],
        normal: [1, 2, 3]
      };
      const jsonStr = JSON.stringify(testInput, null, 2);
      const result = reformatPrimitiveArrays(jsonStr);
      
      expect(result).toMatch(/\[ "test\[array\]", "another\[test", "\]bracket" \]/);
      expect(result).toMatch(/\[ 1, 2, 3 \]/);
      
      const parsed = JSON.parse(result);
      expect(parsed).toEqual(testInput);
    });

    test('should handle string containing JSON-like content', () => {
      const testInput = {
        data: ['{"key": [1,2,3]}', "test", true]
      };
      const jsonStr = JSON.stringify(testInput, null, 2);
      const result = reformatPrimitiveArrays(jsonStr);
      
      expect(result).toContain('[ "{\\"key\\": [1,2,3]}", "test", true ]');
      
      const parsed = JSON.parse(result);
      expect(parsed).toEqual(testInput);
    });
  });

  describe('object keys with special names', () => {
    test('should handle object keys containing brackets', () => {
      const testInput = {
        "array": [1, 2, 3],
        "[test]": [4, 5, 6],
        "my-array": [7, 8, 9]
      };
      const jsonStr = JSON.stringify(testInput, null, 2);
      const result = reformatPrimitiveArrays(jsonStr);
      
      expect(result).toMatch(/\[ 1, 2, 3 \]/);
      expect(result).toMatch(/\[ 4, 5, 6 \]/);
      expect(result).toMatch(/\[ 7, 8, 9 \]/);
      
      const parsed = JSON.parse(result);
      expect(parsed).toEqual(testInput);
    });
  });

  describe('unicode characters', () => {
    test('should handle array containing Unicode characters', () => {
      const testInput = {
        arr: ["Hello 世界", "Test 🚀", "Émoji ñ"]
      };
      const jsonStr = JSON.stringify(testInput, null, 2);
      const result = reformatPrimitiveArrays(jsonStr);
      
      expect(result).toMatch(/\[.*\]/);
      
      const parsed = JSON.parse(result);
      expect(parsed).toEqual(testInput);
    });
  });

  describe('null values', () => {
    test('should handle arrays with multiple null values', () => {
      const testInput = {
        arr: [null, null, 1, null]
      };
      const jsonStr = JSON.stringify(testInput, null, 2);
      const result = reformatPrimitiveArrays(jsonStr);
      
      expect(result).toMatch(/\[ null, null, 1, null \]/);
      
      const parsed = JSON.parse(result);
      expect(parsed).toEqual(testInput);
    });
  });
});

