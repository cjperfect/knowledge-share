import type { ActivityInvite, ActivityPosterQr, PosterTemplate } from './types'

const API_BASE = '/api'

interface ApiResponse<T> {
  code: number
  msg?: string
  data: T
}

interface ApiErrorBody {
  code?: number
  msg?: string | string[]
  message?: string | string[]
}

export class JoinApiError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message)
    this.name = 'JoinApiError'
  }
}

function errorMessage(body?: ApiErrorBody) {
  const message = body?.msg ?? body?.message
  return (
    (Array.isArray(message) ? message[0] : message) || '请求失败，请稍后重试。'
  )
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        accept: 'application/json',
        ...(init?.body ? { 'content-type': 'application/json' } : {}),
        ...init?.headers,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error
    throw new JoinApiError('无法连接服务，请稍后重试。')
  }

  let body: ApiResponse<T> | ApiErrorBody | undefined
  try {
    body = (await response.json()) as ApiResponse<T> | ApiErrorBody
  } catch {
    // Keep the generic message when the response is not JSON.
  }

  if (!response.ok) {
    throw new JoinApiError(errorMessage(body), response.status)
  }
  if (!body || !('code' in body) || body.code !== 200) {
    throw new JoinApiError(errorMessage(body), response.status)
  }
  return (body as ApiResponse<T>).data
}

export const joinApi = {
  resolve: (token: string, signal?: AbortSignal) =>
    request<ActivityInvite>(
      `/public/activities/invite?token=${encodeURIComponent(token)}`,
      { signal }
    ),

  signup: (token: string, data: { name: string; phone: string }) =>
    request<{ name: string; receipt: string }>(
      `/public/activities/${encodeURIComponent(token)}/signups`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  personalQr: (
    data: {
      id: string
      name: string
      date: string
      sharer: string
      summary: string
      price: number
      inviter?: string
      receipt?: string
    },
    signal?: AbortSignal
  ) =>
    request<ActivityPosterQr>('/public/activities/poster-qr', {
      method: 'POST',
      body: JSON.stringify(data),
      signal,
    }),

  activeTemplate: (signal?: AbortSignal) =>
    request<PosterTemplate | null>('/poster-templates/active', { signal }),
}
