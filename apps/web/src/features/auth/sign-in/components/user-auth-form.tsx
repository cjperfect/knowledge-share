import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '@/util/utils'
import { ArrowRight, Loader2, LockKeyhole, User } from 'lucide-react'
import { toast } from 'sonner'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'

const formSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, '请输入用户名。')
    .min(2, '用户名至少需要 2 个字符。')
    .max(30, '用户名不能超过 30 个字符。')
    .regex(
      /^[\p{L}\p{N}_-]+$/u,
      '用户名只能包含中英文、数字、下划线或短横线。'
    ),
  password: z
    .string()
    .min(1, '请输入密码。')
    .max(64, '密码不能超过 64 个字符。'),
})

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

function UsernameInput(props: React.ComponentProps<typeof Input>) {
  return (
    <div className='relative'>
      <User
        className='pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground'
        aria-hidden='true'
      />
      <Input className='h-11 pl-10' {...props} />
    </div>
  )
}

function PasswordField(props: React.ComponentProps<typeof PasswordInput>) {
  return (
    <div className='relative'>
      <LockKeyhole
        className='pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground'
        aria-hidden='true'
      />
      <PasswordInput
        className='[&>input]:h-11 [&>input]:pr-10 [&>input]:pl-10'
        {...props}
      />
    </div>
  )
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const user = await authApi.login(data)
      auth.setUser(user)
      const target =
        redirectTo &&
        /^\/(?![/\\])/.test(redirectTo) &&
        !/[\\\s]/.test(redirectTo)
          ? redirectTo
          : '/'
      await navigate({ to: target, replace: true })
      toast.success(`欢迎回来，${user.username}`)
    } catch (error) {
      form.setError('root', {
        message:
          error instanceof Error ? error.message : '登录失败，请稍后重试。',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-5', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem>
              <FormLabel>用户名</FormLabel>
              <FormControl>
                <UsernameInput
                  autoComplete='username'
                  placeholder='请输入用户名'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <div className='flex items-center justify-between gap-3'>
                <FormLabel>密码</FormLabel>
              </div>
              <FormControl>
                <PasswordField
                  autoComplete='current-password'
                  placeholder='请输入密码'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          className='mt-1 h-11 w-full justify-center gap-2 rounded-lg text-sm font-medium shadow-sm'
          disabled={isLoading}
        >
          {isLoading ? '正在登录…' : '登录'}
          {isLoading ? (
            <Loader2 className='size-4 animate-spin' />
          ) : (
            <ArrowRight className='size-4' />
          )}
        </Button>

        {form.formState.errors.root?.message && (
          <p role='alert' className='text-sm text-destructive'>
            {form.formState.errors.root.message}
          </p>
        )}
      </form>
    </Form>
  )
}
