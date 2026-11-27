import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/util/require-admin'
import { Activities } from '@/features/activities/activities'

export const Route = createFileRoute('/activities')({
  beforeLoad: ({ location }) => requireAdmin(location.href),
  component: Activities,
})
