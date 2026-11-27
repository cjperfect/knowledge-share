import type {
  PosterTemplate,
  PosterTemplateInput,
} from '@/interface/poster-template'
import { request } from '@/util/request'

export const posterTemplatesApi = {
  list: (signal?: AbortSignal) =>
    request<PosterTemplate[]>({ url: '/poster-templates', signal }),
  active: (signal?: AbortSignal) =>
    request<PosterTemplate | null>({
      url: '/poster-templates/active',
      authToken: null,
      signal,
    }),
  create: (data: PosterTemplateInput) =>
    request<PosterTemplate>({
      url: '/poster-templates',
      method: 'POST',
      data,
    }),
  update: (id: string, data: PosterTemplateInput) =>
    request<PosterTemplate>({
      url: `/poster-templates/${encodeURIComponent(id)}`,
      method: 'PATCH',
      data,
    }),
  enable: (id: string) =>
    request<PosterTemplate>({
      url: `/poster-templates/${encodeURIComponent(id)}/enable`,
      method: 'POST',
      data: {},
    }),
  remove: (id: string) =>
    request<null>({
      url: `/poster-templates/${encodeURIComponent(id)}`,
      method: 'DELETE',
    }),
}
