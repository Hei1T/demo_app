import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import { useIsMobile } from '@/hooks/use-mobile';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export const description = '打开量趋势';

const chartConfig = {
  views: { label: '打开', color: 'var(--primary)' },
  users: { label: '新用户', color: 'var(--chart-2)' },
} satisfies ChartConfig;

export type ChartPoint = { date: string; views: number; users: number };

export function ChartAreaInteractive({
  data,
  range,
  onRangeChange,
}: {
  data: ChartPoint[];
  range: number;
  onRangeChange: (v: number) => void;
}) {
  const isMobile = useIsMobile();
  const [metric, setMetric] = React.useState<'views' | 'users'>('views');

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>打开趋势</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">每日名片被贴开次数 / 新增用户</span>
          <span className="@[540px]/card:hidden">打开量</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={String(range)}
            onValueChange={(v) => v && onRangeChange(Number(v))}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="7">7 天</ToggleGroupItem>
            <ToggleGroupItem value="30">30 天</ToggleGroupItem>
            <ToggleGroupItem value="90">90 天</ToggleGroupItem>
          </ToggleGroup>
          <Select value={String(range)} onValueChange={(v) => onRangeChange(Number(v))}>
            <SelectTrigger
              className="flex w-28 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="选择时间范围"
            >
              <SelectValue placeholder="30 天" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="7" className="rounded-lg">7 天</SelectItem>
              <SelectItem value="30" className="rounded-lg">30 天</SelectItem>
              <SelectItem value="90" className="rounded-lg">90 天</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-views)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-views)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-users)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-users)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" opacity={0.5} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(v: string) => v.slice(5)}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(v) => `日期 ${v}`}
                />
              }
            />
            <Area
              dataKey={metric}
              type="natural"
              fill={`url(#fill${metric === 'views' ? 'Views' : 'Users'})`}
              stroke={`var(--color-${metric})`}
              strokeWidth={2}
              isAnimationActive={!isMobile}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
