import type {
  Activity,
  ActivityInput,
  ActivityUpdateInput,
} from '@/interface/activity'
import { request, requestStream } from '@/util/request'
import type { PartialBlock } from '@blocknote/core'

interface ActivityListParams {
  page: number
  pageSize: number
  keyword?: string
  sharer?: string
  date?: string
}

interface ActivityPage {
  items: Activity[]
  page: number
  pageSize: number
  total: number
}

export const activitiesApi = {
  list: (params: ActivityListParams, signal?: AbortSignal) =>
    request<ActivityPage>({ url: '/activities', params, signal }),
  detail: (id: string, signal?: AbortSignal) =>
    request<Activity>({ url: `/activities/${encodeURIComponent(id)}`, signal }),
  create: (data: ActivityInput) =>
    request<Activity>({ url: '/activities', method: 'POST', data }),
  update: (id: string, data: ActivityUpdateInput) =>
    request<Activity>({
      url: `/activities/${encodeURIComponent(id)}`,
      method: 'PATCH',
      data,
    }),
  generateSummaryStream: (
    data: {
      title: string
      summary: string
    },
    onDelta: (delta: string, full: string) => void,
    signal?: AbortSignal
  ) =>
    requestStream({
      url: '/activities/generate-summary/stream',
      data,
      onDelta,
      signal,
    }),
  updateContent: (
    id: string,
    content: PartialBlock[],
    contentMarkdown: string
  ) =>
    request<Activity>({
      url: `/activities/${encodeURIComponent(id)}`,
      method: 'PATCH',
      data: { content, contentMarkdown } satisfies ActivityUpdateInput,
    }),
  generateReviewStream: async (
    data: { title: string; sharer: string; date: string; source: string },
    onDelta: (delta: string, full: string) => void,
    signal?: AbortSignal
  ) => {
    return requestStream({
      url: '/activities/generate-review/stream',
      data,
      onDelta,
      signal,
    })
  },
  remove: (id: string) =>
    request<null>({
      url: `/activities/${encodeURIComponent(id)}`,
      method: 'DELETE',
    }),
}
