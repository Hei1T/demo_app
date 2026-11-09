import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export type Kpi = {
  label: string;
  value: string;
  delta: number | null;
  hint: string;
};

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  const up = delta >= 0;
  return (
    <Badge variant="outline">
      {up ? <IconTrendingUp /> : <IconTrendingDown />}
      {up ? '+' : ''}
      {delta}%
    </Badge>
  );
}

export function SectionCards({ items }: { items: Kpi[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {items.map((k) => (
        <Card key={k.label} className="@container/card">
          <CardHeader>
            <CardDescription>{k.label}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {k.value}
            </CardTitle>
            <CardAction>
              <DeltaBadge delta={k.delta} />
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">{k.hint}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
