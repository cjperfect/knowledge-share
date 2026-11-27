import { z } from 'zod'
import type { AuthSession } from '@/interface/auth'
import { create } from 'zustand'

const storageKey = 'knowledge-share:admin-user-v1'
const sessionSchema = z.object({
  id: z.string(),
  username: z.string(),
  role: z.enum(['super_admin', 'admin']),
  expiresAt: z.number(),
  token: z.string().min(1),
})

interface AuthState {
  auth: {
    user: AuthSession | null
    setUser: (user: AuthSession | null) => void
    reset: () => void
  }
}

function readUser(): AuthSession | null {
  try {
    const user = sessionSchema.safeParse(
      JSON.parse(localStorage.getItem(storageKey) ?? 'null')
    )
    if (user.success && user.data.expiresAt > Date.now()) return user.data
  } catch {
    // The login screen remains available when browser storage is unavailable.
  }
  return null
}

export const useAuthStore = create<AuthState>()((set) => {
  function setUser(user: AuthSession | null) {
    try {
      if (user) localStorage.setItem(storageKey, JSON.stringify(user))
      else localStorage.removeItem(storageKey)
    } catch {
      // Keep the current tab usable without persistent storage.
    }
    set((state) => ({ auth: { ...state.auth, user } }))
  }

  return {
    auth: { user: readUser(), setUser, reset: () => setUser(null) },
  }
})
