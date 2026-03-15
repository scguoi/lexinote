# LexiNote Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome extension for vocabulary capture during English reading with AI-powered definitions and Anki export.

**Architecture:** Manifest V3 extension with React UI, background service worker for API calls, content script for page interaction, and two-tier caching (vocabulary + ephemeral).

**Tech Stack:** React 18, TypeScript, Vite, Chrome Extension Manifest V3, OpenAI-compatible API (SSE streaming), chrome.storage.local

---

## Chunk 1: Project Foundation & Core Types

### Task 1: Initialize Project Structure

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `manifest.json`

- [ ] **Step 1: Create package.json with dependencies**

```bash
cd /Users/scguo/.tries/2026-03-15-lexinote
npm init -y
```

- [ ] **Step 2: Install core dependencies**

```bash
npm install react@18 react-dom@18
npm install -D typescript @types/react @types/react-dom @types/chrome vite @vitejs/plugin-react vitest @testing-library/react @testing-library/jest-dom happy-dom
```

Expected: Dependencies installed successfully

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["chrome", "vite/client"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: Create tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        'background/service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
        'content/content-script': resolve(__dirname, 'src/content/content-script.tsx'),
        popup: resolve(__dirname, 'src/popup/popup.html'),
        options: resolve(__dirname, 'src/options/options.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './tests/setup.ts',
  },
});
```

- [ ] **Step 6: Create manifest.json**

```json
{
  "manifest_version": 3,
  "name": "LexiNote",
  "version": "1.0.0",
  "description": "Vocabulary capture tool for English reading with AI-powered definitions",
  "permissions": [
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "https://api.openai.com/*",
    "https://api.deepseek.com/*",
    "https://api.groq.com/*",
    "https://api.together.xyz/*"
  ],
  "optional_host_permissions": [
    "https://*/*"
  ],
  "background": {
    "service_worker": "background/service-worker.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/content-script.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },
  "options_page": "options.html",
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  "default_locale": "en"
}
```

- [ ] **Step 7: Create directory structure**

```bash
mkdir -p src/{background,content/{components,hooks},popup/components,options/components,shared} public/icons tests _locales/{en,zh_CN,zh_TW}
```

- [ ] **Step 8: Commit**

```bash
git add package.json tsconfig.json tsconfig.node.json vite.config.ts manifest.json
git commit -m "feat: initialize project structure with Vite, React, and Manifest V3"
```

### Task 2: Define Core Types

**Files:**
- Create: `src/shared/types.ts`
- Create: `src/shared/constants.ts`
- Create: `tests/types.test.ts`

- [ ] **Step 1: Write test for WordEntry type validation**

```typescript
// tests/types.test.ts
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
        { sentence: 'Fame is ephemeral.', translation: '名声是短暂的。' }
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test tests/types.test.ts
```

Expected: FAIL - types module not found

- [ ] **Step 3: Create types.ts**

```typescript
// src/shared/types.ts

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

// Port message types
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test tests/types.test.ts
```

Expected: PASS

- [ ] **Step 5: Create constants.ts**

```typescript
// src/shared/constants.ts
import type { Language } from './types';

export const SOURCE_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
];

export const TARGET_LANGUAGES: Language[] = [
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'en', name: 'English', nativeName: 'English' },
];

export const DEFAULT_SETTINGS = {
  apiBaseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  fastModel: 'gpt-3.5-turbo',
  smartModel: 'gpt-4',
  sourceLanguage: 'en',
  targetLanguage: 'zh',
  uiLanguage: 'auto',
  theme: 'light' as const,
};

export const STORAGE_VERSION = 1;

export const MAX_SOURCES_PER_WORD = 10;
export const MAX_SELECTION_LENGTH = 500;
export const CONTEXT_MAX_LENGTH = 300;
export const PENDING_SAVE_TIMEOUT = 5000; // 5 seconds
export const STREAM_TIMEOUT = 30000; // 30 seconds
export const DEBOUNCE_DELAY = 200; // ms
export const THROTTLE_INTERVAL = 50; // ms
export const CACHE_MAX_ENTRIES = 100;

