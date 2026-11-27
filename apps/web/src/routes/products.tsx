import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/util/require-admin'
import { Products } from '@/features/products/product-list'

export const Route = createFileRoute('/products')({
  beforeLoad: ({ location }) => requireAdmin(location.href),
  component: Products,
})
