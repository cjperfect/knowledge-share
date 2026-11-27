import type {
  CommissionRate,
  CommissionSummary,
  InviteGroup,
} from '@/interface/invite'
import { request } from '@/util/request'

export const inviteGroupsKey = ['invite-groups'] as const
export const commissionSummaryKey = ['commission-summary'] as const

export const invitesApi = {
  list: (signal?: AbortSignal) =>
    request<InviteGroup[]>({ url: '/invites', signal }),
  commissionSummary: (signal?: AbortSignal) =>
    request<CommissionSummary>({
      url: '/invites/commission-summary',
      signal,
    }),
  updateCommissionPayout: (phone: string, paid: boolean) =>
    request<{ phone: string; paid: boolean; paidAt: string | null }>({
      url: '/invites/commission-payouts',
      method: 'PATCH',
      data: { phone, paid },
    }),
  updateCommissionAmount: (signupId: string, baseAmount: number) =>
    request<{
      signupId: string
      baseAmount: number
      ratePercent: number
      commission: number
    }>({
      url: `/invites/commission-amounts/${signupId}`,
      method: 'PATCH',
      data: { baseAmount },
    }),
  updateCommissionRate: (ratePercent: number) =>
    request<CommissionRate>({
      url: '/invites/commission-rate',
      method: 'PATCH',
      data: { ratePercent },
    }),
}
