export const posterTemplateWidth = 1080
export const posterTemplateHeight = 1440
const maxSourceSize = 12 * 1024 * 1024

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    if (/^https?:\/\//.test(source)) image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图片加载失败'))
    image.src = source
  })
}

/** 将上传图片居中裁成 3:4 并压到 1080×1440，保证和海报画布尺寸一致。 */
export async function posterTemplateFile(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('请选择图片文件。')
  }
  if (file.size > maxSourceSize) {
    throw new Error('图片不能超过 12MB。')
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await loadImage(objectUrl)
    const canvas = document.createElement('canvas')
    canvas.width = posterTemplateWidth
    canvas.height = posterTemplateHeight
    const context = canvas.getContext('2d')
    if (!context) throw new Error('当前浏览器无法处理图片。')

    const sourceRatio = image.width / image.height
    const targetRatio = posterTemplateWidth / posterTemplateHeight
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
      posterTemplateWidth,
      posterTemplateHeight
    )

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
    const blob = await (await fetch(dataUrl)).blob()
    const name = file.name.replace(/\.[^.]+$/, '') || 'poster-template'
    return new File([blob], `${name}.jpg`, { type: 'image/jpeg' })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
