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
