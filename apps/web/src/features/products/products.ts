import type { Product, ProductTheme } from '@/interface/product'
import type { PartialBlock } from '@blocknote/core'

function paragraph(content: string): PartialBlock {
  return { type: 'paragraph', content }
}

function heading(content: string): PartialBlock {
  return { type: 'heading', props: { level: 3 }, content }
}

function bullet(content: string): PartialBlock {
  return { type: 'bulletListItem', content }
}

const positioningDetail: PartialBlock[] = [
  paragraph(
    '结合成绩、科研、竞赛和目标院校，梳理冲刺、稳妥、保底三档选择，给出接下来 30 天的行动顺序。'
  ),
  heading('你会得到'),
  bullet('一份按梯度排列的院校清单，标出冲刺、稳妥和保底档。'),
  bullet('逐项诊断当前材料，明确最值得补的短板。'),
  bullet('一张 30 天行动表，把选校、材料和联系导师排进日程。'),
  heading('适合谁'),
  paragraph(
    '正在准备夏令营或预推免，但不确定该冲哪里、先补什么的同学。咨询前会先收集你的成绩、经历和目标，再一起拆解。'
  ),
]

const campKitDetail: PartialBlock[] = [
  paragraph(
    '个人陈述、简历、推荐信和联系导师邮件模板，附填写示例、命名规范与提交前检查清单。'
  ),
  heading('资料包含'),
  bullet('4 类申请材料模板，可直接复制后按自己的经历修改。'),
  bullet('每类材料附一段填写示例，标出常见空话和低效表达。'),
  bullet('院校投递命名规范与提交前 12 项检查清单。'),
  heading('使用方式'),
  paragraph(
    '建议先读示例，再按模板整理自己的项目、课程和科研经历。所有文件都可以按目标院校要求继续调整。'
  ),
]

const interviewDetail: PartialBlock[] = [
  paragraph(
    '按目标院校常见题型进行 30 分钟仿真面试，结束后逐题复盘表达结构、追问应对和时间控制。'
  ),
  heading('模拟流程'),
  bullet('自我介绍与经历追问，先把最容易被问住的点暴露出来。'),
  bullet('专业题和开放题，练习在有限时间里搭出回答框架。'),
  bullet('反向提问与结束表达，留下清晰、稳定的最后印象。'),
  heading('你会得到'),
  paragraph(
    '一份逐题复盘记录，标出表达冗余、逻辑跳跃和需要补证据的地方；附下一次练习的建议顺序。'
  ),
]

const documentDetail: PartialBlock[] = [
  paragraph(
    '围绕目标专业逐句修改个人陈述与简历，压缩空话，补足项目细节、个人贡献和最终结果。'
  ),
  heading('修改重点'),
  bullet('重排段落顺序，让开头先说明方向，再展开证据。'),
  bullet('逐句删掉空泛形容词，换成可验证的动作和结果。'),
  bullet('统一简历与个人陈述里的项目表述，避免前后矛盾。'),
  heading('交付方式'),
  paragraph(
    '提交初稿后先给一版逐句批注，再根据你的补充完成一次返修。修改过程保留批注，方便你理解为什么这样改。'
  ),
]

export const products: Product[] = [
  {
    id: 'positioning',
    name: '保研定位诊断',
    thumbnail: '/images/products/positioning.jpg',
    document: positioningDetail,
    theme: 'navy',
    updatedAt: '2026-11-24',
  },
  {
    id: 'camp-kit',
    name: '夏令营资料包',
    thumbnail: '/images/products/camp-kit.jpg',
    document: campKitDetail,
    theme: 'blue',
    updatedAt: '2026-11-23',
  },
  {
    id: 'interview',
    name: '保研面试模拟',
    thumbnail: '/images/products/interview.jpg',
    document: interviewDetail,
    theme: 'amber',
    updatedAt: '2026-11-22',
  },
  {
    id: 'document',
    name: '个人陈述精修',
    thumbnail: '/images/products/document.jpg',
    document: documentDetail,
    theme: 'sage',
    updatedAt: '2026-11-21',
  },
]

export const productThemes: Record<
  ProductTheme,
  {
    cover: string
    line: string
    hex: string
    soft: string
  }
> = {
  navy: {
    cover: 'bg-[linear-gradient(135deg,#eef3fb_0%,#dfe9f7_52%,#cfdcf0_100%)]',
    line: 'bg-[#17385c]',
    hex: '#17385c',
    soft: '#e7eff9',
  },
  blue: {
    cover: 'bg-[linear-gradient(135deg,#edf6ff_0%,#dbeafe_55%,#bfdbfe_100%)]',
    line: 'bg-[#2563eb]',
    hex: '#2563eb',
    soft: '#e8f2ff',
  },
  amber: {
    cover: 'bg-[linear-gradient(135deg,#fff8ea_0%,#fdf0cf_55%,#f7dfaa_100%)]',
    line: 'bg-[#b07a24]',
    hex: '#9a6a1f',
    soft: '#fbf1db',
  },
  sage: {
    cover: 'bg-[linear-gradient(135deg,#eef8f3_0%,#dcf1e6_55%,#c6e6d7_100%)]',
    line: 'bg-[#2f6f58]',
    hex: '#2f6f58',
    soft: '#e9f5ef',
  },
}

function blockText(block: PartialBlock) {
  const content = (block as { content?: unknown }).content
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content
    .map((item) => {
      if (!item || typeof item !== 'object' || !('text' in item)) return ''
      return String((item as { text?: string }).text ?? '')
    })
    .join('')
}

export function documentText(document: PartialBlock[]) {
  return document.map(blockText).filter(Boolean).join('\n')
}

export function productExcerpt(product: Product, maxLength = 96) {
  const firstParagraph = product.document.find(
    (block) => block.type === 'paragraph' && blockText(block).trim()
  )
  const text = blockText(firstParagraph ?? product.document[0] ?? {})
    .replace(/\s+/g, ' ')
    .trim()
  return text.slice(0, maxLength)
}
