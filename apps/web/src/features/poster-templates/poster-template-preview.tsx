import { cn } from '@/util/utils'
import { ImageIcon } from 'lucide-react'

/** 模板预览只展示上传的海报底图，不叠加示例活动内容。 */
export function PosterTemplatePreview({
  image,
  className,
}: {
  image: string
  className?: string
}) {
  if (!image) {
    return (
      <div
        className={cn(
          'grid aspect-[3/4] w-full place-items-center rounded-xl border border-dashed bg-muted/30 px-5 text-center text-xs leading-5 text-muted-foreground',
          className
        )}
      >
        <span className='flex flex-col items-center gap-2'>
          <ImageIcon className='size-6' aria-hidden='true' />
          上传底图后在这里预览
        </span>
      </div>
    )
  }

  return (
    <img
      src={image}
      alt='海报模板底图预览'
      className={cn(
        'mx-auto block aspect-[3/4] w-full rounded-xl object-cover shadow-sm',
        className
      )}
    />
  )
}
