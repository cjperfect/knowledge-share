import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/util/require-admin'
import { PosterTemplates } from '@/features/poster-templates/poster-templates'

export const Route = createFileRoute('/poster-templates')({
  beforeLoad: ({ location }) => requireAdmin(location.href),
  component: PosterTemplates,
})
