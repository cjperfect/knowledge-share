import type { ActivityPosterQr } from './types'

export const posterWidth = 1080
export const posterHeight = 1440

const fontFamily =
  '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif'
const ink = '#0f172a'
const margin = 88
const contentWidth = posterWidth - margin * 2

export interface PosterActivity {
  name: string
  sharer: string
  date: string
  summary: string
  price: number
}

export interface PosterRenderTemplate {
  image?: HTMLImageElement | null
}

const palette = {
  brand: '#bfdbfe',
  divider: 'rgba(255, 255, 255, 0.35)',
  title: '#f8fafc',
  summary: '#e2e8f0',
  text: '#f8fafc',
  muted: '#cbd5e1',
  accent: '#bfdbfe',
  qr: '#ffffff',
}

function drawCover(context: CanvasRenderingContext2D, image: HTMLImageElement) {
  const sourceRatio = image.width / image.height
  const targetRatio = posterWidth / posterHeight
  let sourceX = 0
  let sourceY = 0
  let sourceWidth = image.width
  let sourceHeight = image.height

  if (sourceRatio > targetRatio) {
    sourceWidth = image.height * targetRatio
    sourceX = (image.width - sourceWidth) / 2
  } else {
    sourceHeight = image.width / targetRatio
    sourceY = (image.height - sourceHeight) / 2
  }

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    posterWidth,
    posterHeight
  )
}

const dateFormat = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'short',
  timeZone: 'UTC',
})

function font(size: number, weight: number) {
  return `${weight} ${size}px ${fontFamily}`
}

function wrapText(
  context: CanvasRenderingContext2D,
  value: string,
  width: number
) {
  const lines: string[] = []
  let line = ''
  for (const character of value) {
    if (line && context.measureText(line + character).width > width) {
      lines.push(line.trimEnd())
      line = character.trimStart()
    } else {
      line += character
    }
  }
  if (line) lines.push(line)
  return lines
}

function fitText(
  context: CanvasRenderingContext2D,
  value: string,
  size: number,
  height: number,
  weight: number,
  width = contentWidth
) {
  let lines: string[]
  let lineHeight: number
  do {
    context.font = font(size, weight)
    lineHeight = Math.ceil(size * 1.23)
    lines = wrapText(context, value, width)
    size -= 2
  } while (lines.length * lineHeight > height)
  return { lines, lineHeight }
}

function shortInviter(name: string) {
  const characters = Array.from(name.trim())
  return characters.length > 14
    ? characters.slice(0, 14).join('') + '…'
    : characters.join('')
}

