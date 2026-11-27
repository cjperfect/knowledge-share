import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';

function service(config: Partial<Record<'baseUrl' | 'apiKey' | 'model' | 'timeoutMs', unknown>>) {
  const ai = {
    baseUrl: '',
    apiKey: '',
    model: '',
    timeoutMs: 1000,
    ...config,
  };
  return new AiService({
    getOrThrow: () => ai,
  } as unknown as ConfigService);
}

afterEach(() => vi.unstubAllGlobals());

describe('AiService', () => {
  it('未配置模型时流式输出走业务回退', async () => {
    const chunks: string[] = [];
    for await (const chunk of service({}).streamChat('提示词', {
      fallback: () => '本地回退内容',
    })) {
      chunks.push(chunk);
    }
    expect(chunks).toEqual(['本地回退内容']);
  });

  it('解析上游 SSE 并逐段产出文本', async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'data: {"choices":[{"delta":{"content":"你"}}]}\n\ndata: {"choices":[{"delta":{"content":"好"}}]}\n\ndata: [DONE]\n\n',
          ),
        );
        controller.close();
      },
    });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, body } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);

    const ai = service({
      baseUrl: 'https://ai.example.com/v1',
      apiKey: 'test-key',
      model: 'test-model',
    });
    const chunks: string[] = [];
    for await (const chunk of ai.streamChat('生成内容')) chunks.push(chunk);

    expect(chunks).toEqual(['你', '好']);
    expect(fetchMock.mock.calls[0][1].body).toContain('"stream":true');
  });
});
