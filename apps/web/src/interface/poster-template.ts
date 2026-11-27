export type PosterTemplate = {
  id: string
  name: string
  image: string
  enabled: boolean
  updatedAt: string
}

export type PosterTemplateInput = Pick<PosterTemplate, 'name' | 'image'>
