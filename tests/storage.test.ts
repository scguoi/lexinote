import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageManager } from '../src/shared/storage';

const mockStorage: Record<string, any> = {};

vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: vi.fn((_keys: any) => Promise.resolve({ ...mockStorage })),
      set: vi.fn((data: any) => {
        Object.assign(mockStorage, data);
        return Promise.resolve();
      }),
    },
  },
});

describe('StorageManager', () => {
  let storage: StorageManager;

  beforeEach(() => {
    storage = new StorageManager();
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    vi.clearAllMocks();
  });

  it('should initialize with default schema', async () => {
    await storage.initialize();

    expect(chrome.storage.local.set).toHaveBeenCalled();
    const setCall = vi.mocked(chrome.storage.local.set).mock.calls[0][0];
    expect(setCall).toHaveProperty('version', 1);
    expect(setCall).toHaveProperty('words');
    expect(setCall).toHaveProperty('settings');
  });

  it('should add a new word', async () => {
    await storage.initialize();

    const word = {
      id: 'test-1',
      word: 'ephemeral',
      normalizedWord: 'ephemeral',
      phonetic: '/test/',
      partOfSpeech: 'adj',
      definition: 'short-lived',
      examples: [],
      etymology: '',
      sources: [{ url: 'https://test.com', title: 'Test', context: 'test context', seenAt: Date.now() }],
      sourceLanguage: 'en',
      targetLanguage: 'zh',
      addedAt: Date.now(),
      lastSeenAt: Date.now(),
      lookupCount: 1,
      status: 'new' as const,
      starred: false,
    };

    await storage.addWord(word);
    const words = await storage.getWords();
    expect(words).toHaveLength(1);
    expect(words[0].word).toBe('ephemeral');
  });

  it('should get settings', async () => {
    await storage.initialize();
    const settings = await storage.getSettings();
    expect(settings).toHaveProperty('apiBaseUrl');
    expect(settings).toHaveProperty('fastModel');
  });
});
