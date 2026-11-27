import type { ActivityTrendRow } from '@/interface/home'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function ActivityTrend({ rows }: { rows: ActivityTrendRow[] }) {
  return (
    <Card className='min-w-0'>
      <CardHeader>
        <CardTitle>活动参加趋势</CardTitle>
        <CardDescription>按日查看活动参加人数。</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='h-[200px] min-w-0 sm:h-[220px]'>
          {rows.length > 0 ? (
            <ResponsiveContainer width='100%' height='100%' minWidth={0}>
              <BarChart
                data={rows}
                barCategoryGap='42%'
                margin={{ top: 4, right: 5, left: 0, bottom: 0 }}
                accessibilityLayer
              >
                <CartesianGrid
                  vertical={false}
                  stroke='var(--border)'
                  strokeDasharray='4 4'
                />
                <XAxis
                  dataKey='date'
                  tickFormatter={(value: string) =>
                    value.slice(5).replace('-', '/')
                  }
                  axisLine={false}
                  tickLine={false}
                  tickMargin={9}
                  stroke='var(--muted-foreground)'
                  fontSize={12}
                />
                <YAxis
                  allowDecimals={false}
                  width={34}
                  axisLine={false}
                  tickLine={false}
                  stroke='var(--muted-foreground)'
                  fontSize={12}
                />
                <Tooltip
                  cursor={{ fill: 'var(--muted)' }}
                  contentStyle={{
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: 'var(--popover-foreground)' }}
                  itemStyle={{ color: 'var(--popover-foreground)' }}
                />
                <Bar
                  dataKey='signups'
                  name='活动参加人数'
                  maxBarSize={36}
                  fill='var(--chart-1)'
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className='grid h-full place-items-center text-sm text-muted-foreground'>
              当前范围暂无记录
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
