import { useSearch } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { UserAuthForm } from './components/user-auth-form'

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })

  return (
    <AuthLayout>
      <Card className='max-w-none gap-0 rounded-2xl border-border/70 bg-card/90 p-7 shadow-[0_30px_90px_-38px_rgba(15,23,42,0.45)] backdrop-blur-sm sm:p-9'>
        <CardHeader className='gap-0 p-0'>
          <div className='flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase'>
            <span className='h-px w-6 bg-primary/35' />
            Admin Console
          </div>
          <CardTitle className='mt-4 text-3xl tracking-[-0.04em]'>
            欢迎回来
          </CardTitle>
          <CardDescription className='mt-2 text-sm leading-6'>
            登录后继续管理活动报名、内容推送和分享数据。
          </CardDescription>
        </CardHeader>

        <CardContent className='mt-8 p-0'>
          <UserAuthForm redirectTo={redirect} />
        </CardContent>

        <CardFooter className='mt-8 justify-between border-t border-border/60 p-0 pt-5 text-[11px] text-muted-foreground'>
          <span>© 2026 研途</span>
          <span className='inline-flex items-center gap-1.5'>
            <span className='size-1.5 rounded-full bg-emerald-500' />
            系统运行正常
          </span>
        </CardFooter>
      </Card>

      <p className='mt-5 text-center text-xs leading-5 text-muted-foreground'>
        遇到登录问题？联系管理员协助处理
      </p>
    </AuthLayout>
  )
}
