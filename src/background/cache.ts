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
    if (!entry) return null;
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);
    return entry.value;
  }

  set(key: string, value: string): void {
    if (this.cache.size >= CACHE_MAX_ENTRIES && !this.cache.has(key)) {
      const oldest = this.accessOrder.shift();
      if (oldest) this.cache.delete(oldest);
    }
    this.cache.set(key, { key, value, timestamp: Date.now() });
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
