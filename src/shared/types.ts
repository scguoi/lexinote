export interface WordEntry {
  id: string;
  word: string;
  normalizedWord: string;
  lemma?: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  examples: Array<{ sentence: string; translation: string }>;
  etymology: string;
  mnemonic?: string;
  sources: Array<{
    url: string;
    title: string;
    context: string;
    seenAt: number;
  }>;
  sourceLanguage: string;
  targetLanguage: string;
  addedAt: number;
  lastSeenAt: number;
  lookupCount: number;
  status: 'new' | 'reviewing' | 'mastered';
  starred: boolean;
}

export interface Settings {
  apiBaseUrl: string;
  apiKey: string;
  fastModel: string;
  smartModel: string;
  sourceLanguage: string;
  targetLanguage: string;
  uiLanguage: string;
  theme: 'light' | 'dark';
}

export interface StorageSchema {
  version: number;
  words: WordEntry[];
  settings: Settings;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export type RequestMessage =
  | { type: 'LOOKUP_REQUEST'; requestId: string; word: string; context: string; url: string; title: string; isWord: boolean }
  | { type: 'CANCEL'; requestId: string };

export type ResponseMessage =
  | { type: 'STREAM_CHUNK'; requestId: string; content: string }
  | { type: 'STREAM_COMPLETE'; requestId: string; fullText: string }
  | { type: 'STREAM_ERROR'; requestId: string; error: string; code: 'NETWORK' | 'AUTH' | 'RATE_LIMIT' | 'MODEL' | 'TIMEOUT' }
  | { type: 'STREAM_CANCELLED'; requestId: string };

export type SaveMessage =
  | { type: 'SAVE_WORD'; entry: WordEntry }
  | { type: 'SAVE_RESULT'; success: boolean; isDuplicate: boolean; lookupCount?: number };
