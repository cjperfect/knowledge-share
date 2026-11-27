import { useRef, useState } from 'react'
import type { PushInput, PushRecord } from '@/interface/push'
import { plainSummaryText } from '@/util/plain-summary'
import { documentText, markdownToEditorBlocks } from '@/util/rich-text'
import type { PartialBlock } from '@blocknote/core'
import { Clock3, Loader2, Lock, PenLine, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { pushesApi } from '@/api/pushes'
import { useTheme } from '@/context/theme-provider'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { aiActionButtonClass } from '@/components/ai-action-button'
import {
  ArticleEditor,
  type ArticleEditorInstance,
} from '@/components/article-editor'
import { DateTimePicker } from '@/components/date-time-picker'
import { StatusBadge } from './push-table'

function nowInShanghai() {
  return {
    date: new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Shanghai',
    }),
    time: new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Shanghai',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date()),
  }
}

export interface PushComposerPreset {
  title?: string
  summary?: string
  document?: PartialBlock[]
  contentMarkdown?: string
  activityId?: string
  tags?: string[]
  prompt?: string
}

export function PushComposer({
  initial,
  preset,
  onClose,
  onSave,
}: {
  initial: PushRecord | null
  preset?: PushComposerPreset | null
  onClose: () => void
  onSave: (record: PushInput) => Promise<PushRecord>
}) {
  const { resolvedTheme } = useTheme()
  const tags = initial?.tags ?? preset?.tags ?? []
  const prompt = initial?.prompt ?? preset?.prompt ?? ''
  const [title, setTitle] = useState(initial?.title ?? preset?.title ?? '')
  const [summary, setSummary] = useState(
    initial?.summary ?? preset?.summary ?? ''
  )
  const initialBlocks = initial?.document ??
    preset?.document ?? [{ type: 'paragraph', content: '' }]
  const [blocks, setBlocks] = useState<PartialBlock[]>(initialBlocks)
  const editorRef = useRef<ArticleEditorInstance | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const [titleError, setTitleError] = useState('')
  const [optimizing, setOptimizing] = useState<'summary' | 'body' | null>(null)
  const [optimizeChars, setOptimizeChars] = useState(0)
  const [saving, setSaving] = useState(false)
  const [sendAt, setSendAt] = useState(
    initial?.status === 'scheduled' ? `${initial.date}T${initial.time}` : ''
  )
  const [formError, setFormError] = useState('')
  const bodyLocked = initial?.status === 'sent'

  const textLength = documentText(blocks).replace(/\s/g, '').length
  const busy = saving || optimizing !== null

  async function optimizeSummary() {
    if (busy) return
    if (!title.trim()) {
      setFormError('')
      setTitleError('请先填写标题，再让 AI 优化摘要。')
      titleRef.current?.focus()
      return
    }
    const previous = summary
    let latest = summary
    setFormError('')
    setOptimizeChars(0)
    setOptimizing('summary')
    try {
      await pushesApi.optimizeSummaryStream(
        { title, tags, summary, prompt },
        (_delta, full) => {
          const clean = plainSummaryText(full)
          latest = clean
          if (clean) setSummary(clean)
          setOptimizeChars(Array.from(clean).length)
        }
      )
      const finalText = plainSummaryText(latest).slice(0, 200)
      if (!finalText) throw new Error('AI 未返回摘要内容，请稍后重试。')
      setSummary(finalText)
      toast.success('摘要已优化')
    } catch (error) {
      setSummary(previous)
      toast.error(
        error instanceof Error ? error.message : '摘要优化失败，请稍后重试。'
      )
    } finally {
      setOptimizing(null)
      setOptimizeChars(0)
    }
  }

  async function optimizeBody() {
    if (busy || bodyLocked) return
    if (!title.trim()) {
      setFormError('')
      setTitleError('请先填写标题，再让 AI 优化正文。')
      titleRef.current?.focus()
      return
    }
    const currentDocument = editorRef.current?.document ?? blocks
    let markdown = ''
    let rendered = false
    const applyMarkdown = (text: string) => {
      const editor = editorRef.current
      if (!editor) return
      const next = markdownToEditorBlocks(editor, text)
      if (!next.length) return
      editor.replaceBlocks(editor.document, next)
      rendered = true
      setBlocks(editor.document)
      setOptimizeChars(documentText(editor.document).replace(/\s/g, '').length)
    }
    setFormError('')
    setOptimizeChars(0)
    setOptimizing('body')
    try {
      await pushesApi.optimizeBodyStream(
        {
          title,
          summary,
          tags,
          content: documentText(currentDocument).trim().slice(0, 8000),
        },
        (delta) => {
          markdown += delta
          applyMarkdown(markdown)
        }
      )
      const editor = editorRef.current
      if (!editor || !markdown.trim()) {
        throw new Error('AI 未返回正文内容，请稍后重试。')
      }
      const finalBlocks = markdownToEditorBlocks(editor, markdown)
      if (!finalBlocks.length) {
        throw new Error('AI 返回的正文格式不完整，请稍后重试。')
      }
      editor.replaceBlocks(editor.document, finalBlocks)
      setBlocks(editor.document)
      toast.success('正文已优化', {
        description: '内容已填入富文本，可以继续手动调整。',
      })
    } catch (error) {
      const editor = editorRef.current
      if (rendered && editor) {
        editor.replaceBlocks(editor.document, currentDocument)
        setBlocks(editor.document)
      }
      toast.error(
        error instanceof Error ? error.message : '正文优化失败，请稍后重试。'
      )
    } finally {
      setOptimizing(null)
      setOptimizeChars(0)
    }
  }

  function validate(publish: boolean) {
    if (!title.trim()) return '请填写标题。'
    if (textLength === 0) return '文章内容不能为空。'
    if (!publish) return ''
    if (
      !initial &&
      sendAt &&
      new Date(`${sendAt}:00+08:00`).getTime() <= Date.now()
    ) {
      return '发送时间需晚于当前时间。'
    }
    return ''
  }

  async function persist(asDraft: boolean) {
    if (saving) return
    const error = validate(!asDraft)
    if (error) {
      setFormError(error)
      return
    }

    const now = nowInShanghai()
    let date = now.date
    let time = now.time
    if (sendAt) {
      const [datePart, timePart] = sendAt.split('T')
      date = datePart
      time = timePart
    } else if (initial) {
      date = initial.date
      time = initial.time
    }

    let status: PushRecord['status']
    if (asDraft) {
      status = 'draft'
    } else if (!initial) {
      status = sendAt ? 'scheduled' : 'sent'
    } else if (
      sendAt &&
      new Date(`${sendAt}:00+08:00`).getTime() > Date.now()
    ) {
      status = 'scheduled'
    } else {
      status = initial.status
    }

    const record: PushInput = {
      title: title.trim(),
      summary: summary.trim() || documentText(blocks).slice(0, 86),
      date,
      time,
      status,
      document: bodyLocked && initial ? initial.document : blocks,
      contentMarkdown:
        bodyLocked && initial
          ? initial.contentMarkdown
          : (editorRef.current?.blocksToMarkdownLossy(blocks) ?? ''),
      activityId: initial?.activityId ?? preset?.activityId,
      tags,
      prompt: prompt.trim(),
    }

    setFormError('')
    setSaving(true)
    try {
      const saved = await onSave(record)
      toast.success(
        bodyLocked
          ? '推送信息已更新'
          : saved.status === 'scheduled'
            ? '已加入定时队列'
            : saved.status === 'sent'
              ? '推送已发布'
              : '内容已保存'
      )
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '保存推送失败。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose()
      }}
    >
      <DialogContent
        tabIndex={-1}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          const content = event.currentTarget as HTMLElement | null
          content?.focus()
        }}
        className='flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 outline-none sm:max-w-5xl'
      >
        <DialogHeader className='shrink-0 border-b px-6 py-4 pr-12 text-left'>
          <div className='flex flex-wrap items-center gap-2'>
            <DialogTitle className='text-xl'>
              {bodyLocked ? '推送详情' : initial ? '编辑推送' : '新建推送'}
            </DialogTitle>
            {initial && <StatusBadge status={initial.status} />}
          </div>
        </DialogHeader>

        <div className='min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6'>
          <div
            className={`grid min-w-0 gap-5 ${
              bodyLocked ? '' : 'lg:grid-cols-[minmax(0,1fr)_250px]'
            }`}
          >
            <div className='min-w-0 space-y-5'>
              <div className='space-y-2'>
                <Label htmlFor='push-title'>标题</Label>
                <Input
                  id='push-title'
                  ref={titleRef}
                  value={title}
                  maxLength={50}
                  readOnly={bodyLocked}
                  onChange={(event) => {
                    setTitle(event.target.value)
                    if (titleError) setTitleError('')
                  }}
                  placeholder='例如：本周保研资讯：夏令营、预推免与材料准备'
                  className='h-auto border-0 bg-transparent px-0 text-xl font-semibold tracking-tight shadow-none focus-visible:ring-0 md:text-2xl'
                />
                {titleError && (
                  <p role='alert' className='text-xs text-destructive'>
                    {titleError}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <Label htmlFor='push-summary'>摘要</Label>
                  <div className='flex items-center gap-2'>
                    {optimizing === 'summary' && (
                      <span
                        className='text-xs text-muted-foreground tabular-nums'
                        aria-live='polite'
                      >
                        {optimizeChars} 字
                      </span>
                    )}
                    {!bodyLocked && (
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        className={aiActionButtonClass}
                        onClick={() => void optimizeSummary()}
                        disabled={busy}
                      >
                        {optimizing === 'summary' ? (
                          <Loader2 className='size-3.5 animate-spin' />
                        ) : (
                          <Sparkles className='size-3.5' />
                        )}
                        {optimizing === 'summary' ? '优化中' : 'AI 优化'}
                      </Button>
                    )}
                  </div>
                </div>
                <Textarea
                  id='push-summary'
                  value={summary}
                  maxLength={200}
                  rows={3}
                  disabled={busy}
                  readOnly={bodyLocked}
                  onChange={(event) => setSummary(event.target.value)}
                  placeholder='可留空，只填标题也能让 AI 生成 50–80 字摘要。'
                  className='min-h-0 resize-none border-0 bg-transparent px-0 text-sm leading-6 text-muted-foreground shadow-none focus-visible:ring-0'
                />
              </div>

              <div className='overflow-hidden rounded-xl border bg-card'>
                <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
                  <p className='text-sm font-medium'>文章内容</p>
                  <div className='flex items-center gap-2'>
                    <span
                      className='text-xs text-muted-foreground tabular-nums'
                      aria-live='polite'
                    >
                      {optimizing === 'body'
                        ? `AI 优化中 · ${optimizeChars} 字符`
                        : `富文本 · 约 ${textLength} 字`}
                    </span>
                    <Button
                      type='button'
                      size='sm'
                      variant='outline'
                      className={aiActionButtonClass}
                      onClick={() => void optimizeBody()}
                      disabled={busy || bodyLocked}
                      hidden={bodyLocked}
                    >
                      {optimizing === 'body' ? (
                        <Loader2 className='size-3.5 animate-spin' />
                      ) : (
                        <Sparkles className='size-3.5' />
                      )}
                      {optimizing === 'body' ? '优化中' : 'AI 优化'}
                    </Button>
                    {bodyLocked && (
                      <span className='inline-flex items-center gap-1.5 rounded-full border bg-muted/45 px-2.5 py-1 text-xs text-muted-foreground'>
                        <Lock className='size-3.5' />
                        正文已锁定
                      </span>
                    )}
                  </div>
                </div>
                <div className='px-4 py-3'>
                  {bodyLocked && (
                    <p className='mb-3 text-xs leading-5 text-muted-foreground'>
                      推送已发送，以下为发送时的内容，仅供查看。
                    </p>
                  )}
                  <ArticleEditor
                    initialContent={blocks}
                    onChange={setBlocks}
                    theme={resolvedTheme}
                    editorRef={editorRef}
                    readOnly={bodyLocked}
                  />
                </div>
              </div>
            </div>

            {!bodyLocked && (
              <div className='space-y-4'>
                <div className='rounded-xl border bg-card'>
                  <div className='flex items-center gap-2 border-b px-4 py-3 text-sm font-medium'>
                    <Clock3 className='size-4' />
                    发送时间
                  </div>
                  <div className='space-y-4 p-4'>
                    <p className='text-xs leading-5 text-muted-foreground'>
                      留空则立即发送；选择未来时间会加入定时队列。
                    </p>
                    <DateTimePicker
                      id='push-send-at'
                      ariaLabel='发送时间'
                      value={sendAt}
                      onChange={setSendAt}
                      invalid={formError.includes('发送时间')}
                    />
                    {initial && (
                      <div className='flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground'>
                        <span>当前状态</span>
                        <StatusBadge status={initial.status} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {formError && (
            <p role='alert' className='mt-4 text-sm text-destructive'>
              {formError}
            </p>
          )}
        </div>

        <div className='flex shrink-0 justify-end border-t bg-muted/20 px-5 py-3 sm:px-6'>
          {bodyLocked ? (
            <Button type='button' onClick={onClose}>
              关闭
            </Button>
          ) : (
            <div className='flex w-full gap-2 sm:w-auto'>
              <Button
                type='button'
                variant='outline'
                onClick={() => persist(true)}
                disabled={busy}
                className='flex-1 sm:flex-none'
              >
                保存草稿
              </Button>
              <Button
                type='button'
                onClick={() => persist(false)}
                disabled={busy}
                className='flex-1 sm:flex-none'
              >
                <PenLine className='size-4' />
                {initial ? '保存修改' : sendAt ? '保存并定时' : '保存并发送'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
