import axios, { type AxiosRequestConfig } from 'axios'
import type { ApiErrorBody, ApiResponse } from '@/interface/api'
import { useAuthStore } from '@/stores/auth-store'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const API_BASE = '/api'

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15_000,
  allowAbsoluteUrls: false,
})

function errorMessage(body?: ApiErrorBody) {
  const message = body?.msg ?? body?.message
  return (
    (Array.isArray(message) ? message[0] : message) || '请求失败，请稍后重试。'
  )
}

interface ApiRequestConfig extends AxiosRequestConfig {
  /** Omit for authenticated admin calls, or pass null for a public call. */
  authToken?: string | null
}

interface StreamRequestConfig {
  url: string
  data?: unknown
  signal?: AbortSignal
  onDelta?: (delta: string, full: string) => void
}

interface StreamEvent {
  delta?: string
  error?: string
}

/**
 * POST + SSE 的流式请求封装。复用登录 Token，按空行切分事件，
 * 业务侧只关心累计文本和每个 delta。
 */
export async function requestStream({
  url,
  data,
  signal,
  onDelta,
}: StreamRequestConfig): Promise<string> {
  const user = useAuthStore.getState().auth.user
  const token = user && user.expiresAt > Date.now() ? user.token : undefined

  let response: Response
  try {
    response = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'text/event-stream',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data ?? {}),
      signal,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error
    throw new ApiError('无法连接服务，请稍后重试。')
  }

  if (!response.ok) {
    let body: ApiErrorBody | undefined
    try {
      body = (await response.json()) as ApiErrorBody
    } catch {
      // Keep the generic message when the response is not JSON.
    }
    throw new ApiError(errorMessage(body), response.status)
  }
  if (!response.body) throw new ApiError('服务未返回可读取的数据流。')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let pending = ''
  let full = ''
  let finished = false

  function consume(block: string) {
    const payload = block
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n')
      .trim()
    if (!payload) return false
    if (payload === '[DONE]') return true

    let event: StreamEvent
    try {
      event = JSON.parse(payload) as StreamEvent
    } catch {
      return false
    }
    if (event.error) throw new ApiError(event.error)
    if (event.delta) {
      full += event.delta
      onDelta?.(event.delta, full)
    }
    return false
  }

  try {
    while (!finished) {
      const { done, value } = await reader.read()
      if (done) break
      pending += decoder.decode(value, { stream: true })

      while (true) {
        const match = pending.match(/\r?\n\r?\n/)
        if (!match || match.index === undefined) break
        const block = pending.slice(0, match.index)
        pending = pending.slice(match.index + match[0].length)
        if (consume(block)) {
          finished = true
          break
        }
      }
    }

    pending += decoder.decode()
    if (!finished && pending.trim() && consume(pending)) finished = true
  } finally {
    await reader.cancel().catch(() => undefined)
  }

  return full
}

export async function request<T>({
  authToken,
  ...config
}: ApiRequestConfig): Promise<T> {
  const user = useAuthStore.getState().auth.user
  const token =
    authToken === undefined && user && user.expiresAt > Date.now()
      ? user.token
      : authToken
  try {
    const { data, status } = await client.request<ApiResponse<T>>({
      ...config,
      headers: {
        ...config.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
    if (data?.code !== 200) {
      throw new ApiError(errorMessage(data), status)
    }
    return data.data
  } catch (error) {
    if (!axios.isAxiosError<ApiErrorBody>(error) || axios.isCancel(error))
      throw error

    if (!error.response) {
      throw new ApiError('无法连接服务，请稍后重试。')
    }
    throw new ApiError(errorMessage(error.response.data), error.response.status)
  }
}
