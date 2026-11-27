import { createFileRoute } from '@tanstack/react-router'
import { ActivityJoin } from '@/features/activities/activity-join'

export const Route = createFileRoute('/join')({
  validateSearch: (search: Record<string, unknown>) => ({
    activity: typeof search.activity === 'string' ? search.activity : '',
  }),
  component: function JoinPage() {
    const { activity } = Route.useSearch()
    return <ActivityJoin token={activity} />
  },
})
