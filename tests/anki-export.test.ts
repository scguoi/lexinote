import { describe, it, expect } from 'vitest';
import { exportToAnki } from '../src/shared/anki-export';
import type { WordEntry, Settings } from '../src/shared/types';

const mockSettings: Settings = {
  apiBaseUrl: 'https://api.openai.com/v1',
  apiKey: 'test',
  fastModel: 'gpt-3.5-turbo',
  smartModel: 'gpt-4',
  sourceLanguage: 'en',
  targetLanguage: 'zh',
  uiLanguage: 'auto',
  theme: 'light',
};

const mockWord: WordEntry = {
  id: '1',
  word: 'ephemeral',
  normalizedWord: 'ephemeral',
  phonetic: '/test/',
  partOfSpeech: 'adjective',
  definition: 'short-lived',
  examples: [{ sentence: 'It is ephemeral.', translation: 'It is short.' }],
  etymology: 'Greek',
  sources: [{ url: 'https://test.com', title: 'Test', context: 'test', seenAt: 0 }],
  sourceLanguage: 'en',
  targetLanguage: 'zh',
  addedAt: 0,
  lastSeenAt: 0,
  lookupCount: 1,
  status: 'new',
  starred: true,
};

describe('exportToAnki', () => {
  it('should generate TSV with BOM', () => {
    const result = exportToAnki([mockWord], mockSettings);
    expect(result.content.startsWith('\uFEFF')).toBe(true);
    expect(result.exported).toBe(1);
  });

  it('should skip words without definition', () => {
    const noDefWord = { ...mockWord, definition: '' };
    const result = exportToAnki([noDefWord], mockSettings);
    expect(result.skipped).toBe(1);
    expect(result.exported).toBe(0);
  });

  it('should generate correct tags', () => {
    const result = exportToAnki([mockWord], mockSettings);
    expect(result.content).toContain('lexinote');
    expect(result.content).toContain('pos:adjective');
    expect(result.content).toContain('status:new');
    expect(result.content).toContain('lang:en-zh');
    expect(result.content).toContain('starred');
  });

  it('should escape tabs and newlines', () => {
    const wordWithSpecial = { ...mockWord, definition: 'has\ttab\nnewline' };
    const result = exportToAnki([wordWithSpecial], mockSettings);
    expect(result.content).toContain('has tab<br>newline');
    expect(result.content).toContain('<br>');
  });
});
