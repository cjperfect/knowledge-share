import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Product, ProductInput } from '@/interface/product'
import { Package, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { productsApi } from '@/api/products'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Main } from '@/components/layout/main'
import { OperationsLayout } from '@/components/layout/operations-layout'
import { PageHeader } from '@/components/layout/page-header'
import { ProductFormDialog } from './product-form-dialog'
import { productExcerpt, productThemes } from './products'

function DeleteProductButton({
  product,
  onDelete,
}: {
  product: Product
  onDelete: (product: Product) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type='button'
          className='text-xs font-normal text-destructive transition-colors hover:text-destructive/80'
        >
          删除
        </button>
      </PopoverTrigger>
      <PopoverContent
        align='end'
        aria-label='删除产品确认'
        onInteractOutside={(event) => event.preventDefault()}
        className='w-72 space-y-3'
      >
        <div className='space-y-1.5'>
          <p className='font-medium'>删除产品？</p>
          <p className='text-sm break-words text-muted-foreground'>
            「{product.name}」将从产品列表中移除。
          </p>
        </div>
        <div className='flex justify-end gap-2'>
          <Button
            type='button'
            size='sm'
            variant='outline'
            onClick={() => setOpen(false)}
          >
            取消
          </Button>
          <Button
            type='button'
            size='sm'
            variant='destructive'
            disabled={deleting}
            onClick={async () => {
              setDeleting(true)
              try {
                await onDelete(product)
                setOpen(false)
              } catch (error) {
                toast.error(
                  error instanceof Error ? error.message : '删除产品失败。'
                )
              } finally {
                setDeleting(false)
              }
            }}
          >
            确认删除
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function Products() {
  const queryClient = useQueryClient()
  const products = useQuery({
    queryKey: ['products'],
    queryFn: ({ signal }) => productsApi.list(signal),
  })
  const rows = products.data ?? []
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  function beginCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function beginEdit(product: Product) {
    setEditing(product)
    setFormOpen(true)
  }

  async function handleSave(input: ProductInput) {
    const product = editing
      ? await productsApi.update(editing.id, input)
      : await productsApi.create(input)
    void queryClient.invalidateQueries({ queryKey: ['products'] })
    toast.success(`「${product.name}」已${editing ? '更新' : '新增'}`)
    setFormOpen(false)
    setEditing(null)
  }

  async function handleDelete(product: Product) {
    await productsApi.remove(product.id)
    await queryClient.invalidateQueries({ queryKey: ['products'] })
    toast.success(`「${product.name}」已删除`)
  }

  return (
    <OperationsLayout title='产品列表'>
      <Main className='mx-auto w-full max-w-7xl min-w-0 space-y-5 sm:px-6 lg:px-8'>
        <PageHeader
          title='产品列表'
          actions={
            <Button onClick={beginCreate}>
              <Plus aria-hidden='true' />
              新增产品
            </Button>
          }
        />

        {products.isPending ? (
          <p role='status' className='p-5 text-sm text-muted-foreground'>
            正在加载产品…
          </p>
        ) : products.isError ? (
          <div className='flex items-center gap-2 p-5'>
            <p role='alert' className='text-sm text-destructive'>
              {products.error.message}
            </p>
            <Button variant='outline' onClick={() => products.refetch()}>
              重试
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <div className='grid min-h-64 place-items-center rounded-xl border border-dashed bg-muted/20 px-6 text-center'>
            <div className='space-y-3'>
              <Package className='mx-auto size-8 text-muted-foreground' />
              <div>
                <p className='font-medium'>还没有产品</p>
                <p className='mt-1 text-sm text-muted-foreground'>
                  新增后可以继续编辑缩略图和详情。
                </p>
              </div>
              <Button size='sm' onClick={beginCreate}>
                <Plus aria-hidden='true' />
                新增第一个产品
              </Button>
            </div>
          </div>
        ) : (
          <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
            {rows.map((product) => {
              const theme = productThemes[product.theme]
              return (
                <Card
                  key={product.id}
                  className='group h-full gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md'
                >
                  <div
                    className={`relative aspect-[16/9] overflow-hidden border-b ${theme.cover}`}
                  >
                    {product.thumbnail && (
                      <img
                        src={product.thumbnail}
                        alt={`${product.name}缩略图`}
                        className='size-full object-cover'
                      />
                    )}
                    {!product.thumbnail && (
                      <div className='grid size-full place-items-center text-muted-foreground'>
                        <Package className='size-8 opacity-40' />
                      </div>
                    )}
                    <span
                      className={`absolute inset-x-0 bottom-0 h-1 ${theme.line}`}
                      aria-hidden='true'
                    />
                  </div>

                  <CardContent className='flex flex-1 flex-col gap-3 p-5'>
                    <div className='space-y-1.5'>
                      <h2 className='text-xl font-semibold tracking-tight'>
                        {product.name}
                      </h2>
                      <p className='line-clamp-3 text-sm leading-6 text-muted-foreground'>
                        {productExcerpt(product)}
                      </p>
                    </div>

                    <div className='mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-4 text-xs'>
                      <button
                        type='button'
                        className='font-normal text-muted-foreground transition-colors hover:text-foreground'
                        onClick={() => beginEdit(product)}
                      >
                        编辑
                      </button>
                      <DeleteProductButton
                        product={product}
                        onDelete={handleDelete}
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </Main>

      {formOpen && (
        <ProductFormDialog
          key={editing?.id ?? 'new'}
          open
          product={editing}
          onOpenChange={(open) => {
            setFormOpen(open)
            if (!open) setEditing(null)
          }}
          onSave={handleSave}
        />
      )}
    </OperationsLayout>
  )
}
