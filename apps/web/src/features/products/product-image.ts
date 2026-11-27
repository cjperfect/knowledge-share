export const thumbnailWidth = 960
export const thumbnailHeight = 540
const maxSourceSize = 8 * 1024 * 1024

export function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    if (/^https?:\/\//.test(source)) image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图片加载失败'))
    image.src = source
  })
}

/** 将上传图片居中裁成 16:9 并压缩，避免 localStorage 被原图撑满 */
export async function fileToThumbnail(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('请选择图片文件。')
  }
  if (file.size > maxSourceSize) {
    throw new Error('图片不能超过 8MB。')
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await loadImage(objectUrl)
    const canvas = document.createElement('canvas')
    canvas.width = thumbnailWidth
    canvas.height = thumbnailHeight
    const context = canvas.getContext('2d')
    if (!context) throw new Error('当前浏览器无法处理图片。')

    const sourceRatio = image.width / image.height
    const targetRatio = thumbnailWidth / thumbnailHeight
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
      thumbnailWidth,
      thumbnailHeight
    )

    return canvas.toDataURL('image/jpeg', 0.84)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

/** 转成体积受控的 JPEG 文件，供上传接口使用。 */
export async function thumbnailFile(file: File) {
  const dataUrl = await fileToThumbnail(file)
  const blob = await (await fetch(dataUrl)).blob()
  const name = file.name.replace(/\.[^.]+$/, '') || 'image'
  return new File([blob], `${name}.jpg`, { type: 'image/jpeg' })
}
