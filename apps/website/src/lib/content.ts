import { cache } from 'react'

export type ProductTheme = 'navy' | 'blue' | 'amber' | 'sage'

export type InlineContent =
  | string
  | {
      type?: string
      text?: string
      href?: string
      content?: InlineContent[]
      styles?: Record<string, boolean>
    }

export type ContentBlock = {
  id?: string
  type?: string
  props?: {
    level?: number
    textAlignment?: string
    backgroundColor?: string
    textColor?: string
  }
  content?: InlineContent | InlineContent[]
  children?: ContentBlock[]
}

export type Product = {
  id: string
  name: string
  thumbnail: string
  document: ContentBlock[]
  contentMarkdown?: string
  theme: ProductTheme
  updatedAt: string
}

export type InviteReward = {
  name: string
  phone: string
  inviteCount: number
  commission: number
}

export type Activity = {
  id: string
  name: string
  sharer: string
  date: string
  summary: string
  price: number
  status?: 'not_started' | 'ended' | 'pushed'
  thumbnail?: string
  signupCount: number
  content?: ContentBlock[]
  contentMarkdown?: string
}

export function isActivityEnded(status?: Activity['status']) {
  return status === 'ended' || status === 'pushed'
}

export function activityPriceLabel(price: number) {
  return price > 0 ? `¥${price.toFixed(2)}` : '免费'
}

type ApiEnvelope<T> = {
  code?: number
  data?: T
}

const API_BASE = (
  process.env.WEBSITE_API_BASE_URL ?? 'http://127.0.0.1:3001'
).replace(/\/$/, '')
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const themes: ProductTheme[] = ['navy', 'blue', 'amber', 'sage']
const PLACEHOLDER_BANNER = '/images/banner-placeholder.svg'

async function readApi<T>(path: string): Promise<T | undefined> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(4_000),
      headers: { accept: 'application/json' },
    })
    if (!response.ok) return undefined
    const body = (await response.json()) as ApiEnvelope<T>
    if (body.code !== 200) return undefined
    return body.data
  } catch {
    return undefined
  }
}

function isTheme(value: unknown): value is ProductTheme {
  return typeof value === 'string' && themes.includes(value as ProductTheme)
}

function blockList(value: unknown): ContentBlock[] {
  return Array.isArray(value) ? (value as ContentBlock[]) : []
}

function normalizeProduct(value: Product, index: number): Product {
  return {
    id: String(value.id),
    name: String(value.name ?? '研途产品'),
    thumbnail:
      typeof value.thumbnail === 'string' && value.thumbnail.trim()
        ? value.thumbnail
        : PLACEHOLDER_BANNER,
    document: blockList(value.document),
    contentMarkdown:
      typeof value.contentMarkdown === 'string'
        ? value.contentMarkdown
        : undefined,
    theme: isTheme(value.theme) ? value.theme : themes[index % themes.length],
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : '',
  }
}

function normalizeActivity(value: Activity): Activity {
  return {
    id: String(value.id),
    name: String(value.name ?? '研途活动'),
    sharer: String(value.sharer ?? '研途'),
    date: String(value.date ?? ''),
    summary: String(value.summary ?? ''),
    price: Number.isFinite(Number(value.price))
      ? Math.max(0, Number(value.price))
      : 0,
    status:
      value.status === 'ended' || value.status === 'pushed'
        ? value.status
        : 'not_started',
    thumbnail:
      typeof value.thumbnail === 'string' && value.thumbnail.trim()
        ? value.thumbnail
        : undefined,
    signupCount: Number.isFinite(Number(value.signupCount))
      ? Number(value.signupCount)
      : 0,
    content: blockList(value.content),
    contentMarkdown:
      typeof value.contentMarkdown === 'string'
        ? value.contentMarkdown
        : undefined,
  }
}

function firstMarkdownImage(markdown: string | undefined) {
  if (!markdown) return undefined
  const match = markdown.match(/!\[[^\]]*\]\(\s*(<[^>]+>|[^\s)]+)/)
  if (!match) return undefined
  return match[1].replace(/^<|>$/g, '')
}

export function activityBanner(activity: Activity) {
  return (
    activity.thumbnail?.trim() ||
    firstMarkdownImage(activity.contentMarkdown) ||
    PLACEHOLDER_BANNER
  )
}

