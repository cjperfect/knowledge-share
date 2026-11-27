import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AiConfig } from '../../config/configuration';

import type { AiMessage, AiStreamOptions } from '../../interface/ai';

interface ChatCompletionResponse {
  choices?: Array<{
    delta?: { content?: string };
    message?: { content?: string };
  }>;
}

interface ParsedSseData {
  done?: boolean;
  content?: string;
}

function eventBoundary(value: string) {
  const match = value.match(/\r?\n\r?\n/);
  if (!match || match.index === undefined) return null;
  return { index: match.index, length: match[0].length };
}

function parseSseData(block: string): ParsedSseData | null {
  const data = block
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n')
    .trim();
  if (!data) return null;
  if (data === '[DONE]') return { done: true };
  try {
    const body = JSON.parse(data) as ChatCompletionResponse;
    const content = body.choices?.[0]?.delta?.content ?? body.choices?.[0]?.message?.content;
    return typeof content === 'string' ? { content } : null;
  } catch {
    return null;
  }
}

function responseContent(body: ChatCompletionResponse) {
  const content = body.choices?.[0]?.delta?.content ?? body.choices?.[0]?.message?.content;
  return typeof content === 'string' ? content : undefined;
}

/**
 * 全局 AI 流式调用入口。业务侧只负责拼提示词，鉴权、模型、超时、
 * SSE 解析和本地回退都在这里处理。
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly config: AiConfig;

  constructor(config: ConfigService) {
    this.config = config.getOrThrow<AiConfig>('ai');
    if (!this.enabled) {
      this.logger.warn('未配置 AI_API_KEY，AI 生成将使用本地回退。');
    }
  }

  private get enabled() {
    return Boolean(this.config.apiKey && this.config.model && this.config.baseUrl);
  }

  async *streamChat(prompt: string, options: AiStreamOptions = {}): AsyncGenerator<string> {
    if (!this.enabled) {
      if (options.fallback) {
        yield options.fallback();
        return;
      }
      throw new ServiceUnavailableException(
        'AI 服务未配置，请设置 AI_API_KEY（兼容 DEEPSEEK_API_KEY）。',
      );
    }

    const messages: AiMessage[] = [];
    if (options.system) messages.push({ role: 'system', content: options.system });
    messages.push({ role: 'user', content: prompt });

    const controller = new AbortController();
    const abort = () => controller.abort();
    options.signal?.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(
      () => controller.abort(),
      options.timeoutMs ?? this.config.timeoutMs,
    );
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;

    try {
      const response = await fetch(`${this.config.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: options.temperature ?? 0.6,
          max_tokens: options.maxTokens ?? 1200,
          stream: true,
          ...(this.config.disableThinking && this.config.model.startsWith('doubao-')
            ? { thinking: { type: 'disabled' } }
            : {}),
          ...(options.json ? { response_format: { type: 'json_object' } } : {}),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const raw = await response.text().catch(() => '');
        let code = '';
        let message = '';
        try {
          const body = JSON.parse(raw) as {
            error?: { code?: string; message?: string };
          };
          code = body.error?.code ?? '';
          message = body.error?.message ?? '';
        } catch {
          // 非 JSON 错误体按 HTTP 状态处理。
        }
        this.logger.warn(
          `AI 流式接口调用失败：HTTP ${response.status}${code ? ` ${code}` : ''}${
            message ? ` - ${message}` : ''
          }`,
        );
        if (code === 'ModelNotOpen') {
          throw new ServiceUnavailableException(
            `方舟账号未开通模型 ${this.config.model}，请先在火山方舟控制台开通后重试。`,
          );
        }
        throw new BadGatewayException(
          `AI 服务调用失败${message ? `：${message}` : '，请稍后重试。'}`,
        );
      }

      reader = response.body?.getReader();
      if (!reader) throw new BadGatewayException('AI 未返回可读取的流。');

      const decoder = new TextDecoder();
      let pending = '';
      let emitted = false;
      let finished = false;

      while (!finished) {
        const { done, value } = await reader.read();
        if (done) break;
        pending += decoder.decode(value, { stream: true });

        let boundary = eventBoundary(pending);
        while (boundary) {
          const block = pending.slice(0, boundary.index);
          pending = pending.slice(boundary.index + boundary.length);
          const parsed = parseSseData(block);
          if (parsed?.done) {
            finished = true;
            break;
          }
          if (parsed?.content) {
            emitted = true;
            yield parsed.content;
          }
          boundary = eventBoundary(pending);
        }
      }

      pending += decoder.decode();
      if (!finished) {
        const parsed = parseSseData(pending);
        if (parsed?.content) {
          emitted = true;
          yield parsed.content;
        } else if (!emitted) {
          try {
            const body = JSON.parse(pending.trim()) as ChatCompletionResponse;
            const content = responseContent(body);
            if (content) {
              emitted = true;
              yield content;
            }
          } catch {
            // The provider may end with SSE comments or an empty tail.
          }
        }
      }

      if (!emitted) throw new BadGatewayException('AI 未返回内容，请稍后重试。');
    } catch (error) {
      if (error instanceof BadGatewayException || error instanceof ServiceUnavailableException) {
        throw error;
      }
      if (controller.signal.aborted) {
        if (options.signal?.aborted) return;
        throw new BadGatewayException('AI 服务响应超时，请稍后重试。');
      }
      this.logger.warn(`AI 流式请求异常：${error instanceof Error ? error.message : '未知错误'}`);
      throw new BadGatewayException('无法连接 AI 服务，请稍后重试。');
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener('abort', abort);
      if (reader) await reader.cancel().catch(() => undefined);
    }
  }
}
