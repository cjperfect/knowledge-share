import { useEffect, useRef, useState, type RefObject } from 'react'
import { inlineImageFile } from '@/util/image'
import { cn } from '@/util/utils'
import type { PartialBlock } from '@blocknote/core'
import '@blocknote/core/fonts/inter.css'
import { zh } from '@blocknote/core/locales'
import { useCreateBlockNote, useEditorState } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/shadcn'
import '@blocknote/shadcn/style.css'
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Italic,
  ImagePlus,
  Link as LinkIcon,
  Loader2,
  List,
  ListOrdered,
  Pilcrow,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from 'lucide-react'
import { toast } from 'sonner'
import { uploadsApi } from '@/api/uploads'
import { Button } from '@/components/ui/button'

function ToolbarButton({
  label,
  active = false,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type='button'
      size='icon'
      variant='ghost'
      title={label}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        'size-8 shrink-0 text-muted-foreground hover:text-foreground',
        active && 'bg-accent text-accent-foreground'
      )}
    >
      {children}
    </Button>
  )
}

export type ArticleEditorInstance = ReturnType<typeof useCreateBlockNote>

export function ArticleEditor({
  initialContent,
  onChange,
  theme,
  heightClassName = 'max-h-[360px] min-h-[240px]',
  editorRef,
  readOnly = false,
}: {
  initialContent: PartialBlock[]
  onChange: (blocks: PartialBlock[]) => void
  theme: 'light' | 'dark'
  heightClassName?: string
  editorRef?: RefObject<ArticleEditorInstance | null>
  readOnly?: boolean
}) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  async function uploadImage(file: File) {
    try {
      const prepared = await inlineImageFile(file)
      const uploaded = await uploadsApi.image(prepared)
      return uploaded.url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '图片上传失败。')
      throw error
    }
  }

  const editor = useCreateBlockNote({
    initialContent,
    dictionary: zh,
    uploadFile: uploadImage,
  })

  useEffect(() => {
    if (!editorRef) return
    editorRef.current = editor
    return () => {
      if (editorRef.current === editor) editorRef.current = null
    }
  }, [editor, editorRef])

  const active = useEditorState({
    editor,
    selector: ({ editor }) => {
      const block = editor.getTextCursorPosition().block
      return {
        styles: editor.getActiveStyles(),
        blockType: block.type,
        blockLevel:
          block.type === 'heading'
            ? (block.props as { level?: number }).level
            : undefined,
      }
    },
  })

  function setBlockType(
    type: 'paragraph' | 'heading' | 'bulletListItem' | 'numberedListItem',
    level?: 1 | 2
  ) {
    const block = editor.getTextCursorPosition().block
    if (type === 'heading') {
      editor.updateBlock(block, { type, props: { level: level ?? 1 } })
      return
    }
    editor.updateBlock(block, { type })
  }

  async function insertImage(file: File | undefined) {
    if (!file || uploadingImage) return
    setUploadingImage(true)
    try {
      const url = await uploadImage(file)
      const block = editor.getTextCursorPosition().block
      editor.insertBlocks([{ type: 'image', props: { url } }], block, 'after')
    } catch {
      // uploadImage 已经提示错误，这里不再重复 toast。
    } finally {
      setUploadingImage(false)
    }
  }

  function addLink() {
    const url = window.prompt('输入链接地址')
    if (!url?.trim()) return
    editor.createLink(url.trim())
  }

  return (
    <div className='overflow-hidden rounded-md border'>
      {!readOnly && (
        <div
          role='toolbar'
          aria-label='富文本工具栏'
          className='flex flex-wrap items-center gap-0.5 border-b bg-muted/35 px-2 py-1.5'
        >
          <ToolbarButton
            label='正文'
            active={active.blockType === 'paragraph'}
            onClick={() => setBlockType('paragraph')}
          >
            <Pilcrow className='size-4' />
          </ToolbarButton>
          <ToolbarButton
            label='一级标题'
            active={active.blockType === 'heading' && active.blockLevel === 1}
            onClick={() => setBlockType('heading', 1)}
          >
            <Heading1 className='size-4' />
          </ToolbarButton>
          <ToolbarButton
            label='二级标题'
            active={active.blockType === 'heading' && active.blockLevel === 2}
            onClick={() => setBlockType('heading', 2)}
          >
            <Heading2 className='size-4' />
          </ToolbarButton>
          <ToolbarButton
            label='无序列表'
            active={active.blockType === 'bulletListItem'}
            onClick={() => setBlockType('bulletListItem')}
          >
            <List className='size-4' />
          </ToolbarButton>
          <ToolbarButton
            label='有序列表'
            active={active.blockType === 'numberedListItem'}
            onClick={() => setBlockType('numberedListItem')}
          >
            <ListOrdered className='size-4' />
          </ToolbarButton>
          <span aria-hidden='true' className='mx-1 h-5 w-px bg-border' />
          <ToolbarButton
            label='加粗'
            active={Boolean(active.styles.bold)}
            onClick={() => editor.toggleStyles({ bold: true })}
          >
            <Bold className='size-4' />
          </ToolbarButton>
          <ToolbarButton
            label='斜体'
            active={Boolean(active.styles.italic)}
            onClick={() => editor.toggleStyles({ italic: true })}
          >
            <Italic className='size-4' />
          </ToolbarButton>
          <ToolbarButton
            label='下划线'
            active={Boolean(active.styles.underline)}
            onClick={() => editor.toggleStyles({ underline: true })}
          >
            <Underline className='size-4' />
          </ToolbarButton>
          <ToolbarButton
            label='删除线'
            active={Boolean(active.styles.strike)}
            onClick={() => editor.toggleStyles({ strike: true })}
          >
            <Strikethrough className='size-4' />
          </ToolbarButton>
          <ToolbarButton
            label='行内代码'
            active={Boolean(active.styles.code)}
            onClick={() => editor.toggleStyles({ code: true })}
          >
            <Code className='size-4' />
          </ToolbarButton>
          <ToolbarButton label='插入链接' onClick={addLink}>
            <LinkIcon className='size-4' />
          </ToolbarButton>
          <ToolbarButton
            label={uploadingImage ? '图片上传中' : '插入图片'}
            onClick={() => imageInputRef.current?.click()}
          >
            {uploadingImage ? (
              <Loader2 className='size-4 animate-spin' />
            ) : (
              <ImagePlus className='size-4' />
            )}
          </ToolbarButton>
          <input
            ref={imageInputRef}
            type='file'
            accept='image/jpeg,image/png,image/webp'
            className='hidden'
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              void insertImage(file)
            }}
          />
          <span aria-hidden='true' className='mx-1 h-5 w-px bg-border' />
          <ToolbarButton label='撤销' onClick={() => editor.undo()}>
            <Undo2 className='size-4' />
          </ToolbarButton>
          <ToolbarButton label='重做' onClick={() => editor.redo()}>
            <Redo2 className='size-4' />
          </ToolbarButton>
        </div>
      )}
      <div className={`${heightClassName} overflow-y-auto pt-3`}>
        <BlockNoteView
          editor={editor}
          theme={theme}
          editable={!readOnly}
          formattingToolbar={false}
          onChange={() => onChange(editor.document)}
          className='min-h-[240px]'
        />
      </div>
    </div>
  )
}
