import type {
  Activity,
  ActivityInvite,
  ActivityPosterQr,
} from '@/interface/activity'
import { request } from '@/util/request'

export const activityInvitesApi = {
  resolve: (token: string, signal?: AbortSignal) =>
    request<ActivityInvite>({
      url: '/public/activities/invite',
      authToken: null,
      params: { token },
      signal,
    }),
  qr: (
    {
      id,
      name,
      date,
      sharer,
      summary,
      price,
      inviter,
      receipt,
    }: Activity & { inviter?: string; receipt?: string },
    signal?: AbortSignal
  ) =>
    request<ActivityPosterQr>({
      url: '/public/activities/poster-qr',
      method: 'POST',
      data: { id, name, date, sharer, summary, price, inviter, receipt },
      authToken: null,
      signal,
    }),
  organizerQr: (activityId: string) =>
    request<ActivityPosterQr>({
      url: `/activities/${encodeURIComponent(activityId)}/poster-qr`,
      method: 'POST',
      data: {},
    }),
  signup: (token: string, data: { name: string; phone: string }) =>
    request<{ name: string; receipt: string }>({
      url: `/public/activities/${encodeURIComponent(token)}/signups`,
      method: 'POST',
      authToken: null,
      data,
    }),
}
