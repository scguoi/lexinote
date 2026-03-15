import { describe, it, expect } from 'vitest';
import type { WordEntry, Settings } from '../src/shared/types';

describe('WordEntry type', () => {
  it('should accept valid word entry', () => {
    const entry: WordEntry = {
      id: 'test-id',
      word: 'ephemeral',
      normalizedWord: 'ephemeral',
      lemma: 'ephemeral',
      phonetic: '/ɪˈfemərəl/',
      partOfSpeech: 'adjective',
      definition: 'lasting for a very short time',
      examples: [
        { sentence: 'Fame is ephemeral.', translation: 'Fame is short-lived.' }
      ],
      etymology: 'From Greek ephemeros',
      mnemonic: undefined,
      sources: [
        {
          url: 'https://example.com',
          title: 'Example Article',
          context: 'Fame is ephemeral in the modern world.',
          seenAt: Date.now()
        }
      ],
      sourceLanguage: 'en',
      targetLanguage: 'zh',
      addedAt: Date.now(),
      lastSeenAt: Date.now(),
      lookupCount: 1,
      status: 'new',
      starred: false
    };

    expect(entry.word).toBe('ephemeral');
    expect(entry.sources).toHaveLength(1);
  });
});
