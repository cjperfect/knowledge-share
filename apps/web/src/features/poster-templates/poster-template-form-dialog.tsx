import { useState } from 'react'
import type {
  PosterTemplate,
  PosterTemplateInput,
} from '@/interface/poster-template'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { uploadsApi } from '@/api/uploads'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { posterTemplateFile } from './poster-template-image'
import { PosterTemplatePreview } from './poster-template-preview'

export function PosterTemplateFormDialog({
  open,
  template,
  onOpenChange,
  onSave,
}: {
  open: boolean
  template: PosterTemplate | null
  onOpenChange: (open: boolean) => void
  onSave: (input: PosterTemplateInput) => Promise<void>
}) {
  const [name, setName] = useState(template?.name ?? '')
  const [image, setImage] = useState(template?.image ?? '')
  const [saving, setSaving] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [formError, setFormError] = useState('')

  async function handleFile(file: File | undefined) {
    if (!file) return
    setProcessing(true)
    setFormError('')
    try {
      const uploaded = await uploadsApi.image(await posterTemplateFile(file))
      setImage(uploaded.url)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '图片处理失败。')
    } finally {
      setProcessing(false)
    }
  }

  async function submit() {
    if (saving) return
    if (!name.trim()) {
      setFormError('请填写模板名称。')
      return
    }
    if (!image) {
      setFormError('请上传海报底图。')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      await onSave({ name: name.trim(), image })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '模板保存失败。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!saving) onOpenChange(next)
      }}
    >
      <DialogContent className='flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl'>
        <DialogHeader className='shrink-0 border-b px-6 py-4 pe-12 text-left'>
          <DialogTitle className='text-xl'>
            {template ? '编辑海报模板' : '新增海报模板'}
          </DialogTitle>
          <DialogDescription>
            上传一张 3:4 海报底图，并填写一个用于区分模板的名称。
          </DialogDescription>
        </DialogHeader>

        <div className='min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6'>
          <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]'>
            <div className='space-y-5'>
              <div className='space-y-2'>
                <Label htmlFor='poster-template-name'>模板名称</Label>
                <Input
                  id='poster-template-name'
                  value={name}
                  maxLength={50}
                  placeholder='例如：深色品牌版'
                  onChange={(event) => setName(event.target.value)}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='poster-template-image'>海报底图</Label>
                <div className='relative h-56 overflow-hidden rounded-xl border-2 border-dashed bg-muted/30 sm:h-64'>
                  {image ? (
                    <>
                      <img
                        src={image}
                        alt='海报底图预览'
                        className='size-full object-cover'
                      />
                      <div className='absolute inset-x-0 bottom-0 flex justify-end bg-gradient-to-t from-black/55 to-transparent p-3'>
                        <button
                          type='button'
                          className='rounded-md bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-900'
                          onClick={() =>
                            document
                              .getElementById('poster-template-image')
                              ?.click()
                          }
                        >
                          更换底图
                        </button>
                      </div>
                      <button
                        type='button'
                        aria-label='移除海报底图'
                        onClick={() => setImage('')}
                        className='absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-black/55 text-white'
                      >
                        <X className='size-3.5' />
                      </button>
                    </>
                  ) : (
                    <label
                      htmlFor='poster-template-image'
                      className='flex size-full cursor-pointer flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground transition-colors hover:text-foreground'
                    >
                      <ImagePlus className='size-7' />
                      <span className='text-sm'>点击上传海报底图</span>
                      <span className='text-xs leading-5'>
                        JPG / PNG / WebP，不超过 12MB，会自动裁成 3:4
                      </span>
                    </label>
                  )}
                  {processing && (
                    <div className='absolute inset-0 grid place-items-center bg-background/75'>
                      <Loader2 className='size-5 animate-spin text-muted-foreground' />
                    </div>
                  )}
                </div>
                <input
                  id='poster-template-image'
                  type='file'
                  accept='image/*'
                  className='sr-only'
                  onChange={(event) => {
                    void handleFile(event.target.files?.[0])
                    event.target.value = ''
                  }}
                />
                <p className='text-xs leading-5 text-muted-foreground'>
                  底图会完整铺满
                  1080×1440，活动信息与二维码叠加在底图上；建议主体避开底部信息区。
                </p>
              </div>

              {formError && (
                <p role='alert' className='text-sm text-destructive'>
                  {formError}
                </p>
              )}
            </div>

            <div className='rounded-xl border bg-muted/35 p-3 sm:p-4'>
              <div className='mb-3 flex items-center justify-between gap-2'>
                <p className='text-sm font-medium'>模板预览</p>
                <span className='text-xs text-muted-foreground'>
                  上传的底图
                </span>
              </div>
              <PosterTemplatePreview image={image} />
            </div>
          </div>
        </div>

        <DialogFooter className='shrink-0 border-t bg-background px-5 py-3 sm:px-6'>
          <div className='flex w-full justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button
              type='button'
              onClick={submit}
              disabled={processing || saving}
            >
              {saving ? '正在保存…' : template ? '保存修改' : '新增模板'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
