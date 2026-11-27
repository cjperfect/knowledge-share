const maxSourceSize = 40 * 1024 * 1024
const maxInlineDimension = 1600
const keepOriginalBelow = 3 * 1024 * 1024

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图片加载失败'))
    image.src = source
  })
}

/**
 * 富文本图片上传前处理：保留比例，把长边缩到 1600px 内；
 * 小图直接原样上传，避免截图和透明图被无谓重编码。
 */
export async function inlineImageFile(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('请选择图片文件。')
  }
  if (file.size > maxSourceSize) {
    throw new Error('图片不能超过 40MB。')
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await loadImage(objectUrl)
    if (image.width * image.height > 40_000_000) {
      throw new Error('图片尺寸过大，请压缩后再上传。')
    }
    if (
      file.size <= keepOriginalBelow &&
      image.width <= maxInlineDimension &&
      image.height <= maxInlineDimension
    ) {
      return file
    }

    const scale = Math.min(
      1,
      maxInlineDimension / Math.max(image.width, image.height)
    )
    const width = Math.max(1, Math.round(image.width * scale))
    const height = Math.max(1, Math.round(image.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('当前浏览器无法处理图片。')
    context.drawImage(image, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.86)
    )
    if (!blob) throw new Error('图片压缩失败。')

    const extension = blob.type === 'image/webp' ? 'webp' : 'png'
    const name = file.name.replace(/\.[^.]+$/, '') || 'image'
    return new File([blob], `${name}.${extension}`, { type: blob.type })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
