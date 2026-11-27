import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/util/require-admin'
import { Users } from '@/features/users/users'

export const Route = createFileRoute('/users')({
  beforeLoad: ({ location }) => requireAdmin(location.href, true),
  component: Users,
})
