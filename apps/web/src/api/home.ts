import type { HomeOverview } from '@/interface/home'
import { request } from '@/util/request'

export const homeApi = {
  overview: (
    params: { startDate: string; endDate: string; activityId?: string },
    signal?: AbortSignal
  ) => request<HomeOverview>({ url: '/home/overview', params, signal }),
}
