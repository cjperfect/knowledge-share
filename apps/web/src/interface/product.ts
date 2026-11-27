import type { PartialBlock } from '@blocknote/core'

export type ProductTheme = 'navy' | 'blue' | 'amber' | 'sage'

export type Product = {
  id: string
  name: string
  /** 缩略图地址，支持 public 路径、远程 URL 或用户上传后的 data URL */
  thumbnail: string
  /** BlockNote 富文本，用于产品详情介绍与二次编辑 */
  document: PartialBlock[]
  contentMarkdown?: string
  theme: ProductTheme
  updatedAt: string
}

export type ProductInput = Pick<Product, 'name' | 'thumbnail' | 'document'> & {
  contentMarkdown?: string
}
