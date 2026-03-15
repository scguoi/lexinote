import { describe, it, expect } from 'vitest';
import { detectSelectionType } from '../src/shared/utils';

describe('Selection detection', () => {
  it('should detect single word', () => {
    expect(detectSelectionType('ephemeral')).toBe('word');
  });

  it('should detect hyphenated word', () => {
    expect(detectSelectionType('well-known')).toBe('word');
  });

  it('should detect word with apostrophe', () => {
    expect(detectSelectionType("don't")).toBe('word');
  });

  it('should detect sentence', () => {
    expect(detectSelectionType('This is a sentence.')).toBe('sentence');
  });

  it('should reject too long selection', () => {
    const long = 'a'.repeat(501);
    expect(detectSelectionType(long)).toBe('too-long');
  });

  it('should detect capitalized word', () => {
    expect(detectSelectionType('Hello')).toBe('word');
  });

  it('should detect word with trailing space as sentence', () => {
    expect(detectSelectionType('hello world')).toBe('sentence');
  });
});
