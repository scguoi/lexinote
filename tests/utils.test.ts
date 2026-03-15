import { describe, it, expect } from 'vitest';
import { normalizeWord, detectSelectionType } from '../src/shared/utils';

describe('normalizeWord', () => {
  it('should convert to lowercase', () => {
    expect(normalizeWord('Running')).toBe('running');
  });

  it('should strip leading/trailing punctuation', () => {
    expect(normalizeWord('"running,"')).toBe('running');
  });

  it('should preserve hyphens and apostrophes', () => {
    expect(normalizeWord("well-known")).toBe('well-known');
    expect(normalizeWord("don't")).toBe("don't");
  });

  it('should trim whitespace', () => {
    expect(normalizeWord('  running  ')).toBe('running');
  });
});

describe('detectSelectionType', () => {
  it('should detect word mode for single word', () => {
    expect(detectSelectionType('ephemeral')).toBe('word');
  });

  it('should detect word mode for hyphenated word', () => {
    expect(detectSelectionType('well-known')).toBe('word');
  });

  it('should detect sentence mode for multiple words', () => {
    expect(detectSelectionType('This is a sentence')).toBe('sentence');
  });

  it('should reject selections over 500 characters', () => {
    const longText = 'a'.repeat(501);
    expect(detectSelectionType(longText)).toBe('too-long');
  });
});
