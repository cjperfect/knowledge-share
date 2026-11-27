import { useState } from 'react'
import { Copy, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { usersApi } from '@/api/users'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type Invitation =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; url: string; expiresAt: string }

const expiryFormat = new Intl.DateTimeFormat('zh-CN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Shanghai',
})

export function InvitePopover() {
  const [invite, setInvite] = useState<Invitation>()

  async function createInvite() {
    if (invite?.status === 'loading') return

    setInvite({ status: 'loading' })
    try {
      const { token, expiresAt } = await usersApi.invite()
      const url = new URL('/register', window.location.origin)
      url.hash = token
      setInvite({ status: 'ready', url: url.href, expiresAt })
    } catch (error) {
      setInvite({
        status: 'error',
        message: error instanceof Error ? error.message : '生成邀请失败。',
      })
    }
  }

  async function copyInvite(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('邀请链接已复制')
    } catch {
      toast.error('请在输入框中手动复制邀请链接。')
    }
  }

  return (
    <Popover
      onOpenChange={(open) => {
        if (open) void createInvite()
      }}
    >
      <PopoverTrigger asChild>
        <Button>
          <UserPlus aria-hidden='true' />
          邀请注册
        </Button>
      </PopoverTrigger>
      <PopoverContent
        aria-label='邀请注册'
        align='end'
        sideOffset={8}
        collisionPadding={12}
        className='w-96 max-w-[var(--radix-popover-content-available-width)] space-y-3'
      >
        <p className='text-sm text-muted-foreground'>
          将链接发给受邀人，每条链接仅可注册一个管理员账号。
        </p>

        {invite?.status === 'loading' && (
          <p role='status' className='text-sm text-muted-foreground'>
            正在生成邀请链接…
          </p>
        )}

        {invite?.status === 'error' && (
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <p role='alert' className='text-sm text-destructive'>
              {invite.message}
            </p>
            <Button variant='outline' onClick={createInvite}>
              重试
            </Button>
          </div>
        )}

        {invite?.status === 'ready' && (
          <div className='grid gap-3'>
            <Label htmlFor='admin-invite'>邀请链接</Label>
            <div className='flex gap-2'>
              <Input
                id='admin-invite'
                className='min-w-0'
                value={invite.url}
                readOnly
                onFocus={(event) => event.currentTarget.select()}
              />
              <Button variant='outline' onClick={() => copyInvite(invite.url)}>
                <Copy aria-hidden='true' />
                复制
              </Button>
            </div>
            <p className='text-xs text-muted-foreground'>
              有效期至 {expiryFormat.format(new Date(invite.expiresAt))}
              （北京时间）
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
