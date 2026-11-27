import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Activity } from '@/interface/activity'
import {
  documentHasContent,
  blockText,
  documentText,
  markdownToEditorBlocks,
} from '@/util/rich-text'
import type { PartialBlock } from '@blocknote/core'
import {
  AudioLines,
  History,
  Loader2,
  Mic,
  Sparkles,
  Square,
} from 'lucide-react'
import { toast } from 'sonner'
import { activitiesApi } from '@/api/activities'
import { useTheme } from '@/context/theme-provider'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { aiActionButtonClass } from '@/components/ai-action-button'
import {
  ArticleEditor,
  type ArticleEditorInstance,
} from '@/components/article-editor'
import { appendSpeechText } from './activity-ai'
import { activityDetailKey } from './activity-keys'

const EMPTY_DOCUMENT: PartialBlock[] = [{ type: 'paragraph', content: '' }]

function initialDocument(document?: PartialBlock[]) {
  return document?.length ? document : EMPTY_DOCUMENT
}

function ReviewForm({
  activity,
  onClose,
  onSaved,
}: {
  activity: Activity
  onClose: () => void
  onSaved: (saved: Activity) => void
}) {
  const { resolvedTheme } = useTheme()
  const queryClient = useQueryClient()
  const detail = useQuery({
    queryKey: activityDetailKey(activity.id),
    queryFn: ({ signal }) => activitiesApi.detail(activity.id, signal),
    refetchOnMount: 'always',
  })

  const [blocks, setBlocks] = useState<PartialBlock[]>(EMPTY_DOCUMENT)
  const [editorKey, setEditorKey] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [streamChars, setStreamChars] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // AI 优化按钮暂时隐藏，恢复时改为 true；相关代码完整保留。
  const showAiActions = false
  // 语音输入暂时隐藏，恢复时改为 true；相关代码完整保留。
  const showSpeechInput = false
  const loadedId = useRef<string | null>(null)
  const editorRef = useRef<ArticleEditorInstance | null>(null)
  const speechBlockId = useRef<string | null>(null)
  const speechBlockTemporary = useRef(false)
  const textLength = documentText(blocks).replace(/\s/g, '').length

  function clearInterimBlock() {
    const editor = editorRef.current
    const blockId = speechBlockId.current
    if (!editor || !blockId) return
    if (speechBlockTemporary.current) {
      editor.removeBlocks([blockId])
    } else {
      editor.updateBlock(blockId, {
        type: 'paragraph',
        content: [],
        props: { textColor: 'default' },
      })
    }
    speechBlockId.current = null
    speechBlockTemporary.current = false
  }

  useEffect(() => {
    if (!detail.data || loadedId.current === detail.data.id) return
    loadedId.current = detail.data.id
    setBlocks(initialDocument(detail.data.content))
    setEditorKey((key) => key + 1)
  }, [detail.data])

  const speech = useSpeechRecognition({
    lang: 'zh-CN',
    onFinal: (text) => {
      const editor = editorRef.current
      if (!editor) return
      const interimId = speechBlockId.current
      if (interimId && !speechBlockTemporary.current) {
        speechBlockId.current = null
        editor.updateBlock(interimId, {
          type: 'paragraph',
          content: text,
          props: { textColor: 'default' },
        })
        return
      }
      clearInterimBlock()
      const lastBlock = editor.document.at(-1)
      if (!lastBlock) return

      if (lastBlock.type === 'paragraph') {
        editor.updateBlock(lastBlock, {
          type: 'paragraph',
          content: appendSpeechText(blockText(lastBlock), text),
        })
        return
      }

      editor.insertBlocks(
        [{ type: 'paragraph', content: text }],
        lastBlock,
        'after'
      )
    },
    onInterim: (text) => {
      const editor = editorRef.current
      if (!editor) return
      const trimmed = text.trim()
      if (!trimmed) {
        clearInterimBlock()
        return
      }
      if (speechBlockId.current) {
        editor.updateBlock(speechBlockId.current, { content: trimmed })
        return
      }
      const lastBlock = editor.document.at(-1)
      if (!lastBlock) return
      if (lastBlock.type === 'paragraph' && !blockText(lastBlock).trim()) {
        editor.updateBlock(lastBlock, {
          type: 'paragraph',
          content: trimmed,
          props: { textColor: 'gray' },
        })
        speechBlockId.current = lastBlock.id
        speechBlockTemporary.current = false
        return
      }
      const [block] = editor.insertBlocks(
        [
          {
            type: 'paragraph',
            props: { textColor: 'gray' },
            content: trimmed,
          },
        ],
        lastBlock,
        'after'
      )
      speechBlockId.current = block?.id ?? null
      speechBlockTemporary.current = Boolean(block)
    },
  })

  async function generateReview() {
    if (generating || saving) return
    if (speech.listening) speech.stop()
    clearInterimBlock()
    const currentDocument = editorRef.current?.document ?? blocks
    if (!documentHasContent(currentDocument)) {
      setError('请先通过语音输入或手动填写回顾正文，再让 AI 优化。')
      return
    }
    if (!detail.data) {
      setError('活动信息还在加载，请稍后重试。')
      return
    }

    let markdown = ''
    const applyMarkdown = (text: string) => {
      const editor = editorRef.current
      if (!editor) return
      const next = markdownToEditorBlocks(editor, text)
      if (!next.length) return
      editor.replaceBlocks(editor.document, next)
      setBlocks(editor.document)
      setStreamChars(documentText(editor.document).replace(/\s/g, '').length)
    }
    setError('')
    setStreamChars(0)
    setGenerating(true)
    const editor = editorRef.current
    const emptyDocument: PartialBlock[] = [{ type: 'paragraph', content: '' }]
    if (editor) editor.replaceBlocks(editor.document, emptyDocument)
    setBlocks(emptyDocument)
    try {
      await activitiesApi.generateReviewStream(
        {
          title: detail.data.name,
          sharer: detail.data.sharer,
          date: detail.data.date,
          source: documentText(currentDocument).trim().slice(0, 5000),
        },
        (delta) => {
          markdown += delta
          applyMarkdown(markdown)
        }
      )
      if (!editor || !markdown.trim()) {
        throw new Error('AI 未返回回顾内容，请稍后重试。')
      }
      const finalBlocks = markdownToEditorBlocks(editor, markdown)
      if (!finalBlocks.length) {
        throw new Error('AI 返回的回顾格式不完整，请稍后重试。')
      }
      editor.replaceBlocks(editor.document, finalBlocks)
      setBlocks(editor.document)
      toast.success('活动回顾已生成', {
        description: '正文已填入富文本，可以继续手动调整。',
      })
    } catch (failure) {
      if (editor) {
        editor.replaceBlocks(editor.document, currentDocument)
        setBlocks(editor.document)
      } else {
        setBlocks(currentDocument)
      }
      setError(
        failure instanceof Error ? failure.message : '生成失败，请稍后重试。'
      )
    } finally {
      setGenerating(false)
      setStreamChars(0)
    }
  }

  async function saveReview() {
    if (saving || generating) return
    if (speech.listening) speech.stop()
    clearInterimBlock()
    const currentDocument = editorRef.current?.document ?? blocks
    if (!documentHasContent(currentDocument)) {
      setError('请先填写回顾正文，再保存活动回顾。')
      return
    }
    setError('')
    setSaving(true)
    try {
      const contentMarkdown =
        editorRef.current?.blocksToMarkdownLossy(currentDocument) ?? ''
      const saved = await activitiesApi.updateContent(
        activity.id,
        currentDocument,
        contentMarkdown
      )
      queryClient.setQueryData(activityDetailKey(activity.id), saved)
      onSaved(saved)
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : '保存失败，请稍后重试。'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open && !saving && !generating) onClose()
        }}
      >
        <DialogContent
          className='flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl'
          showCloseButton={!saving && !generating}
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            const content = event.currentTarget as HTMLElement | null
            content?.focus()
          }}
        >
          <DialogHeader className='shrink-0 border-b px-5 py-4 pr-12 text-left sm:px-6'>
            <DialogTitle className='flex items-center gap-2 text-xl'>
              <History className='size-5 text-primary' />
              活动回顾
            </DialogTitle>
            <DialogDescription className='wrap-break-word'>
              {activity.name} · {activity.sharer || '—'} · {activity.date}
            </DialogDescription>
          </DialogHeader>

          <div className='min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6'>
            {detail.isPending ? (
              <div className='flex min-h-56 items-center justify-center text-sm text-muted-foreground'>
                <Loader2 className='me-2 size-4 animate-spin' />
                正在加载活动…
              </div>
            ) : detail.isError ? (
              <div className='flex flex-col items-center gap-3 py-10 text-center'>
                <p role='alert' className='text-sm text-destructive'>
                  {detail.error.message}
                </p>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => detail.refetch()}
                >
                  重试
                </Button>
              </div>
            ) : (
              <div className='space-y-5'>
                <div className='space-y-2'>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <div>
                      <Label>回顾正文</Label>
                      <p className='mt-1 text-xs leading-5 text-muted-foreground'>
                        {showSpeechInput
                          ? '点击语音输入，识别结果会直接写入正文；也可以手动继续编辑。'
                          : '直接在正文中填写或编辑回顾内容。'}
                      </p>
                    </div>
                    {showSpeechInput && (
                      <Button
                        type='button'
                        size='sm'
                        variant={speech.listening ? 'secondary' : 'outline'}
                        disabled={generating || saving || !speech.supported}
                        title={
                          speech.supported
                            ? undefined
                            : '当前浏览器不支持语音输入，请直接编辑正文'
                        }
                        onClick={() => {
                          if (speech.listening) speech.stop()
                          else speech.start()
                        }}
                        className='shrink-0'
                      >
                        {speech.listening ? (
                          <Square className='size-3.5 fill-current' />
                        ) : (
                          <Mic className='size-3.5' />
                        )}
                        {speech.listening ? '结束语音' : '语音输入'}
                      </Button>
                    )}
                  </div>

                  {showSpeechInput && speech.listening && (
                    <div className='flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs leading-5 text-primary'>
                      <AudioLines className='mt-0.5 size-3.5 shrink-0' />
                      <span>正在聆听，识别文字会实时写入正文…</span>
                    </div>
                  )}

                  <div
                    className={`flex flex-wrap items-center gap-2 text-xs text-muted-foreground ${
                      showSpeechInput ? 'justify-between' : 'justify-end'
                    }`}
                  >
                    {showSpeechInput && (
                      <span>
                        {speech.supported
                          ? '语音识别使用浏览器能力，建议使用 Chrome / Edge。'
                          : '当前浏览器不支持语音识别，可以直接在正文中手动输入。'}
                      </span>
                    )}
                    <span className='tabular-nums'>
                      富文本 · 约 {textLength} 字
                    </span>
                  </div>

                  {showSpeechInput && speech.error && (
                    <p role='alert' className='text-sm text-destructive'>
                      {speech.error}
                    </p>
                  )}

                  <ArticleEditor
                    key={editorKey}
                    initialContent={blocks}
                    onChange={setBlocks}
                    editorRef={editorRef}
                    theme={resolvedTheme}
                    readOnly={generating}
                    heightClassName='max-h-[420px] min-h-[260px]'
                  />
                </div>

                {showAiActions && (
                  <div className='flex flex-col gap-3 rounded-lg border bg-muted/25 p-3 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='space-y-1'>
                      <p className='flex items-center gap-1.5 text-sm font-medium'>
                        <Sparkles className='size-4 text-primary' />
                        AI 优化正文
                      </p>
                      <p className='text-xs leading-5 text-muted-foreground'>
                        AI
                        会读取当前正文，整理成段落、小标题和要点；会覆盖当前正文，生成后仍可修改。
                      </p>
                    </div>
                    <div className='flex shrink-0 flex-wrap items-center gap-2'>
                      {generating && (
                        <span
                          className='text-xs text-muted-foreground tabular-nums'
                          aria-live='polite'
                        >
                          正在整理 · {streamChars} 字符
                        </span>
                      )}
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        className={aiActionButtonClass}
                        onClick={() => void generateReview()}
                        disabled={generating || saving || textLength === 0}
                      >
                        {generating ? (
                          <Loader2 className='size-4 animate-spin' />
                        ) : (
                          <Sparkles className='size-4' />
                        )}
                        {generating ? '正在生成…' : 'AI 优化正文'}
                      </Button>
                    </div>
                  </div>
                )}

                {error && (
                  <p role='alert' className='text-sm text-destructive'>
                    {error}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className='flex shrink-0 flex-col gap-2 border-t bg-muted/15 px-5 py-3 sm:flex-row sm:justify-end sm:px-6'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={saving || generating}
            >
              取消
            </Button>
            <Button
              type='button'
              onClick={() => void saveReview()}
              disabled={
                saving || generating || detail.isPending || detail.isError
              }
            >
              {saving ? '正在保存…' : '保存回顾'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function ActivityReviewDialog({
  activity,
  onClose,
  onSaved,
}: {
  activity: Activity
  onClose: () => void
  onSaved: (saved: Activity) => void
}) {
  return <ReviewForm activity={activity} onClose={onClose} onSaved={onSaved} />
}