function paragraph(content: string): ContentBlock {
  return { type: 'paragraph', content }
}

function heading(content: string): ContentBlock {
  return { type: 'heading', props: { level: 3 }, content }
}

function bullet(content: string): ContentBlock {
  return { type: 'bulletListItem', content }
}

const fallbackProducts: Product[] = [
  {
    id: 'positioning',
    name: '保研定位诊断',
    thumbnail: '/images/products/positioning.jpg',
    theme: 'navy',
    updatedAt: '2026-11-24',
    document: [
      paragraph(
        '结合成绩、科研、竞赛和目标院校，梳理冲刺、稳妥、保底三档选择，给出接下来 30 天的行动顺序。'
      ),
      heading('你会得到'),
      bullet('一份按梯度排列的院校清单，标出冲刺、稳妥和保底档。'),
      bullet('逐项诊断当前材料，明确最值得补的短板。'),
      bullet('一张 30 天行动表，把选校、材料和联系导师排进日程。'),
      heading('适合谁'),
      paragraph('正在准备夏令营或预推免，但不确定该冲哪里、先补什么的同学。'),
    ],
  },
  {
    id: 'camp-kit',
    name: '夏令营资料包',
    thumbnail: '/images/products/camp-kit.jpg',
    theme: 'blue',
    updatedAt: '2026-11-23',
    document: [
      paragraph(
        '个人陈述、简历、推荐信和联系导师邮件模板，附填写示例、命名规范与提交前检查清单。'
      ),
      heading('资料包含'),
      bullet('4 类申请材料模板，可直接复制后按自己的经历修改。'),
      bullet('每类材料附一段填写示例，标出常见空话和低效表达。'),
      bullet('院校投递命名规范与提交前 12 项检查清单。'),
      heading('使用方式'),
      paragraph('建议先读示例，再按模板整理自己的项目、课程和科研经历。'),
    ],
  },
  {
    id: 'interview',
    name: '保研面试模拟',
    thumbnail: '/images/products/interview.jpg',
    theme: 'amber',
    updatedAt: '2026-11-22',
    document: [
      paragraph(
        '按目标院校常见题型进行 30 分钟仿真面试，结束后逐题复盘表达结构、追问应对和时间控制。'
      ),
      heading('模拟流程'),
      bullet('自我介绍与经历追问，先把最容易被问住的点暴露出来。'),
      bullet('专业题和开放题，练习在有限时间里搭出回答框架。'),
      bullet('反向提问与结束表达，留下清晰、稳定的最后印象。'),
      heading('你会得到'),
      paragraph('一份逐题复盘记录，标出表达冗余、逻辑跳跃和需要补证据的地方。'),
    ],
  },
  {
    id: 'document',
    name: '个人陈述精修',
    thumbnail: '/images/products/document.jpg',
    theme: 'sage',
    updatedAt: '2026-11-21',
    document: [
      paragraph(
        '围绕目标专业逐句修改个人陈述与简历，压缩空话，补足项目细节、个人贡献和最终结果。'
      ),
      heading('修改重点'),
      bullet('重排段落顺序，让开头先说明方向，再展开证据。'),
      bullet('逐句删掉空泛形容词，换成可验证的动作和结果。'),
      bullet('统一简历与个人陈述里的项目表述，避免前后矛盾。'),
      heading('交付方式'),
      paragraph('提交初稿后先给一版逐句批注，再根据你的补充完成一次返修。'),
    ],
  },
]

