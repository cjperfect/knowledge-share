export type AiRole = 'system' | 'user' | 'assistant';

export interface AiMessage {
  role: AiRole;
  content: string;
}

export interface AiStreamOptions {
  system?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  fallback?: () => string;
  signal?: AbortSignal;
  json?: boolean;
}
