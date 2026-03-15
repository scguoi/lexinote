import type { WordEntry, Settings, StorageSchema } from './types';
import { DEFAULT_SETTINGS, STORAGE_VERSION, MAX_SOURCES_PER_WORD } from './constants';

export class StorageManager {
  private cache: StorageSchema | null = null;

  async initialize(): Promise<void> {
    const data = await chrome.storage.local.get(null);

    if (!data.version) {
      this.cache = {
        version: STORAGE_VERSION,
        words: [],
        settings: { ...DEFAULT_SETTINGS } as Settings,
      };
      await this.save();
    } else {
      this.cache = data as StorageSchema;

      if (this.cache.version < STORAGE_VERSION) {
        await this.migrate(this.cache.version, STORAGE_VERSION);
      }
    }
  }

  async getWords(): Promise<WordEntry[]> {
    await this.ensureInitialized();
    await this.reload();
    return this.cache!.words;
  }

  async getWordByNormalized(normalizedWord: string): Promise<WordEntry | undefined> {
    await this.ensureInitialized();
    return this.cache!.words.find(w => w.normalizedWord === normalizedWord);
  }

  async addWord(word: WordEntry): Promise<void> {
    await this.ensureInitialized();
    // Reload from storage to avoid stale cache
    await this.reload();

    // Check for duplicate by normalizedWord
    const existing = this.cache!.words.find(w => w.normalizedWord === word.normalizedWord);
    if (existing) {
      // Update existing word's sources instead of adding duplicate
      if (word.sources && word.sources.length > 0) {
        existing.sources.push(...word.sources);
        if (existing.sources.length > MAX_SOURCES_PER_WORD) {
          existing.sources = existing.sources.slice(-MAX_SOURCES_PER_WORD);
        }
      }
      existing.lastSeenAt = Date.now();
      existing.lookupCount++;
    } else {
      this.cache!.words.push(word);
    }
    await this.save();
  }

  async updateWordSources(
    normalizedWord: string,
    source: { url: string; title: string; context: string; seenAt: number }
  ): Promise<WordEntry | undefined> {
    await this.ensureInitialized();
    const word = this.cache!.words.find(w => w.normalizedWord === normalizedWord);

    if (word) {
      word.sources.push(source);
      if (word.sources.length > MAX_SOURCES_PER_WORD) {
        word.sources = word.sources.slice(-MAX_SOURCES_PER_WORD);
      }
      word.lastSeenAt = source.seenAt;
      word.lookupCount++;
      await this.save();
    }

    return word;
  }

  async deleteWord(id: string): Promise<void> {
    await this.ensureInitialized();
    await this.reload();
    this.cache!.words = this.cache!.words.filter(w => w.id !== id);
    await this.save();
  }

  async toggleStarred(id: string): Promise<void> {
    await this.ensureInitialized();
    await this.reload();
    const word = this.cache!.words.find(w => w.id === id);
    if (word) {
      word.starred = !word.starred;
      await this.save();
    }
  }

  async getSettings(): Promise<Settings> {
    await this.ensureInitialized();
    return this.cache!.settings;
  }

  async updateSettings(settings: Partial<Settings>): Promise<void> {
    await this.ensureInitialized();
    this.cache!.settings = { ...this.cache!.settings, ...settings };
    await this.save();
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.cache) {
      await this.initialize();
    }
  }

  private async reload(): Promise<void> {
    const data = await chrome.storage.local.get(null);
    if (data.version) {
      this.cache = data as StorageSchema;
    }
  }

  private async save(): Promise<void> {
    if (this.cache) {
      await chrome.storage.local.set(this.cache);
    }
  }

  private async migrate(fromVersion: number, toVersion: number): Promise<void> {
    console.log(`Migrating storage from v${fromVersion} to v${toVersion}`);
    this.cache!.version = toVersion;
    await this.save();
  }
}

export const storage = new StorageManager();
