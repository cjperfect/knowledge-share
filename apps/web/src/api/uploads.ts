import { request } from '@/util/request'

export type UploadedImage = {
  url: string
  path: string
  mimeType: string
  size: number
}

export const uploadsApi = {
  image: (file: File) => {
    const data = new FormData()
    data.append('file', file)
    return request<UploadedImage>({
      url: '/uploads/image',
      method: 'POST',
      data,
    })
  },
}
