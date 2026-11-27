import { useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { getCookie } from '@/util/cookies'
import { getDisplayNameInitials } from '@/util/utils'
import {
  CalendarDays,
  ChevronsUpDown,
  ClipboardList,
  GraduationCap,
  HandCoins,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Package,
  Send,
  UsersRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from '@/components/ui/sidebar'
import { ThemeSwitch } from '@/components/theme-switch'
import { Header } from './header'

const navigation = [
  { to: '/', label: '数据看板', icon: LayoutDashboard },
  { to: '/activities', label: '活动', icon: CalendarDays },
  { to: '/content-push', label: '内容推送', icon: Send },
  { to: '/products', label: '产品列表', icon: Package },
  { to: '/poster-templates', label: '海报模板', icon: LayoutTemplate },
  { to: '/commissions', label: '佣金结算', icon: HandCoins },
] as const

function UserMenu() {
  const { setOpenMobile } = useSidebar()
  const navigate = useNavigate()
  const { auth } = useAuthStore()
  const [userOpen, setUserOpen] = useState(false)
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  const displayName = auth.user?.username?.trim() || '研途管理员'
  const roleLabel = auth.user?.role === 'super_admin' ? '超级管理员' : '管理员'
  const initials = getDisplayNameInitials(displayName)

  async function handleLogout() {
    try {
      await authApi.logout()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '退出登录失败。')
      return
    }
    auth.reset()
    setConfirmingLogout(false)
    setUserOpen(false)
    setOpenMobile(false)
    navigate({ to: '/sign-in', replace: true })
    toast.success('已退出登录')
  }

  return (
    <>
      <Popover
        open={userOpen}
        onOpenChange={(open) => {
          setUserOpen(open)
          if (!open) setConfirmingLogout(false)
        }}
      >
        <PopoverTrigger asChild>
          <button
            type='button'
            className='flex w-full items-center gap-3 rounded-lg border border-sidebar-border/70 bg-sidebar-accent/25 p-2 text-start transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0 hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-hidden'
          >
            <span className='grid size-8 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-semibold tracking-tight text-primary-foreground'>
              {initials}
            </span>
            <span className='min-w-0 flex-1 group-data-[collapsible=icon]:hidden'>
              <span className='block truncate text-sm leading-5 font-medium'>
                {displayName}
              </span>
              <span className='block truncate text-[11px] leading-4 text-muted-foreground'>
                {roleLabel}
              </span>
            </span>
            <ChevronsUpDown
              className='size-3.5 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden'
              aria-hidden='true'
            />
          </button>
        </PopoverTrigger>
        <PopoverContent side='top' align='start' className='w-64 p-2'>
          {confirmingLogout ? (
            <div className='p-2'>
              <p className='text-sm font-semibold'>确认退出登录？</p>
              <p className='mt-1.5 text-xs leading-5 text-muted-foreground'>
                退出后需要重新登录才能继续管理活动与内容，未保存的修改将丢失。
              </p>
              <div className='mt-3 flex gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='flex-1'
                  onClick={() => setConfirmingLogout(false)}
                >
                  取消
                </Button>
                <Button
                  type='button'
                  variant='destructive'
                  size='sm'
                  className='flex-1'
                  onClick={handleLogout}
                >
                  退出登录
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className='flex items-center gap-3 p-2'>
                <span className='grid size-10 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground'>
                  {initials}
                </span>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium'>{displayName}</p>
                  <p className='truncate text-xs text-muted-foreground'>
                    {roleLabel}
                  </p>
                </div>
              </div>
              <div className='my-1 h-px bg-border' />
              <button
                type='button'
                onClick={() => setConfirmingLogout(true)}
                className='flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10'
              >
                <LogOut className='size-4' aria-hidden='true' />
                退出登录
              </button>
            </>
          )}
        </PopoverContent>
      </Popover>
    </>
  )
}

function OperationsSidebar() {
  const { setOpenMobile } = useSidebar()
  const { pathname } = useLocation()
  const isSuperAdmin = useAuthStore(
    (state) => state.auth.user?.role === 'super_admin'
  )
  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader className='group-data-[collapsible=icon]:px-0'>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size='lg'
              tooltip='研途'
              className='mx-auto'
            >
              <Link to='/' onClick={() => setOpenMobile(false)}>
                <span className='grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
                  <GraduationCap className='size-5' />
                </span>
                <span className='grid text-sm leading-tight'>
                  <strong>研途</strong>
                  <small className='text-muted-foreground'>保研知识分享</small>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className='group-data-[collapsible=icon]:px-0'>
          <SidebarGroupLabel>运营概览</SidebarGroupLabel>
          <SidebarMenu>
            {navigation.map(({ to, label, icon: Icon }) => (
              <SidebarMenuItem key={label}>
                <SidebarMenuButton
                  asChild
                  tooltip={label}
                  className='mx-auto'
                  isActive={pathname === to}
                >
                  <Link
                    to={to}
                    activeOptions={{ exact: true }}
                    onClick={() => setOpenMobile(false)}
                  >
                    <Icon />
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        {isSuperAdmin && (
          <SidebarGroup className='group-data-[collapsible=icon]:px-0'>
            <SidebarGroupLabel>系统管理</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip='用户管理'
                  isActive={pathname === '/users'}
                  className='mx-auto'
                >
                  <Link to='/users' onClick={() => setOpenMobile(false)}>
                    <UsersRound />
                    <span>用户管理</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
        <SidebarGroup className='group-data-[collapsible=icon]:px-0'>
          <SidebarGroupLabel>测试功能</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip='报名页预览'
                className='mx-auto'
              >
                <Link
                  to='/join'
                  search={{ activity: 'signup-preview' }}
                  onClick={() => setOpenMobile(false)}
                >
                  <ClipboardList />
                  <span>报名页预览</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className='border-t border-sidebar-border/60 p-2'>
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  )
}

export function OperationsLayout({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <SidebarProvider defaultOpen={getCookie('sidebar_state') !== 'false'}>
      <OperationsSidebar />
      <SidebarInset className='min-w-0'>
        <Header fixed className='border-b bg-background'>
          <span className='me-auto text-sm font-medium'>{title}</span>
          <ThemeSwitch />
        </Header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
