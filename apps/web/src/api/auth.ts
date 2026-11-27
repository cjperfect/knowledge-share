import type { AuthSession, AuthUser } from '@/interface/auth'
import { request } from '@/util/request'

export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    request<AuthSession>({
      url: '/auth/login',
      method: 'POST',
      authToken: null,
      data: credentials,
    }),
  logout: () =>
    request<null>({ url: '/auth/logout', method: 'POST', data: {} }),
  register: (credentials: {
    token: string
    username: string
    password: string
  }) =>
    request<AuthUser>({
      url: '/auth/register',
      method: 'POST',
      authToken: null,
      data: credentials,
    }),
}