export function drawActivityPoster(
  context: CanvasRenderingContext2D,
  activity: PosterActivity,
  qr: ActivityPosterQr | undefined,
  inviter?: string,
  template?: PosterRenderTemplate
) {
  if (template?.image) {
    context.fillStyle = ink
    context.fillRect(0, 0, posterWidth, posterHeight)
    drawCover(context, template.image)
  } else {
    context.fillStyle = ink
    context.fillRect(0, 0, posterWidth, posterHeight)

    context.strokeStyle = '#28384f'
    context.lineWidth = 2
    for (let radius = 235; radius <= 515; radius += 40) {
      context.beginPath()
      context.arc(posterWidth + 65, 91, radius, 0, Math.PI * 2)
      context.stroke()
    }
  }

  const topShade = context.createLinearGradient(0, 0, 0, 820)
  topShade.addColorStop(0, 'rgba(8, 14, 26, 0.74)')
  topShade.addColorStop(0.55, 'rgba(8, 14, 26, 0.52)')
  topShade.addColorStop(1, 'rgba(8, 14, 26, 0)')
  context.fillStyle = topShade
  context.fillRect(0, 0, posterWidth, 820)

  const bottomShade = context.createLinearGradient(0, 780, 0, posterHeight)
  bottomShade.addColorStop(0, 'rgba(8, 14, 26, 0)')
  bottomShade.addColorStop(0.24, 'rgba(8, 14, 26, 0.62)')
  bottomShade.addColorStop(1, 'rgba(8, 14, 26, 0.9)')
  context.fillStyle = bottomShade
  context.fillRect(0, 780, posterWidth, posterHeight - 780)

  context.textBaseline = 'top'

  context.save()
  context.shadowColor = 'rgba(8, 14, 26, 0.55)'
  context.shadowBlur = 12
  context.shadowOffsetY = 2
  context.fillStyle = palette.brand
  context.font = font(42, 700)
  context.fillText('研途', margin, 88)
  context.font = font(27, 500)
  context.textAlign = 'right'
  context.fillText('保研知识分享', posterWidth - margin, 101)
  context.restore()
  context.textAlign = 'left'
  context.fillStyle = palette.divider
  context.fillRect(margin, 172, contentWidth, 2)
  context.fillStyle = palette.brand
  context.fillRect(margin, 237, 70, 6)

  const price = activity.price > 0 ? `¥${activity.price.toFixed(2)}` : '免费'
  context.save()
  context.textAlign = 'right'
  context.shadowColor = 'rgba(8, 14, 26, 0.65)'
  context.shadowBlur = 10
  context.shadowOffsetY = 1
  context.fillStyle = palette.muted
  context.font = font(22, 500)
  context.fillText('活动价格', posterWidth - margin, 196)
  context.fillStyle = '#fbbf24'
  context.font = font(40, 700)
  context.fillText(price, posterWidth - margin, 222, contentWidth)
  context.restore()
  context.textAlign = 'left'

  const title = fitText(context, activity.name, 96, 360, 700)
  const titleTop = 280 + (360 - title.lines.length * title.lineHeight) / 2
  context.save()
  context.shadowColor = 'rgba(8, 14, 26, 0.7)'
  context.shadowBlur = 18
  context.shadowOffsetY = 2
  context.fillStyle = palette.title
  title.lines.forEach((line, index) => {
    context.fillText(line, margin, titleTop + index * title.lineHeight)
  })
  context.restore()

  if (activity.summary) {
    context.font = font(30, 500)
    let summaryLines = wrapText(context, activity.summary, contentWidth)
    if (summaryLines.length > 4) {
      summaryLines = summaryLines.slice(0, 4)
      summaryLines[3] = summaryLines[3].replace(/。$/, '') + '…'
    }
    const summaryTop = titleTop + title.lines.length * title.lineHeight + 32
    context.save()
    context.shadowColor = 'rgba(8, 14, 26, 0.75)'
    context.shadowBlur = 12
    context.shadowOffsetY = 1
    context.fillStyle = palette.summary
    summaryLines.forEach((line, index) => {
      context.fillText(line, margin, summaryTop + index * 43)
    })
    context.restore()
  }

  if (inviter) {
    context.fillStyle = palette.accent
    context.font = font(28, 600)
    context.fillText(`专属邀请 · ${shortInviter(inviter)}`, margin, 926)
  }

  const detailOffset = inviter ? 14 : 0
  context.fillStyle = palette.muted
  context.font = font(28, 500)
  context.fillText('活动日期', margin, 966 + detailOffset)

  context.fillStyle = palette.text
  context.font = font(54, 700)
  const date = dateFormat.format(new Date(activity.date + 'T00:00:00Z'))
  const qrBox = 344
  const qrX = posterWidth - margin - qrBox
  const qrY = 956
  const detailsWidth = qrX - margin - 38
  context.fillText(date, margin, 1012 + detailOffset, detailsWidth)

  if (activity.sharer) {
    context.fillStyle = palette.divider
    context.fillRect(margin, 1108 + detailOffset, detailsWidth, 2)
    context.fillStyle = palette.muted
    context.font = font(28, 500)
    context.fillText('分享人', margin, 1150 + detailOffset)
    const sharer = fitText(context, activity.sharer, 56, 175, 700, detailsWidth)
    context.fillStyle = palette.text
    sharer.lines.forEach((line, index) => {
      context.fillText(
        line,
        margin,
        1201 + detailOffset + index * sharer.lineHeight
      )
    })
  }

  context.fillStyle = palette.qr
  context.fillRect(qrX, qrY, qrBox, qrBox)
  if (!qr) {
    context.fillStyle = palette.muted
    context.font = font(28, 500)
    context.textAlign = 'center'
    context.fillText('二维码暂未生成', qrX + qrBox / 2, qrY + qrBox / 2 - 14)
    context.textAlign = 'left'
    return
  }

  const modules = atob(qr.modules)
  const moduleSize = Math.floor(qrBox / (qr.size + 8))
  const qrPadding = Math.floor((qrBox - qr.size * moduleSize) / 2)
  context.fillStyle = '#000000'
  for (let row = 0; row < qr.size; row++) {
    for (let column = 0; column < qr.size; column++) {
      if (modules.charCodeAt(row * qr.size + column) === 1) {
        context.fillRect(
          qrX + qrPadding + column * moduleSize,
          qrY + qrPadding + row * moduleSize,
          moduleSize,
          moduleSize
        )
      }
    }
  }
  context.fillStyle = palette.text
  context.font = font(32, 600)
  context.textAlign = 'center'
  context.fillText('扫码报名', qrX + qrBox / 2, qrY + qrBox + 19)
  context.textAlign = 'left'
}
