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
