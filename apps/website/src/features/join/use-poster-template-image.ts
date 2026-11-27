import { useEffect, useState } from 'react'

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    if (/^https?:\/\//.test(source)) image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图片加载失败'))
    image.src = source
  })
}

/** 异步加载模板背景图，并用 source 匹配避免旧图短暂残留。 */
export function usePosterTemplateImage(source: string | undefined) {
  const [loaded, setLoaded] = useState<{
    source: string
    image: HTMLImageElement
  }>()

  useEffect(() => {
    if (!source) return
    let cancelled = false
    loadImage(source)
      .then((image) => {
        if (!cancelled) setLoaded({ source, image })
      })
      .catch(() => {
        if (!cancelled) setLoaded(undefined)
      })
    return () => {
      cancelled = true
    }
  }, [source])

  if (!loaded || loaded.source !== source) return undefined
  return loaded.image
}
