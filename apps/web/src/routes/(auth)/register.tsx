import { createFileRoute } from '@tanstack/react-router'
import { InviteRegister } from '@/features/auth/register/invite-register'

export const Route = createFileRoute('/(auth)/register')({
  component: InviteRegister,
})
