import type { Product, ProductInput } from '@/interface/product'
import { request } from '@/util/request'

export const productsApi = {
  list: (signal?: AbortSignal) =>
    request<Product[]>({ url: '/products', signal }),
  create: (data: ProductInput) =>
    request<Product>({ url: '/products', method: 'POST', data }),
  update: (id: string, data: ProductInput) =>
    request<Product>({
      url: `/products/${encodeURIComponent(id)}`,
      method: 'PATCH',
      data,
    }),
  remove: (id: string) =>
    request<null>({
      url: `/products/${encodeURIComponent(id)}`,
      method: 'DELETE',
    }),
}
