import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/share-statistics')({
  beforeLoad: () => {
    throw redirect({ to: '/activities', replace: true })
  },
})