export const WORD_DETECTION_PATTERN = /^[a-zA-Z'-]+$/;
```

- [ ] **Step 6: Commit**

```bash
git add src/shared/types.ts src/shared/constants.ts tests/types.test.ts
git commit -m "feat: add core types and constants"
```


### Task 3: Storage Layer

**Files:**
- Create: `src/shared/storage.ts`
- Create: `src/shared/utils.ts`
- Create: `tests/storage.test.ts`
- Create: `tests/utils.test.ts`

- [ ] **Step 1: Write test for normalizeWord function**

```typescript
// tests/utils.test.ts
import { describe, it, expect } from 'vitest';
import { normalizeWord, extractContext, detectSelectionType } from '../src/shared/utils';

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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test tests/utils.test.ts
```

Expected: FAIL - utils module not found

- [ ] **Step 3: Create utils.ts**

```typescript
// src/shared/utils.ts
import { WORD_DETECTION_PATTERN, MAX_SELECTION_LENGTH } from './constants';

export function normalizeWord(word: string): string {
  return word
    .trim()
    .toLowerCase()
    .replace(/^[^\w'-]+|[^\w'-]+$/g, '');
}

export function detectSelectionType(text: string): 'word' | 'sentence' | 'too-long' {
  const trimmed = text.trim();
  
  if (trimmed.length > MAX_SELECTION_LENGTH) {
    return 'too-long';
  }
  
  if (WORD_DETECTION_PATTERN.test(trimmed)) {
    return 'word';
  }
  
  return 'sentence';
}

export function extractContext(
  selection: Selection,
  maxLength: number = 300
): string {
  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  
  // Get parent block element
  let blockElement = container.nodeType === Node.TEXT_NODE
    ? container.parentElement
    : container as Element;
  
  while (blockElement && !isBlockElement(blockElement)) {
    blockElement = blockElement.parentElement;
  }
  
  if (!blockElement) {
    return selection.toString();
  }
  
  const fullText = blockElement.textContent || '';
  const selectedText = selection.toString();
  const selectedIndex = fullText.indexOf(selectedText);
  
  if (selectedIndex === -1) {
    return selectedText;
  }
  
  // Try to find sentence boundaries
  const before = fullText.substring(0, selectedIndex);
  const after = fullText.substring(selectedIndex + selectedText.length);
  
  const sentenceStart = Math.max(
    before.lastIndexOf('. '),
    before.lastIndexOf('! '),
    before.lastIndexOf('? '),
    0
  );
  
  const sentenceEnd = findSentenceEnd(after);
  
  let context = fullText.substring(
    sentenceStart,
    selectedIndex + selectedText.length + sentenceEnd
  ).trim();
  
  // Fallback: if context is suspiciously short or looks like code
  if (context.length < 20 || /[{}[\];]/.test(context)) {
    const start = Math.max(0, selectedIndex - 100);
    const end = Math.min(fullText.length, selectedIndex + selectedText.length + 100);
    context = fullText.substring(start, end).trim();
  }
  
  return context.length > maxLength
    ? context.substring(0, maxLength) + '...'
    : context;
}

function isBlockElement(element: Element): boolean {
  const blockTags = ['P', 'DIV', 'ARTICLE', 'SECTION', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE'];
  return blockTags.includes(element.tagName);
}

function findSentenceEnd(text: string): number {
  const match = text.match(/[.!?]\s/);
  return match ? match.index! + 1 : Math.min(text.length, 100);
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test tests/utils.test.ts
```

Expected: PASS

- [ ] **Step 5: Write test for storage operations**

```typescript
// tests/storage.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageManager } from '../src/shared/storage';
import type { WordEntry } from '../src/shared/types';

// Mock chrome.storage
const mockStorage = {
  local: {
    get: vi.fn(),
    set: vi.fn(),
  },
};

global.chrome = {
  storage: mockStorage,
} as any;

describe('StorageManager', () => {
  let storage: StorageManager;

  beforeEach(() => {
    storage = new StorageManager();
    vi.clearAllMocks();
  });

  it('should initialize with default schema', async () => {
    mockStorage.local.get.mockResolvedValue({});
    
    await storage.initialize();
    
    expect(mockStorage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        version: 1,
        words: [],
      })
    );
  });

  it('should add new word', async () => {
    mockStorage.local.get.mockResolvedValue({
      version: 1,
      words: [],
      settings: {},
    });

    const word: Partial<WordEntry> = {
      word: 'ephemeral',
      normalizedWord: 'ephemeral',
      definition: 'short-lived',
    };

    await storage.addWord(word as WordEntry);

    expect(mockStorage.local.set).toHaveBeenCalled();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

```bash
npm test tests/storage.test.ts
```

Expected: FAIL - StorageManager not found

- [ ] **Step 7: Create storage.ts**

```typescript
// src/shared/storage.ts
import type { StorageSchema, WordEntry, Settings } from './types';
import { DEFAULT_SETTINGS, STORAGE_VERSION, MAX_SOURCES_PER_WORD } from './constants';
import { normalizeWord } from './utils';

export class StorageManager {
  private cache: StorageSchema | null = null;

  async initialize(): Promise<void> {
    const data = await chrome.storage.local.get(null);
    
    if (!data.version) {
      // First time initialization
      this.cache = {
        version: STORAGE_VERSION,
        words: [],
        settings: DEFAULT_SETTINGS,
      };
      await chrome.storage.local.set(this.cache);
    } else {
      this.cache = data as StorageSchema;
      
      // Run migrations if needed
      if (this.cache.version < STORAGE_VERSION) {
        await this.migrate(this.cache.version, STORAGE_VERSION);
      }
    }
  }

  async getWords(): Promise<WordEntry[]> {
    await this.ensureInitialized();
    return this.cache!.words;
  }

  async getWordByNormalized(normalizedWord: string): Promise<WordEntry | null> {
    await this.ensureInitialized();
    return this.cache!.words.find(w => w.normalizedWord === normalizedWord) || null;
  }

  async addWord(entry: WordEntry): Promise<void> {
    await this.ensureInitialized();
    this.cache!.words.push(entry);
    await this.save();
  }

  async updateWord(id: string, updates: Partial<WordEntry>): Promise<void> {
    await this.ensureInitialized();
    const index = this.cache!.words.findIndex(w => w.id === id);
    if (index !== -1) {
      this.cache!.words[index] = { ...this.cache!.words[index], ...updates };
      await this.save();
    }
  }

  async updateWordSources(
    normalizedWord: string,
    newSource: WordEntry['sources'][0]
  ): Promise<{ lookupCount: number }> {
    await this.ensureInitialized();
    const word = await this.getWordByNormalized(normalizedWord);
    
    if (!word) {
      throw new Error('Word not found');
    }

    // Add new source, maintain max limit
    word.sources.push(newSource);
    if (word.sources.length > MAX_SOURCES_PER_WORD) {
      word.sources.shift(); // Remove oldest
    }

    word.lastSeenAt = newSource.seenAt;
    word.lookupCount += 1;

    await this.updateWord(word.id, {
      sources: word.sources,
      lastSeenAt: word.lastSeenAt,
      lookupCount: word.lookupCount,
    });

    return { lookupCount: word.lookupCount };
  }

  async deleteWord(id: string): Promise<void> {
    await this.ensureInitialized();
    this.cache!.words = this.cache!.words.filter(w => w.id !== id);
    await this.save();
  }

  async getSettings(): Promise<Settings> {
    await this.ensureInitialized();
    return this.cache!.settings;
  }

  async updateSettings(updates: Partial<Settings>): Promise<void> {
    await this.ensureInitialized();
    this.cache!.settings = { ...this.cache!.settings, ...updates };
    await this.save();
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.cache) {
      await this.initialize();
    }
  }

  private async save(): Promise<void> {
    if (this.cache) {
      await chrome.storage.local.set(this.cache);
    }
  }

  private async migrate(fromVersion: number, toVersion: number): Promise<void> {
    // Future migrations go here
    console.log(`Migrating storage from v${fromVersion} to v${toVersion}`);
    this.cache!.version = toVersion;
    await this.save();
  }
}

export const storage = new StorageManager();
```

- [ ] **Step 8: Run test to verify it passes**

```bash
npm test tests/storage.test.ts
```

Expected: PASS

- [ ] **Step 9: Create test setup file**

```typescript
// tests/setup.ts
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

- [ ] **Step 10: Commit**

```bash
git add src/shared/storage.ts src/shared/utils.ts tests/storage.test.ts tests/utils.test.ts tests/setup.ts
git commit -m "feat: add storage layer and utility functions with tests"
```

## Chunk 2: Background Service Worker - API Client

### Task 4: API Client with Streaming

**Files:**
- Create: `src/background/api-client.ts`
- Create: `tests/api-client.test.ts`

- [ ] **Step 1: Write test for API client**

```typescript
// tests/api-client.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient } from '../src/background/api-client';

global.fetch = vi.fn();

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient({
      apiBaseUrl: 'https://api.openai.com/v1',
      apiKey: 'test-key',
      model: 'gpt-3.5-turbo',
    });
    vi.clearAllMocks();
  });

  it('should create streaming request', async () => {
    const mockResponse = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"test"}}]}\n\n'));
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        },
      }),
      { status: 200 }
    );

    (global.fetch as any).mockResolvedValue(mockResponse);

    const chunks: string[] = [];
    await client.streamCompletion(
      'test prompt',
      (chunk) => chunks.push(chunk)
    );

    expect(chunks).toContain('test');
  });

  it('should handle API errors', async () => {
    (global.fetch as any).mockResolvedValue(
      new Response('Unauthorized', { status: 401 })
    );

    await expect(
      client.streamCompletion('test', () => {})
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test tests/api-client.test.ts
```

Expected: FAIL - ApiClient not found

- [ ] **Step 3: Create api-client.ts**

```typescript
// src/background/api-client.ts
import { STREAM_TIMEOUT } from '../shared/constants';

export interface ApiConfig {
  apiBaseUrl: string;
  apiKey: string;
  model: string;
}

export type ErrorCode = 'NETWORK' | 'AUTH' | 'RATE_LIMIT' | 'MODEL' | 'TIMEOUT';

export class ApiError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private abortController: AbortController | null = null;

  constructor(private config: ApiConfig) {}

  async streamCompletion(
    prompt: string,
    onChunk: (content: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    this.abortController = new AbortController();
    
    const timeoutId = setTimeout(() => {
      this.abortController?.abort();
    }, STREAM_TIMEOUT);

    try {
      const response = await fetch(`${this.config.apiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: 'user', content: prompt }],
          stream: true,
        }),
        signal: signal || this.abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw this.handleHttpError(response.status);
      }

      if (!response.body) {
        throw new ApiError('No response body', 'NETWORK');
      }

      return await this.parseStream(response.body, onChunk);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      if ((error as Error).name === 'AbortError') {
        throw new ApiError('Request timeout', 'TIMEOUT');
      }
      
      throw new ApiError('Network error', 'NETWORK');
    }
  }

  cancel(): void {
    this.abortController?.abort();
  }

  private async parseStream(
    body: ReadableStream<Uint8Array>,
    onChunk: (content: string) => void
  ): Promise<string> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              return fullText;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              
              if (content) {
                fullText += content;
                onChunk(content);
              }
            } catch (e) {
              console.warn('Failed to parse SSE chunk:', data);
            }
          }
        }
      }

      return fullText;
    } finally {
      reader.releaseLock();
    }
  }

  private handleHttpError(status: number): ApiError {
    switch (status) {
      case 401:
      case 403:
        return new ApiError('Invalid API key', 'AUTH', status);
      case 429:
        return new ApiError('Rate limited', 'RATE_LIMIT', status);
      case 404:
        return new ApiError('Model not found', 'MODEL', status);
      default:
        return new ApiError(`HTTP ${status}`, 'NETWORK', status);
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test tests/api-client.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/background/api-client.ts tests/api-client.test.ts
git commit -m "feat: add API client with SSE streaming support"
```


### Task 5: Background Service Worker - Stream Handler & Cache

**Files:**
- Create: `src/background/stream-handler.ts`
- Create: `src/background/cache.ts`
- Create: `src/background/service-worker.ts`

- [ ] **Step 1: Create cache.ts**

```typescript
// src/background/cache.ts
import { CACHE_MAX_ENTRIES } from '../shared/constants';
import { hashString } from '../shared/utils';

interface CacheEntry {
  key: string;
  value: string;
  timestamp: number;
}

export class EphemeralCache {
  private cache: Map<string, CacheEntry> = new Map();
  private accessOrder: string[] = [];

  generateKey(
    type: 'word' | 'sentence',
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    model: string
  ): string {
    const textKey = type === 'word' ? text : hashString(text);
    return `${type}:${textKey}:${sourceLanguage}:${targetLanguage}:${model}`;
  }

  get(key: string): string | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Update access order (LRU)
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);

    return entry.value;
  }

  set(key: string, value: string): void {
    // Evict if at capacity
    if (this.cache.size >= CACHE_MAX_ENTRIES && !this.cache.has(key)) {
      const oldest = this.accessOrder.shift();
      if (oldest) {
        this.cache.delete(oldest);
      }
    }

    this.cache.set(key, {
      key,
      value,
      timestamp: Date.now(),
    });

    // Update access order
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);
  }

  evict(key: string): void {
    this.cache.delete(key);
    this.accessOrder = this.accessOrder.filter(k => k !== key);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }
}

export const ephemeralCache = new EphemeralCache();
```

- [ ] **Step 2: Create stream-handler.ts**

```typescript
// src/background/stream-handler.ts
import { ApiClient, ApiError } from './api-client';
import { ephemeralCache } from './cache';
import { storage } from '../shared/storage';
import type { RequestMessage, ResponseMessage } from '../shared/types';

export class StreamHandler {
  private activeRequests: Map<string, AbortController> = new Map();

  async handleLookupRequest(
    message: RequestMessage & { type: 'LOOKUP_REQUEST' },
    port: chrome.runtime.Port
  ): Promise<void> {
    const { requestId, word, context, url, title, isWord } = message;

    try {
      // Check Tier 1: Vocabulary
      if (isWord) {
        const settings = await storage.getSettings();
        const normalizedWord = word.toLowerCase().trim();
        const existing = await storage.getWordByNormalized(normalizedWord);

        if (existing) {
          // Update sources and return cached definition
          await storage.updateWordSources(normalizedWord, {
            url,
            title,
            context,
            seenAt: Date.now(),
          });

          const response: ResponseMessage = {
            type: 'STREAM_COMPLETE',
            requestId,
            fullText: this.formatWordResponse(existing),
          };

          port.postMessage(response);
          return;
        }

        // Check Tier 2: Ephemeral cache
        const cacheKey = ephemeralCache.generateKey(
          'word',
          normalizedWord,
          settings.sourceLanguage,
          settings.targetLanguage,
          settings.fastModel
        );

        const cached = ephemeralCache.get(cacheKey);
        if (cached) {
          const response: ResponseMessage = {
            type: 'STREAM_COMPLETE',
            requestId,
            fullText: cached,
          };

          port.postMessage(response);
          return;
        }
      }

      // No cache hit - call API
      await this.streamFromApi(message, port);
    } catch (error) {
      this.sendError(requestId, error, port);
    }
  }

  private async streamFromApi(
    message: RequestMessage & { type: 'LOOKUP_REQUEST' },
    port: chrome.runtime.Port
  ): Promise<void> {
    const { requestId, word, context, isWord } = message;
    const settings = await storage.getSettings();

    const prompt = isWord
      ? this.buildWordPrompt(word, context, settings.sourceLanguage, settings.targetLanguage)
      : this.buildSentencePrompt(word, settings.sourceLanguage, settings.targetLanguage);

    const client = new ApiClient({
      apiBaseUrl: settings.apiBaseUrl,
      apiKey: settings.apiKey,
      model: settings.fastModel,
    });

    const abortController = new AbortController();
    this.activeRequests.set(requestId, abortController);

    try {
      const fullText = await client.streamCompletion(
        prompt,
        (chunk) => {
          const response: ResponseMessage = {
            type: 'STREAM_CHUNK',
            requestId,
            content: chunk,
          };
          port.postMessage(response);
        },
        abortController.signal
      );

      // Cache the result
      const normalizedWord = word.toLowerCase().trim();
      const cacheKey = ephemeralCache.generateKey(
        isWord ? 'word' : 'sentence',
        normalizedWord,
        settings.sourceLanguage,
        settings.targetLanguage,
        settings.fastModel
      );
      ephemeralCache.set(cacheKey, fullText);

      const response: ResponseMessage = {
        type: 'STREAM_COMPLETE',
        requestId,
        fullText,
      };
      port.postMessage(response);
    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  handleCancel(requestId: string, port: chrome.runtime.Port): void {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);

      const response: ResponseMessage = {
        type: 'STREAM_CANCELLED',
        requestId,
      };
      port.postMessage(response);
    }
  }

  private sendError(requestId: string, error: unknown, port: chrome.runtime.Port): void {
    const apiError = error instanceof ApiError ? error : null;

    const response: ResponseMessage = {
      type: 'STREAM_ERROR',
      requestId,
      error: apiError?.message || 'Unknown error',
      code: apiError?.code || 'NETWORK',
    };

    port.postMessage(response);
  }

  private buildWordPrompt(
    word: string,
    context: string,
    sourceLanguage: string,
    targetLanguage: string
  ): string {
    return `You are a helpful vocabulary assistant.
Analyze the word "${word}" in ${sourceLanguage}.
Provide information in ${targetLanguage}.

Use EXACTLY this format with "---" as field separators:

[phonetic]
/pronunciation here/
---
[pos]
part of speech
---
[definition]
concise definition in ${targetLanguage}
---
[example1]
example sentence in ${sourceLanguage}
translation in ${targetLanguage}
---
[example2]
another example sentence in ${sourceLanguage}
translation in ${targetLanguage}
---
[etymology]
word origin and root analysis in ${targetLanguage}

IMPORTANT: Output ONLY the formatted content above. Do not add any greeting, explanation, preamble, or closing remarks before or after the content. Start directly with [phonetic].

Context: "${context}"`;
  }

  private buildSentencePrompt(
    sentence: string,
    sourceLanguage: string,
    targetLanguage: string
  ): string {
    return `Translate and explain this ${sourceLanguage} sentence.
Respond in ${targetLanguage}.

Use EXACTLY this format with "---" as field separators:

[translation]
translation in ${targetLanguage}
---
[explanation]
grammar and usage explanation in ${targetLanguage}

IMPORTANT: Output ONLY the formatted content above. Do not add any greeting, explanation, preamble, or closing remarks. Start directly with [translation].

Sentence: "${sentence}"`;
  }

  private formatWordResponse(word: any): string {
    return `[phonetic]
${word.phonetic}
---
[pos]
${word.partOfSpeech}
---
[definition]
${word.definition}
---
[example1]
${word.examples[0]?.sentence || ''}
${word.examples[0]?.translation || ''}
---
[example2]
${word.examples[1]?.sentence || ''}
${word.examples[1]?.translation || ''}
---
[etymology]
${word.etymology}`;
  }
}
```

- [ ] **Step 3: Create service-worker.ts**

```typescript
// src/background/service-worker.ts
import { StreamHandler } from './stream-handler';
import { storage } from '../shared/storage';
import { ephemeralCache } from './cache';
import type { RequestMessage, SaveMessage } from '../shared/types';

const streamHandler = new StreamHandler();

// Initialize storage on install
chrome.runtime.onInstalled.addListener(async () => {
  await storage.initialize();
  console.log('LexiNote installed');
});

// Handle long-lived port connections for streaming
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'lookup') {
    return;
  }

  port.onMessage.addListener(async (message: RequestMessage) => {
    if (message.type === 'LOOKUP_REQUEST') {
      await streamHandler.handleLookupRequest(message, port);
    } else if (message.type === 'CANCEL') {
      streamHandler.handleCancel(message.requestId, port);
    }
  });

  port.onDisconnect.addListener(() => {
    // Port closed, cleanup if needed
  });
});

// Handle one-shot messages for saving words
chrome.runtime.onMessage.addListener((message: SaveMessage, sender, sendResponse) => {
  if (message.type === 'SAVE_WORD') {
    storage.addWord(message.entry).then(() => {
      sendResponse({ type: 'SAVE_RESULT', success: true, isDuplicate: false });
    }).catch((error) => {
      console.error('Failed to save word:', error);
      sendResponse({ type: 'SAVE_RESULT', success: false, isDuplicate: false });
    });
    return true; // Keep channel open for async response
  }
});

// Clear ephemeral cache when settings change
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.settings) {
    const oldSettings = changes.settings.oldValue;
    const newSettings = changes.settings.newValue;

    if (
      oldSettings?.sourceLanguage !== newSettings?.sourceLanguage ||
      oldSettings?.targetLanguage !== newSettings?.targetLanguage ||
      oldSettings?.fastModel !== newSettings?.fastModel
    ) {
      ephemeralCache.clear();
      console.log('Ephemeral cache cleared due to settings change');
    }
  }
});
```

- [ ] **Step 4: Commit**

```bash
git add src/background/
git commit -m "feat: add background service worker with streaming and caching"
```

### Task 6: Selection Detection Tests

**Files:**
- Create: `tests/detection.test.ts`

- [ ] **Step 1: Write comprehensive selection detection tests**

```typescript
// tests/detection.test.ts
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
});
```

- [ ] **Step 2: Run test**

```bash
npm test tests/detection.test.ts
```

Expected: PASS (utils already implemented in Task 3)

- [ ] **Step 3: Commit**

```bash
git add tests/detection.test.ts
git commit -m "test: add comprehensive selection detection tests"
```

## Chunk 3: Content Script

### Task 7: Selection Detection & Floating Button

**Files:**
- Create: `src/content/hooks/useSelection.ts`
- Create: `src/content/components/FloatingButton.tsx`
- Create: `src/content/components/FloatingButton.module.css`
- Create: `tests/content/useSelection.test.ts`

**Steps:**
- [ ] Write test for useSelection hook - test that it detects text selection, determines word vs sentence mode, and provides selection position
- [ ] Run test to verify it fails
- [ ] Implement useSelection hook:
  - Listen for mouseup/dblclick events
  - Get selection text via window.getSelection()
  - Call detectSelectionType() from utils
  - Calculate position using getBoundingClientRect()
  - Return { text, type, position, isActive }
- [ ] Run test to verify it passes
- [ ] Create FloatingButton component:
  - Renders a circular 36px button with gradient border
  - Positioned using four-quadrant strategy (check viewport bounds in all directions)
  - Shows on selection, hides on click-outside/Esc/scroll>200px/new-selection
  - onClick triggers lookup
  - CSS: white bg, gradient border primary->secondary, soft shadow, hover scale(1.05)
- [ ] Create FloatingButton.module.css with animations (fadeIn, scale)
- [ ] Commit: "feat: add selection detection and floating button"

### Task 8: Definition Card Component

**Files:**
- Create: `src/content/components/DefinitionCard.tsx`
- Create: `src/content/components/DefinitionCard.module.css`
- Create: `src/content/components/SentenceCard.tsx`
- Create: `tests/content/DefinitionCard.test.tsx`

**Steps:**
- [ ] Write test for DefinitionCard - renders word, phonetic, definition, examples, etymology; shows streaming text during loading; shows "Added to vocabulary" with Undo button on complete
- [ ] Run test to verify it fails
- [ ] Implement DefinitionCard:
  - Props: { word, streamingText, isStreaming, isComplete, onUndo, onClose, onRelookup }
  - During streaming: show text progressively with blinking cursor ▊
  - On complete: parse field separators (---) and render structured card with emoji labels (✨ word, 🏷️ pos, 💭 definition, 📝 examples, 🌱 etymology)
  - Pending save toast with 5s Undo button
  - Max width 400px, border-radius 12px, soft shadow
  - Positioned near selection, four-quadrant aware
- [ ] Run test to verify it passes
- [ ] Implement SentenceCard:
  - Similar to DefinitionCard but for sentences
  - Shows 📖 Original, 🌏 Translation, 💡 Explanation
  - Has 📋 Copy button with clipboard fallback
  - No save/undo behavior
- [ ] Commit: "feat: add definition and sentence card components"

### Task 9: Content Script Entry Point

**Files:**
- Create: `src/content/content-script.tsx`
- Create: `src/content/App.tsx`

**Steps:**
- [ ] Create content-script.tsx entry point:
  - Create Shadow DOM container for style isolation
  - Render React app inside Shadow DOM
  - Inject styles into Shadow DOM
- [ ] Create App.tsx:
  - Uses useSelection hook
  - Manages state: currentLookup, streamingText, isStreaming, pendingSave
  - Opens port via chrome.runtime.connect("lookup") on lookup trigger
  - Sends LOOKUP_REQUEST with requestId (crypto.randomUUID())
  - Listens for STREAM_CHUNK, STREAM_COMPLETE, STREAM_ERROR, STREAM_CANCELLED
  - Ignores messages with non-matching requestId
  - Concurrent strategy: cancel previous request on new lookup
  - Pending save: 5s timer, Undo cancels timer and evicts cache
  - On timer expire: sendMessage(SAVE_WORD)
  - Card dismissal: click-outside, Esc, new selection, scroll>200px
- [ ] Commit: "feat: add content script entry point with Shadow DOM"

## Chunk 4: Popup (Vocabulary List)

### Task 10: Vocabulary List Component

**Files:**
- Create: `src/popup/popup.html`
- Create: `src/popup/popup.tsx`
- Create: `src/popup/App.tsx`
- Create: `src/popup/components/WordList.tsx`
- Create: `src/popup/components/WordItem.tsx`
- Create: `src/popup/components/SearchBar.tsx`
- Create: `src/popup/components/TabFilter.tsx`
- Create: `tests/popup/WordList.test.tsx`

**Steps:**
- [ ] Write test for WordList - renders list of words, supports search filtering, supports tab filtering (All/Starred), click to expand word details
- [ ] Run test to verify it fails
- [ ] Create popup.html with React mount point
- [ ] Create popup.tsx entry point
- [ ] Implement SearchBar: input with 🔍 icon, real-time filtering, placeholder "Search your words..."
- [ ] Implement TabFilter: [💫 All] [⭐ Starred] tabs
- [ ] Implement WordItem:
  - Collapsed: emoji + word + phonetic + short definition + star toggle + delete button
  - Expanded: full definition, examples, etymology, sources list (title + url)
  - Star toggle: ⭐/☆
  - Delete with confirmation: "Say goodbye to this word? 🥺"
  - Random emoji per word (🌟🌸🌈🎨🎭)
- [ ] Implement WordList:
  - Virtual scrolling for 1000+ words
  - Filter by search text (matches word, definition)
  - Filter by tab (all, starred)
  - Sort by lastSeenAt descending
  - Empty state: "No words yet. Try double-clicking a word while reading! ✨"
- [ ] Run test to verify it passes
- [ ] Commit: "feat: add popup vocabulary list with search and filtering"

### Task 11: Anki Export

**Files:**
- Create: `src/popup/components/ExportDialog.tsx`
- Create: `src/shared/anki-export.ts`
- Create: `tests/anki-export.test.ts`

**Steps:**
- [ ] Write test for Anki export:
  - Generates valid TSV with UTF-8 BOM
  - Escapes tabs, newlines, double quotes correctly
  - Generates correct tags (lexinote, pos:noun, status:new, lang:en-zh, starred)
  - Skips rows missing word or definition
  - Returns exported/skipped/failed counts
- [ ] Run test to verify it fails
- [ ] Implement anki-export.ts:
  - Function exportToAnki(words: WordEntry[], settings: Settings): ExportResult
  - TSV format: word\tphonetic\tpartOfSpeech\tdefinition\texamples\tetymology\tmnemonic\ttags
  - UTF-8 BOM prefix: \uFEFF
  - Escape rules: tab->space, newline-><br>, quote->""
  - Tag generation: deterministic from word metadata
  - Returns { tsv: string, exported: number, skipped: number, failed: number }
- [ ] Run test to verify it passes
- [ ] Implement ExportDialog:
  - Filter options: all/starred, date range
  - Preview table showing first 3 rows
  - Progress bar during Smart Model processing
  - Completion summary: ✅ Exported: N, ⚠️ Skipped: N, ❌ Failed: N
  - Download button triggers file save
- [ ] Commit: "feat: add Anki export with preview and summary"

## Chunk 5: Options Page

### Task 12: Settings Page

**Files:**
- Create: `src/options/options.html`
- Create: `src/options/options.tsx`
- Create: `src/options/App.tsx`
- Create: `src/options/components/SettingsForm.tsx`
- Create: `src/options/components/ApiConfig.tsx`
- Create: `src/options/components/ModelConfig.tsx`
- Create: `src/options/components/LanguageConfig.tsx`
- Create: `tests/options/SettingsForm.test.tsx`

**Steps:**
- [ ] Write test for SettingsForm - renders all config sections, validates API URL (HTTPS only, no localhost), saves settings, shows unsaved changes warning
- [ ] Run test to verify it fails
- [ ] Create options.html with React mount point
- [ ] Create options.tsx entry point
- [ ] Implement ApiConfig component:
  - API Base URL input with validation (HTTPS only, reject localhost/file/IP)
  - API Key input (password type with show/hide toggle)
  - Test Connection button with result feedback table:
    - 200: "Connection successful ✅"
    - 401/403: "Invalid API key 🔑"
    - 404: "Endpoint not found"
    - 429: "Rate limited ⏱️"
    - Network error: "Cannot reach server 🌐"
    - Model not found: "Model not available 🤖"
- [ ] Implement ModelConfig component:
  - Fast Model input (for daily lookups)
  - Smart Model input (for Anki export)
  - Helper text explaining each model's purpose
- [ ] Implement LanguageConfig component:
  - Source Language dropdown (V1: English only, disabled with note)
  - Target Language dropdown (zh, ja, ko, es, fr, de, en)
  - UI Language dropdown (Auto/English/简体中文/繁體中文)
- [ ] Implement SettingsForm:
  - Combines all config components
  - beforeunload handler for unsaved changes
  - Dynamic host permission request for custom API domains
  - Permission flow: validate URL -> check built-in list -> request permission if needed -> save
  - Save button with success/error feedback
- [ ] Run test to verify it passes
- [ ] Commit: "feat: add options page with API, model, and language settings"

## Chunk 6: Internationalization & Styling

### Task 13: i18n Setup

**Files:**
- Create: `_locales/en/messages.json`
- Create: `_locales/zh_CN/messages.json`
- Create: `_locales/zh_TW/messages.json`
- Create: `src/shared/i18n.ts`
- Create: `tests/i18n.test.ts`

**Steps:**
- [ ] Write test for i18n - resolves messages for each locale, falls back to English for missing keys
- [ ] Run test to verify it fails
- [ ] Create _locales/en/messages.json:
  - appName: "LexiNote"
  - myVocabulary: "My Vocabulary"
  - searchPlaceholder: "Search your words..."
  - addedSuccess: "Added to vocabulary 🎉"
  - undoAction: "Undo"
  - seenAgain: "Seen again! ($COUNT$ time) ✨"
  - cancelledSave: "Cancelled ✨"
  - emptyState: "No words yet. Try double-clicking a word while reading! ✨"
  - deleteConfirm: "Say goodbye to this word? 🥺"
  - exportComplete: "Export complete!"
  - exported: "Exported"
  - skipped: "Skipped"
  - failed: "Failed"
  - settings: "Settings"
  - save: "Save"
  - testConnection: "Test Connection"
  - connectionSuccess: "Connection successful ✅"
  - invalidApiKey: "Invalid API key 🔑"
  - copied: "Copied ✨"
  - copyFailed: "Copy failed, please select and copy manually"
  (and other UI strings)
- [ ] Create _locales/zh_CN/messages.json with Chinese translations
- [ ] Create _locales/zh_TW/messages.json with Traditional Chinese translations
- [ ] Create src/shared/i18n.ts:
  - Wrapper around chrome.i18n.getMessage()
  - Fallback for development environment (load JSON directly)
  - Type-safe message keys
- [ ] Run test to verify it passes
- [ ] Commit: "feat: add i18n support for en, zh_CN, zh_TW"

### Task 14: Global Styles & Theme

**Files:**
- Create: `src/shared/styles/variables.css`
- Create: `src/shared/styles/global.css`
- Create: `src/shared/styles/animations.css`

**Steps:**
- [ ] Create variables.css:
  - --color-primary: #6B7FFF
  - --color-secondary: #FFB4D6
  - --color-bg: #FFFFFF
  - --color-bg-secondary: #F8F9FA
  - --color-text: #2D3748
  - --color-success: #4ECDC4
  - --color-error: #FF6B6B
  - --font-size-base: 14px
  - --font-size-sm: 12px
  - --line-height: 1.6
  - --radius-sm: 8px
  - --radius-md: 12px
  - --shadow-sm: 0 2px 8px rgba(0,0,0,0.1)
  - --shadow-md: 0 8px 24px rgba(0,0,0,0.08)
  - --transition: 0.2s ease
- [ ] Create animations.css:
  - @keyframes fadeIn (opacity 0->1, translateY -4px->0)
  - @keyframes blink (cursor blinking for streaming)
  - @keyframes scaleIn (scale 0.95->1)
- [ ] Create global.css:
  - Base font family: Inter, SF Pro, system-ui, PingFang SC, Source Han Sans
  - Reset styles for extension UI
- [ ] Commit: "feat: add global styles, CSS variables, and animations"

## Chunk 7: Integration, Build & Polish

### Task 15: Build Configuration & Icons

**Files:**
- Modify: `vite.config.ts`
- Create: `public/icons/icon-16.png`
- Create: `public/icons/icon-48.png`
- Create: `public/icons/icon-128.png`
- Create: `scripts/build.sh`

**Steps:**
- [ ] Update vite.config.ts for proper Chrome extension build:
  - Ensure content script outputs as IIFE (not ES module)
  - Copy manifest.json and _locales to dist
  - Copy icons to dist
  - Handle CSS injection for content script (inline into JS)
- [ ] Create placeholder icons (can be replaced later with proper design):
  - Simple book/sparkle emoji-style icon at 16, 48, 128px
  - Use a build script or SVG-to-PNG conversion
- [ ] Create scripts/build.sh:
  - npm run build
  - Copy manifest.json to dist/
  - Copy _locales/ to dist/
  - Copy public/icons/ to dist/icons/
- [ ] Add npm scripts to package.json:
  - "dev": "vite build --watch"
  - "build": "vite build && node scripts/copy-assets.js"
  - "test": "vitest --run"
  - "test:watch": "vitest"
- [ ] Commit: "feat: add build configuration and extension icons"

### Task 16: Integration Testing

**Files:**
- Create: `tests/integration/background-content.test.ts`
- Create: `tests/integration/anki-export.test.ts`

**Steps:**
- [ ] Write integration test for background-content communication:
  - Mock chrome.runtime.connect
  - Verify LOOKUP_REQUEST -> STREAM_CHUNK -> STREAM_COMPLETE flow
  - Verify CANCEL cancels in-flight request
  - Verify requestId matching (ignore stale chunks)
- [ ] Write integration test for Anki export end-to-end:
  - Create sample WordEntry list
  - Export to TSV
  - Verify UTF-8 BOM
  - Verify field count per row
  - Verify tag format
  - Verify skip behavior for incomplete entries
  - Verify export summary counts
- [ ] Run all tests
- [ ] Commit: "test: add integration tests for background communication and Anki export"

### Task 17: Final Polish & README

**Files:**
- Create: `README.md`
- Create: `tests/setup.ts`

**Steps:**
- [ ] Create tests/setup.ts:
  - Mock chrome API globals
  - Setup testing-library matchers
- [ ] Create README.md:
  - Project description
  - Features list
  - Installation instructions (load unpacked extension)
  - Development setup (npm install, npm run dev)
  - Build instructions (npm run build)
  - Configuration guide (API setup)
  - Tech stack
- [ ] Run full test suite: npm test
- [ ] Build extension: npm run build
- [ ] Verify dist/ output contains all required files
- [ ] Commit: "docs: add README and finalize test setup"
- [ ] Final commit: "chore: LexiNote v1.0.0 ready for testing"
