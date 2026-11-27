import type { Metadata } from 'next'
import { ActivityJoin } from '@/features/join/activity-join'
import './join.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '活动报名',
  robots: { index: false, follow: false },
}

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const token = typeof params.activity === 'string' ? params.activity : ''
  return <ActivityJoin token={token} />
}
