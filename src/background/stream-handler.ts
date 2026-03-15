import { ApiClient } from './api-client';
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
      const settings = await storage.getSettings();
      const normalizedWord = word.toLowerCase().trim();

      // Check Tier 1: Vocabulary
      if (isWord) {
        const existing = await storage.getWordByNormalized(normalizedWord);
        if (existing) {
          await storage.updateWordSources(normalizedWord, {
            url,
            title,
            context,
            seenAt: Date.now(),
          });
          port.postMessage({
            type: 'STREAM_COMPLETE',
            requestId,
            fullText: this.formatWordResponse(existing),
            isDuplicate: true,
            lookupCount: existing.lookupCount,
          } as ResponseMessage);
          return;
        }
      }

      // Check Tier 2: Ephemeral cache
      const cacheKey = ephemeralCache.generateKey(
        isWord ? 'word' : 'sentence',
        isWord ? normalizedWord : word,
        settings.sourceLanguage,
        settings.targetLanguage,
        settings.fast.model
      );

      const cached = ephemeralCache.get(cacheKey);
      if (cached) {
        port.postMessage({
          type: 'STREAM_COMPLETE',
          requestId,
          fullText: cached,
        } as ResponseMessage);
        return;
      }

      // No cache hit - call API with streaming
      await this.streamFromApi(message, port, settings, cacheKey);
    } catch (error) {
      this.sendError(requestId, error, port);
    }
  }

  private async streamFromApi(
    message: RequestMessage & { type: 'LOOKUP_REQUEST' },
    port: chrome.runtime.Port,
    settings: any,
    cacheKey: string
  ): Promise<void> {
    const { requestId, word, context, isWord } = message;

    const prompt = isWord
      ? this.buildWordPrompt(word, context, settings.sourceLanguage, settings.targetLanguage)
      : this.buildSentencePrompt(word, settings.sourceLanguage, settings.targetLanguage);

    const client = new ApiClient({
      apiBaseUrl: settings.fast.apiBaseUrl,
      apiKey: settings.fast.apiKey,
      model: settings.fast.model,
    });

    const abortController = new AbortController();
    this.activeRequests.set(requestId, abortController);

    try {
      const fullText = await client.streamCompletion(
        prompt,
        (chunk) => {
          port.postMessage({
            type: 'STREAM_CHUNK',
            requestId,
            content: chunk,
          } as ResponseMessage);
        },
        abortController.signal
      );

      ephemeralCache.set(cacheKey, fullText);

      port.postMessage({
        type: 'STREAM_COMPLETE',
        requestId,
        fullText,
      } as ResponseMessage);
    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  handleCancel(requestId: string, port: chrome.runtime.Port): void {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);
      port.postMessage({
        type: 'STREAM_CANCELLED',
        requestId,
      } as ResponseMessage);
    }
  }

  private sendError(requestId: string, error: unknown, port: chrome.runtime.Port): void {
    const apiError = error as any;
    port.postMessage({
      type: 'STREAM_ERROR',
      requestId,
      error: apiError.message || 'Unknown error',
      code: apiError.code || 'NETWORK',
    } as ResponseMessage);
  }

  private formatWordResponse(word: any): string {
    return [
      `[phonetic]`,
      word.phonetic,
      `---`,
      `[pos]`,
      word.partOfSpeech,
      `---`,
      `[definition]`,
      word.definition,
      `---`,
      ...word.examples.flatMap((ex: any) => [
        `[example]`,
        ex.sentence,
        ex.translation,
        `---`,
      ]),
      `[etymology]`,
      word.etymology,
    ].join('\n');
  }

  private buildWordPrompt(word: string, context: string, sourceLang: string, targetLang: string): string {
    return `You are a helpful vocabulary assistant.
Analyze the word "${word}" in ${sourceLang}.
Provide information in ${targetLang}.

Use EXACTLY this format with "---" as field separators:

[phonetic]
/pronunciation here/
---
[pos]
part of speech
---
[definition]
concise definition in ${targetLang}
---
[example1]
example sentence in ${sourceLang}
translation in ${targetLang}
---
[example2]
another example sentence in ${sourceLang}
translation in ${targetLang}
---
[etymology]
word origin and root analysis in ${targetLang}

IMPORTANT: Output ONLY the formatted content above. Do not add any greeting, explanation, preamble, or closing remarks. Start directly with [phonetic].

Context: "${context}"`;
  }

  private buildSentencePrompt(sentence: string, sourceLang: string, targetLang: string): string {
    return `Translate and explain this ${sourceLang} sentence.
Respond in ${targetLang}.

Use EXACTLY this format with "---" as field separators:

[translation]
translation in ${targetLang}
---
[explanation]
grammar and usage explanation in ${targetLang}

IMPORTANT: Output ONLY the formatted content above. Do not add any greeting, explanation, preamble, or closing remarks. Start directly with [translation].

Sentence: "${sentence}"`;
  }
}

export const streamHandler = new StreamHandler();
