import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/util/require-admin'
import { Commissions } from '@/features/commissions/commissions'

export const Route = createFileRoute('/commissions')({
  beforeLoad: ({ location }) => requireAdmin(location.href),
  component: Commissions,
})
