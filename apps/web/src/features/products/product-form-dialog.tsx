import { useRef, useState } from 'react'
import type { Product, ProductInput } from '@/interface/product'
import { cn } from '@/util/utils'
import type { PartialBlock } from '@blocknote/core'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { uploadsApi } from '@/api/uploads'
import { useTheme } from '@/context/theme-provider'
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
import {
  ArticleEditor,
  type ArticleEditorInstance,
} from '@/components/article-editor'
import { thumbnailFile } from './product-image'
import { documentText } from './products'

const emptyDocument: PartialBlock[] = [{ type: 'paragraph', content: '' }]

export function ProductFormDialog({
  open,
  product,
  onOpenChange,
  onSave,
}: {
  open: boolean
  product: Product | null
  onOpenChange: (open: boolean) => void
  onSave: (input: ProductInput) => Promise<void>
}) {
  const { resolvedTheme } = useTheme()
  const [name, setName] = useState(product?.name ?? '')
  const [thumbnail, setThumbnail] = useState(product?.thumbnail ?? '')
  const [content, setContent] = useState<PartialBlock[]>(
    product?.document ?? emptyDocument
  )
  const editorRef = useRef<ArticleEditorInstance | null>(null)
  const [saving, setSaving] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [formError, setFormError] = useState('')

  const textLength = documentText(content).replace(/\s/g, '').length

  async function handleFile(file: File | undefined) {
    if (!file) return
    setProcessing(true)
    setFormError('')
    try {
      const uploaded = await uploadsApi.image(await thumbnailFile(file))
      setThumbnail(uploaded.url)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '图片处理失败。')
    } finally {
      setProcessing(false)
    }
  }

  async function submit() {
    if (saving) return
    if (!name.trim()) {
      setFormError('请填写产品名称。')
      return
    }
    if (textLength === 0) {
      setFormError('请填写产品详情介绍。')
      return
    }

    setSaving(true)
    setFormError('')
    try {
      await onSave({
        name: name.trim(),
        thumbnail,
        document: content,
        contentMarkdown:
          editorRef.current?.blocksToMarkdownLossy(content) ?? '',
      })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '产品保存失败。')
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
      <DialogContent className='flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl'>
        <DialogHeader className='shrink-0 border-b px-6 py-4 pe-12 text-left'>
          <DialogTitle className='text-xl'>
            {product ? '编辑产品' : '新增产品'}
          </DialogTitle>
          <DialogDescription>
            产品名称、缩略图和详情介绍会用于官网产品展示。
          </DialogDescription>
        </DialogHeader>

        <div className='min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6'>
          <div className='grid gap-5 sm:grid-cols-[240px_minmax(0,1fr)]'>
            <div className='space-y-2'>
              <Label htmlFor='product-thumbnail'>缩略图</Label>
              <div className='relative aspect-video overflow-hidden rounded-xl border bg-muted/40'>
                {thumbnail ? (
                  <>
                    <img
                      src={thumbnail}
                      alt='产品缩略图预览'
                      className='size-full object-cover'
                    />
                    <div className='absolute inset-x-0 bottom-0 flex justify-end bg-gradient-to-t from-black/55 to-transparent p-2'>
                      <button
                        type='button'
                        className='rounded-md bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-900'
                        onClick={() =>
                          document.getElementById('product-thumbnail')?.click()
                        }
                      >
                        更换
                      </button>
                    </div>
                    <button
                      type='button'
                      aria-label='移除缩略图'
                      onClick={() => setThumbnail('')}
                      className='absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-black/55 text-white'
                    >
                      <X className='size-3.5' />
                    </button>
                  </>
                ) : (
                  <label
                    htmlFor='product-thumbnail'
                    className='flex size-full cursor-pointer flex-col items-center justify-center gap-2 text-muted-foreground transition-colors hover:text-foreground'
                  >
                    <ImagePlus className='size-6' />
                    <span className='text-xs'>点击上传 16:9 图片</span>
                    <span className='text-[11px]'>JPG / PNG，不超过 8MB</span>
                  </label>
                )}
                {processing && (
                  <div className='absolute inset-0 grid place-items-center bg-background/70'>
                    <Loader2 className='size-5 animate-spin text-muted-foreground' />
                  </div>
                )}
              </div>
              <input
                id='product-thumbnail'
                type='file'
                accept='image/*'
                className='sr-only'
                onChange={(event) => {
                  void handleFile(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
              <p className='text-[11px] leading-4 text-muted-foreground'>
                不上传时，卡片和详情会自动使用统一占位图。
              </p>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='product-name'>产品名称</Label>
              <Input
                id='product-name'
                value={name}
                maxLength={50}
                placeholder='例如：保研定位诊断'
                onChange={(event) => setName(event.target.value)}
              />
              <p className='text-[11px] leading-4 text-muted-foreground'>
                建议 6–20 个字，会作为卡片标题和详情标题。
              </p>
            </div>
          </div>

          <div className='overflow-hidden rounded-xl border bg-card'>
            <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
              <p className='text-sm font-medium'>产品详情介绍</p>
              <span className='text-xs text-muted-foreground'>
                富文本 · 约 {textLength} 字
              </span>
            </div>
            <div className='px-4 py-3'>
              <ArticleEditor
                initialContent={content}
                onChange={setContent}
                theme={resolvedTheme}
                editorRef={editorRef}
              />
            </div>
          </div>

          {formError && (
            <p role='alert' className={cn('text-sm text-destructive')}>
              {formError}
            </p>
          )}
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
              {saving ? '正在保存…' : product ? '保存修改' : '新增产品'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
