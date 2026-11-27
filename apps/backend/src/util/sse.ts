import type { Response } from 'express';

/** 开启一条 SSE 响应。POST + fetch 即可消费，不需要额外建立 WebSocket。 */
export function openSse(res: Response) {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
}

export function sendSse(res: Response, payload: unknown) {
  if (res.writableEnded || res.destroyed) return;
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export function closeSse(res: Response) {
  if (res.writableEnded || res.destroyed) return;
  res.write('data: [DONE]\n\n');
  res.end();
}
