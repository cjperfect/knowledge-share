import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

const markdownSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'u'],
}

export function Markdown({
  content,
  variant = 'default',
}: {
  content: string
  variant?: 'default' | 'product'
}) {
  return (
    <div
      className={`text-[15px] leading-[1.78] text-ink-soft min-[821px]:text-[17px] [&_h2]:mt-[38px] [&_h2]:mb-[14px] [&_h2]:text-[30px] [&_h2]:leading-[1.15] [&_h2]:tracking-[-0.05em] [&_h2]:text-ink min-[821px]:[&_h2]:mt-[50px] min-[821px]:[&_h2]:mb-[18px] min-[821px]:[&_h2]:text-[36px] [&_h3]:mt-[34px] [&_h3]:mb-3.5 [&_h3]:text-[25px] [&_h3]:leading-[1.2] [&_h3]:tracking-[-0.045em] [&_h3]:text-ink min-[821px]:[&_h3]:mt-11 min-[821px]:[&_h3]:text-[29px] [&_p]:mt-3.5 [&_p+p]:mt-[18px] [&_a]:text-blue [&_a]:underline [&_a]:underline-offset-[3px] [&_strong]:font-semibold [&_strong]:text-ink [&_blockquote]:my-[30px] [&_blockquote]:rounded-r-[16px] [&_blockquote]:border-l-[3px] [&_blockquote]:border-[#17385c] [&_blockquote]:bg-[#eef3fb] [&_blockquote]:px-[26px] [&_blockquote]:py-[22px] [&_blockquote]:text-[18px] [&_blockquote]:leading-[1.6] [&_blockquote]:text-ink [&_ul]:mt-[18px] [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mt-[18px] [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mt-2 [&_li_p]:mt-0 [&_li_p+p]:mt-2 [&_code]:rounded-[5px] [&_code]:bg-[#eef3fb] [&_code]:px-[5px] [&_code]:py-0.5 [&_code]:text-[0.92em] [&_code]:text-ink [&_pre]:mt-[22px] [&_pre]:overflow-x-auto [&_pre]:rounded-[12px] [&_pre]:bg-[#eef3fb] [&_pre]:px-5 [&_pre]:py-[18px] [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_hr]:my-[42px] [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-line [&_img]:my-6 [&_img]:rounded-[16px] [&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_table]:text-[14px] [&_th]:border [&_th]:border-line [&_th]:bg-soft [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_td]:border [&_td]:border-line [&_td]:px-3 [&_td]:py-2 ${
        variant === 'product'
          ? '[&>p:first-of-type]:mb-[36px] [&>p:first-of-type]:border-b [&>p:first-of-type]:border-line [&>p:first-of-type]:pb-[30px] [&>p:first-of-type]:text-[24px] [&>p:first-of-type]:leading-[1.46] [&>p:first-of-type]:tracking-[-0.04em] [&>p:first-of-type]:text-ink min-[821px]:[&>p:first-of-type]:mb-11 min-[821px]:[&>p:first-of-type]:pb-9 min-[821px]:[&>p:first-of-type]:text-[28px]'
          : ''
      }`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSchema]]}
        components={{ h1: 'h2' }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
