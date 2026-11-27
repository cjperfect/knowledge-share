import type { AdminStatus, AdminUser } from '@/interface/auth'
import { request } from '@/util/request'

export const usersApi = {
  list: () => request<AdminUser[]>({ url: '/admin/users' }),
  invite: () =>
    request<{ token: string; expiresAt: string }>({
      url: '/admin/invitations',
      method: 'POST',
      data: {},
    }),
  updateStatus: (id: string, status: AdminStatus) =>
    request<null>({
      url: `/admin/users/${encodeURIComponent(id)}/status`,
      method: 'PATCH',
      data: { status },
    }),
}
