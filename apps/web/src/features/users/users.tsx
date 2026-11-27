import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { AdminStatus, AdminUser } from '@/interface/auth'
import { toast } from 'sonner'
import { usersApi } from '@/api/users'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { OperationsLayout } from '@/components/layout/operations-layout'
import { InvitePopover } from './invite-popover'

export function Users() {
  const users = useQuery({
    queryKey: ['admin-users'],
    queryFn: usersApi.list,
    retry: false,
  })
  const [updatingUser, setUpdatingUser] = useState<string>()

  async function updateStatus(user: AdminUser, status: AdminStatus) {
    setUpdatingUser(user.id)
    try {
      await usersApi.updateStatus(user.id, status)
      await users.refetch()
      toast.success(status === 'active' ? '账号已启用' : '账号已停用')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '账号状态更新失败。')
    } finally {
      setUpdatingUser(undefined)
    }
  }

  return (
    <OperationsLayout title='用户管理'>
      <main className='mx-auto grid w-full max-w-5xl gap-5 px-4 py-6 sm:px-6'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <h1 className='text-2xl font-semibold tracking-tight'>后台账号</h1>
          <InvitePopover />
        </div>

        <div className='overflow-hidden rounded-lg border bg-card'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户名</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className='text-right'>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.isPending && (
                <TableRow>
                  <TableCell colSpan={4} className='h-20 text-center'>
                    正在加载账号…
                  </TableCell>
                </TableRow>
              )}
              {users.isError && (
                <TableRow>
                  <TableCell colSpan={4} className='h-20 text-center'>
                    <span role='alert'>{users.error.message}</span>
                    <Button variant='ghost' onClick={() => users.refetch()}>
                      重试
                    </Button>
                  </TableCell>
                </TableRow>
              )}
              {users.data?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className='font-medium'>{user.username}</TableCell>
                  <TableCell>
                    {user.role === 'super_admin' ? '超级管理员' : '管理员'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.status === 'active' ? 'secondary' : 'outline'
                      }
                    >
                      {user.status === 'active' ? '已启用' : '已停用'}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-right'>
                    {user.role === 'admin' && (
                      <Button
                        size='sm'
                        variant='ghost'
                        disabled={Boolean(updatingUser)}
                        onClick={() =>
                          updateStatus(
                            user,
                            user.status === 'active' ? 'disabled' : 'active'
                          )
                        }
                      >
                        {updatingUser === user.id
                          ? '处理中…'
                          : user.status === 'active'
                            ? '停用'
                            : '启用'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </OperationsLayout>
  )
}
