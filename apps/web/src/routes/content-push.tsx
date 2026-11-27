import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/util/require-admin'
import { ContentPush } from '@/features/content-push/content-push'

export const Route = createFileRoute('/content-push')({
  beforeLoad: ({ location }) => requireAdmin(location.href),
  component: ContentPush,
})
