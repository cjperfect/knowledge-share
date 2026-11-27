import type { PushInput, PushRecord, PushStatus } from '@/interface/push'
import { request, requestStream } from '@/util/request'

interface PushListFilters {
  page: number
  pageSize: number
  keyword?: string
  status?: PushStatus
  startDate?: string
  endDate?: string
}

export const pushesApi = {
  list: (filters: PushListFilters, signal?: AbortSignal) =>
    request<{
      items: PushRecord[]
      total: number
      page: number
      pageSize: number
    }>({
      url: '/pushes',
      params: filters,
      signal,
    }),
  create: (data: PushInput) =>
    request<PushRecord>({ url: '/pushes', method: 'POST', data }),
  update: (id: string, data: PushInput) =>
    request<PushRecord>({
      url: `/pushes/${encodeURIComponent(id)}`,
      method: 'PATCH',
      data,
    }),
  remove: (id: string) =>
    request<null>({
      url: `/pushes/${encodeURIComponent(id)}`,
      method: 'DELETE',
    }),
  retry: (id: string) =>
    request<PushRecord>({
      url: `/pushes/${encodeURIComponent(id)}/retry`,
      method: 'POST',
      data: {},
    }),
  optimizeSummaryStream: (
    data: {
      title?: string
      tags: string[]
      summary: string
      prompt?: string
    },
    onDelta: (delta: string, full: string) => void,
    signal?: AbortSignal
  ) =>
    requestStream({
      url: '/pushes/optimize-summary/stream',
      data,
      onDelta,
      signal,
    }),
  optimizeBodyStream: async (
    data: {
      title?: string
      summary?: string
      tags: string[]
      content: string
    },
    onDelta: (delta: string, full: string) => void,
    signal?: AbortSignal
  ) => {
    return requestStream({
      url: '/pushes/optimize-body/stream',
      data,
      onDelta,
      signal,
    })
  },
}
