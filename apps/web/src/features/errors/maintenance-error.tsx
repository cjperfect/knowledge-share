import { Button } from '@/components/ui/button'

export function MaintenanceError() {
  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='text-[7rem] leading-tight font-bold'>503</h1>
        <span className='font-medium'>网站维护中</span>
        <p className='text-center text-muted-foreground'>
          网站暂时无法访问，请稍后回来。
        </p>
        <div className='mt-6 flex gap-4'>
          <Button variant='outline' onClick={() => window.location.reload()}>
            刷新页面
          </Button>
        </div>
      </div>
    </div>
  )
}
