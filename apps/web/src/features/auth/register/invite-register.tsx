import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/password-input'
import { AuthLayout } from '../auth-layout'

export function InviteRegister() {
  const token = useLocation({
    select: (location) => location.hash.replace(/^#/, ''),
  })
  const validToken = /^[a-f0-9]{64}$/.test(token)
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validToken || pending) return
    const form = new FormData(event.currentTarget)
    const username = String(form.get('username') ?? '').trim()
    const password = String(form.get('password') ?? '')
    if (!/^[\p{L}\p{N}_-]{2,30}$/u.test(username)) {
      setError('请输入 2 到 30 个字母、数字、下划线或短横线。')
      return
    }
    if (password !== form.get('confirmPassword')) {
      setError('两次输入的密码不一致。')
      return
    }

    setError('')
    setPending(true)
    try {
      await authApi.register({ token, username, password })
      toast.success('账号已创建，请登录。')
      await navigate({ to: '/sign-in', replace: true })
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : '注册失败，请稍后重试。'
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthLayout>
      <Card className='gap-7 rounded-2xl border-border/70 bg-card/90 p-7 shadow-xl backdrop-blur-sm sm:p-9'>
        <CardHeader className='p-0'>
          <CardTitle className='text-3xl tracking-tight'>
            接受账号邀请
          </CardTitle>
          <CardDescription className='leading-6'>
            {validToken
              ? '设置用户名和密码，开通运营后台账号。'
              : '请向超级管理员获取有效的邀请链接。'}
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-6 p-0'>
          {validToken && (
            <form className='grid gap-4' onSubmit={register}>
              <div className='grid gap-2'>
                <Label htmlFor='invite-username'>用户名</Label>
                <Input
                  id='invite-username'
                  name='username'
                  autoComplete='username'
                  required
                  minLength={2}
                  maxLength={30}
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='invite-password'>密码</Label>
                <PasswordInput
                  id='invite-password'
                  name='password'
                  autoComplete='new-password'
                  placeholder='至少 8 个字符'
                  required
                  minLength={8}
                  maxLength={64}
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='invite-confirm'>确认密码</Label>
                <PasswordInput
                  id='invite-confirm'
                  name='confirmPassword'
                  autoComplete='new-password'
                  required
                />
              </div>
              {error && (
                <p role='alert' className='text-sm text-destructive'>
                  {error}
                </p>
              )}
              <Button disabled={pending}>
                {pending ? '正在创建…' : '创建账号'}
              </Button>
            </form>
          )}
          <Link
            to='/sign-in'
            className='text-center text-sm text-muted-foreground hover:underline'
          >
            返回登录
          </Link>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
