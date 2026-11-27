import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/util/require-admin'
import { Home } from '@/features/home/home'

export const Route = createFileRoute('/')({
  beforeLoad: ({ location }) => requireAdmin(location.href),
  component: Home,
})