const fallbackActivities: Activity[] = [
  {
    id: 'camp-positioning',
    name: '夏令营前的最后一次定位：院校梯度怎么排',
    sharer: '林晓',
    date: '2026-12-05',
    price: 0,
    summary:
      '用一份真实的成绩单和项目清单，拆解冲刺、稳妥、保底三档院校，并把接下来 30 天该做的事排进日历。',
    signupCount: 128,
  },
  {
    id: 'statement-workshop',
    name: '个人陈述工作坊：把经历写成证据',
    sharer: '周屿',
    date: '2026-12-12',
    price: 0,
    summary:
      '从开头、主体到结尾逐段拆解个人陈述，现场改写三段常见表达，让项目、贡献和结果都能被看见。',
    signupCount: 86,
  },
  {
    id: 'interview-night',
    name: '面试模拟夜：30 分钟，把表达练顺',
    sharer: '陈默',
    date: '2026-12-19',
    price: 0,
    summary:
      '完整走一遍自我介绍、经历追问和开放题，现场给出逐题复盘，找出表达里最容易被忽略的断点。',
    signupCount: 64,
  },
  {
    id: 'pre-recommend-review',
    name: '从双非到 985：我的预推免复盘',
    sharer: '许知',
    date: '2026-11-14',
    price: 0,
    summary:
      '复盘选校、材料准备和面试时间线，讲清楚哪些动作真正改变了结果，哪些只是让自己更焦虑。',
    signupCount: 203,
  },
  {
    id: 'research-story',
    name: '科研经历怎么讲，才不像念简历',
    sharer: '沈言',
    date: '2026-10-31',
    price: 0,
    summary:
      '把科研经历拆成背景、问题、行动和结果四段，练习在不同追问下保持同一条清晰的叙事线。',
    signupCount: 156,
  },
]

type ActivityPage = {
  items: Activity[]
  page: number
  pageSize: number
  total: number
}

export const getProducts = cache(async (): Promise<Product[]> => {
  const remote = await readApi<Product[]>('/products')
  if (!remote) return fallbackProducts
  return remote.map(normalizeProduct)
})

export const getProductById = cache(
  async (id: string): Promise<Product | undefined> => {
    const products = await getProducts()
    const product = products.find((item) => item.id === id)
    if (product) return product

    if (!uuidPattern.test(id)) {
      return fallbackProducts.find((item) => item.id === id)
    }

    const remote = await readApi<Product>(`/products/${encodeURIComponent(id)}`)
    if (!remote) return fallbackProducts.find((item) => item.id === id)
    return normalizeProduct(remote, 0)
  }
)

export const getInviteRewards = cache(async (): Promise<InviteReward[]> => {
  const remote = await readApi<{ items?: InviteReward[] }>(
    '/public/site/invite-rewards'
  )
  return (remote?.items ?? []).map((item) => ({
    name: String(item.name ?? '匿名邀请人'),
    phone: String(item.phone ?? '***'),
    inviteCount: Number.isFinite(Number(item.inviteCount))
      ? Number(item.inviteCount)
      : 0,
    commission: Number.isFinite(Number(item.commission))
      ? Number(item.commission)
      : 0,
  }))
})

export const getActivities = cache(async (): Promise<Activity[]> => {
  const remote = await readApi<ActivityPage>(
    '/activities?page=1&pageSize=50&status=ended'
  )
  if (!remote) return fallbackActivities
  return (remote.items ?? []).map(normalizeActivity)
})

export const getActivityById = cache(
  async (id: string): Promise<Activity | undefined> => {
    if (!/^[1-9]\d*$/.test(id)) {
      return (
        fallbackActivities.find((item) => item.id === id) ??
        (await getActivities()).find((item) => item.id === id)
      )
    }

    const remote = await readApi<Activity>(
      `/activities/${encodeURIComponent(id)}?status=ended`
    )
    if (remote) return normalizeActivity(remote)

    const activities = await getActivities()
    return (
      activities.find((item) => item.id === id) ??
      fallbackActivities.find((item) => item.id === id)
    )
  }
)

export function inlineText(
  content: InlineContent | InlineContent[] | undefined
): string {
  if (!content) return ''
  if (typeof content === 'string') return content
  const items = Array.isArray(content) ? content : [content]
  return items
    .map((item) => {
      if (!item) return ''
      if (typeof item === 'string') return item
      if (item.text) return item.text
      if (item.content) return inlineText(item.content)
      return ''
    })
    .join('')
}

export function productLead(product: Product): string {
  const firstParagraph = product.document.find(
    (block) => block.type === 'paragraph' && inlineText(block.content).trim()
  )
  return inlineText(firstParagraph?.content ?? product.document[0]?.content)
    .replace(/\s+/g, ' ')
    .trim()
}

export function productExcerpt(product: Product, maxLength = 96): string {
  const firstParagraph = product.document.find(
    (block) => block.type === 'paragraph' && inlineText(block.content).trim()
  )
  const text = inlineText(
    firstParagraph?.content ?? product.document[0]?.content
  )
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text
}
