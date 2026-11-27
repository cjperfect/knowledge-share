import { redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'

export function requireAdmin(returnTo: string, superAdmin = false) {
  const { user, reset } = useAuthStore.getState().auth
  if (!user || user.expiresAt <= Date.now()) {
    reset()
    throw redirect({
      to: '/sign-in',
      search: { redirect: returnTo },
      replace: true,
    })
  }

  if (superAdmin && user.role !== 'super_admin') throw redirect({ to: '/403' })
}
