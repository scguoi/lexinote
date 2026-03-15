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
export const PENDING_SAVE_TIMEOUT = 5000;
export const STREAM_TIMEOUT = 30000;
export const DEBOUNCE_DELAY = 200;
export const THROTTLE_INTERVAL = 50;
export const CACHE_MAX_ENTRIES = 100;

export const WORD_DETECTION_PATTERN = /^[a-zA-Z'-]+$/;
