export type AdminStatus = 'active' | 'disabled'

export interface AuthUser {
  id: string
  username: string
  role: 'super_admin' | 'admin'
}

export interface AuthSession extends AuthUser {
  expiresAt: number
  token: string
}

export interface AdminUser extends AuthUser {
  status: AdminStatus
}
