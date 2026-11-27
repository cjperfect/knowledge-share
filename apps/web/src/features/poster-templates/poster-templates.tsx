import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  PosterTemplate,
  PosterTemplateInput,
} from '@/interface/poster-template'
import { cn } from '@/util/utils'
import { LayoutTemplate, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { posterTemplatesApi } from '@/api/poster-templates'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Main } from '@/components/layout/main'
import { OperationsLayout } from '@/components/layout/operations-layout'
import { PageHeader } from '@/components/layout/page-header'
import { PosterTemplateFormDialog } from './poster-template-form-dialog'
import { PosterTemplatePreview } from './poster-template-preview'

function DeleteTemplateButton({
  template,
  onDelete,
}: {
  template: PosterTemplate
  onDelete: (template: PosterTemplate) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type='button'
          className='text-xs font-normal text-destructive transition-colors hover:text-destructive/80'
        >
          删除
        </button>
      </PopoverTrigger>
      <PopoverContent
        align='end'
        aria-label='删除海报模板确认'
        onInteractOutside={(event) => event.preventDefault()}
        className='w-72 space-y-3'
      >
        <div className='space-y-1.5'>
          <p className='font-medium'>删除海报模板？</p>
          <p className='text-sm break-words text-muted-foreground'>
            「{template.name}」将被永久删除
            {template.enabled ? '，当前海报会回到内置默认样式。' : '。'}
          </p>
        </div>
        <div className='flex justify-end gap-2'>
          <Button
            type='button'
            size='sm'
            variant='outline'
            onClick={() => setOpen(false)}
          >
            取消
          </Button>
          <Button
            type='button'
            size='sm'
            variant='destructive'
            disabled={deleting}
            onClick={async () => {
              setDeleting(true)
              try {
                await onDelete(template)
                setOpen(false)
              } catch (error) {
                toast.error(
                  error instanceof Error ? error.message : '删除模板失败。'
                )
              } finally {
                setDeleting(false)
              }
            }}
          >
            确认删除
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function PosterTemplates() {
  const queryClient = useQueryClient()
  const templates = useQuery({
    queryKey: ['poster-templates'],
    queryFn: ({ signal }) => posterTemplatesApi.list(signal),
  })
  const rows = templates.data ?? []
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<PosterTemplate | null>(null)
  const [enablingId, setEnablingId] = useState('')

  function refresh(next?: PosterTemplate) {
    void queryClient.invalidateQueries({ queryKey: ['poster-templates'] })
    void queryClient.invalidateQueries({ queryKey: ['poster-template-active'] })
    if (next) {
      queryClient.setQueryData(
        ['poster-templates'],
        (current: PosterTemplate[] | undefined) =>
          current?.map((item) => ({
            ...item,
            enabled: item.id === next.id,
          }))
      )
    }
  }

  function beginCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function beginEdit(template: PosterTemplate) {
    setEditing(template)
    setFormOpen(true)
  }

  async function handleSave(input: PosterTemplateInput) {
    const saved = editing
      ? await posterTemplatesApi.update(editing.id, input)
      : await posterTemplatesApi.create(input)
    await queryClient.invalidateQueries({ queryKey: ['poster-templates'] })
    await queryClient.invalidateQueries({
      queryKey: ['poster-template-active'],
    })
    toast.success(
      `「${saved.name}」已${editing ? '更新' : '新增'}，${
        saved.enabled ? '海报正在使用该模板' : '点击启用后用于海报制作'
      }`
    )
    setFormOpen(false)
    setEditing(null)
  }

  async function handleEnable(template: PosterTemplate) {
    if (template.enabled || enablingId) return
    setEnablingId(template.id)
    try {
      const enabled = await posterTemplatesApi.enable(template.id)
      refresh(enabled)
      toast.success(`已启用「${enabled.name}」，之后的每张海报都会使用该模板`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '启用模板失败。')
    } finally {
      setEnablingId('')
    }
  }

  async function handleDelete(template: PosterTemplate) {
    await posterTemplatesApi.remove(template.id)
    await queryClient.invalidateQueries({ queryKey: ['poster-templates'] })
    await queryClient.invalidateQueries({
      queryKey: ['poster-template-active'],
    })
    toast.success(`「${template.name}」已删除`)
  }

  return (
    <OperationsLayout title='海报模板'>
      <Main className='mx-auto w-full max-w-7xl min-w-0 space-y-5 sm:px-6 lg:px-8'>
        <PageHeader
          title='海报模板'
          actions={
            <Button onClick={beginCreate}>
              <Plus aria-hidden='true' />
              新增模板
            </Button>
          }
        />

        {templates.isPending ? (
          <p role='status' className='p-5 text-sm text-muted-foreground'>
            正在加载海报模板…
          </p>
        ) : templates.isError ? (
          <div className='flex items-center gap-2 p-5'>
            <p role='alert' className='text-sm text-destructive'>
              {templates.error.message}
            </p>
            <Button variant='outline' onClick={() => templates.refetch()}>
              重试
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <div className='grid min-h-72 place-items-center rounded-xl border border-dashed bg-muted/20 px-6 text-center'>
            <div className='space-y-3'>
              <LayoutTemplate className='mx-auto size-8 text-muted-foreground' />
              <div>
                <p className='font-medium'>还没有海报模板</p>
                <p className='mt-1 text-sm text-muted-foreground'>
                  上传一张 3:4 海报底图并填写名称，启用后即可替换内置海报样式。
                </p>
              </div>
              <Button size='sm' onClick={beginCreate}>
                <Plus aria-hidden='true' />
                新增第一张模板
              </Button>
            </div>
          </div>
        ) : (
          <div className='grid gap-5 sm:grid-cols-2 xl:grid-cols-3'>
            {rows.map((template) => (
              <Card
                key={template.id}
                className={cn(
                  'group h-full gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md',
                  template.enabled && 'ring-2 ring-primary/55'
                )}
              >
                <div className='relative border-b bg-muted/30 p-3'>
                  <PosterTemplatePreview image={template.image} />
                </div>

                <CardContent className='flex flex-1 flex-col gap-3 p-4'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <h2 className='truncate text-lg font-semibold tracking-tight'>
                        {template.name}
                      </h2>
                      <p className='mt-1 text-xs text-muted-foreground'>
                        3:4 海报底图
                      </p>
                    </div>
                    {template.enabled ? (
                      <span className='shrink-0 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary'>
                        已启用
                      </span>
                    ) : (
                      <Button
                        size='sm'
                        variant='outline'
                        disabled={Boolean(enablingId)}
                        onClick={() => void handleEnable(template)}
                      >
                        {enablingId === template.id ? '启用中…' : '启用'}
                      </Button>
                    )}
                  </div>

                  <div className='mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3 text-xs'>
                    <button
                      type='button'
                      className='font-normal text-muted-foreground transition-colors hover:text-foreground'
                      onClick={() => beginEdit(template)}
                    >
                      编辑
                    </button>
                    <DeleteTemplateButton
                      template={template}
                      onDelete={handleDelete}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Main>

      {formOpen && (
        <PosterTemplateFormDialog
          key={editing?.id ?? 'new'}
          open
          template={editing}
          onOpenChange={(open) => {
            setFormOpen(open)
            if (!open) setEditing(null)
          }}
          onSave={handleSave}
        />
      )}
    </OperationsLayout>
  )
}
