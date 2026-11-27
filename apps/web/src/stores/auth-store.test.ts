import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from './auth-store'

const user = {
  id: 'user-id',
  username: 'demo',
  role: 'admin',
  token: 'test-access-token',
  expiresAt: Date.now() + 60_000,
} as const

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().auth.reset()
  })

  it('starts with no user', () => {
    expect(useAuthStore.getState().auth.user).toBeNull()
  })

  it('updates the signed-in user and clears it on reset', () => {
    useAuthStore.getState().auth.setUser(user)
    expect(useAuthStore.getState().auth.user).toEqual(user)

    useAuthStore.getState().auth.reset()
    expect(useAuthStore.getState().auth.user).toBeNull()
  })
})
