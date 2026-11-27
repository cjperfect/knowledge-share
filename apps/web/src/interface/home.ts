export interface HomeOverview {
  metrics: {
    activities: number
    registrations: number
    pushCount: number
    sharedRegistrations: number
  }
  activityTrend: {
    date: string
    registrations: number
    sharedRegistrations: number
  }[]
}

export type DateRange = { start: string; end: string }

export type ActivityTrendRow = { date: string; signups: number }
