import { describe, it, expect } from 'vitest';
import { generateId, checkAnswer, parseCSV } from './utils';

describe('utils', () => {
  describe('generateId', () => {
    it('returns consistent ID for same input', () => {
      const id1 = generateId('Hello', 'World');
      const id2 = generateId('Hello', 'World');
      expect(id1).toBe(id2);
    });

    it('returns different IDs for different input', () => {
      const id1 = generateId('Hello', 'World');
      const id2 = generateId('Hello', 'Korea');
      expect(id1).not.toBe(id2);
    });
  });

  describe('checkAnswer', () => {
    it('returns true for exact match', () => {
      expect(checkAnswer('apple', 'apple')).toBe(true);
    });

    it('returns true for case insensitive match', () => {
      expect(checkAnswer('Apple', 'apple')).toBe(true);
    });

    it('returns true ignoring punctuation', () => {
      expect(checkAnswer('apple.', 'apple')).toBe(true);
      expect(checkAnswer('apple!', 'apple')).toBe(true);
    });

    it('returns true ignoring whitespace', () => {
      expect(checkAnswer('ap ple', 'apple')).toBe(true);
    });

    it('returns false for incorrect answer', () => {
      expect(checkAnswer('banana', 'apple')).toBe(false);
    });
  });

  describe('parseCSV', () => {
    it('parses simple CSV', () => {
      const csv = `name,age
Alice,30
Bob,25`;
      const expected = [
        ['name', 'age'],
        ['Alice', '30'],
        ['Bob', '25']
      ];
      expect(parseCSV(csv)).toEqual(expected);
    });

    it('handles quoted fields with commas', () => {
      const csv = `id,description
1,"Hello, World"
2,Test`;
      const expected = [
        ['id', 'description'],
        ['1', 'Hello, World'],
        ['2', 'Test']
      ];
      expect(parseCSV(csv)).toEqual(expected);
    });
  });
});
