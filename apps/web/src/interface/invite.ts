export type InviteNode = {
  id: string
  name: string
  activityId: string
  activityName: string
  inviterId: string | null
  inviterName: string | null
  registeredAt: string
  children: InviteNode[]
}

export type InviteGroup = {
  activityId: string
  activityName: string
  activityDate: string
  nodes: InviteNode[]
}

export type CommissionInvitee = {
  signupId: string
  name: string
  activityName: string
  invitedAt: string
  baseAmount: number
  commission: number
}

export type CommissionInviter = {
  key: string
  name: string
  phone: string
  inviteCount: number
  baseAmount: number
  commission: number
  paid: boolean
  paidAt: string | null
  ratePercent: number
  invitees: CommissionInvitee[]
}

export type CommissionSummary = {
  ratePercent: number
  inviterCount: number
  inviteeCount: number
  totalBaseAmount: number
  totalCommission: number
  items: CommissionInviter[]
}

export type CommissionRate = {
  ratePercent: number
}
