import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  description?: string;
  currency?: string;
  loading?: boolean;
}

export function StatCard({ title, value, icon: Icon, description, currency = 'USD', loading }: StatCardProps) {
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="space-y-2">
                <Skeleton className='h-8 w-3/4' />
                <Skeleton className='h-4 w-1/2' />
            </div>
        ) : (
            <>
                <div className="text-2xl font-bold">{formattedValue}</div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </>
        )}
      </CardContent>
    </Card>
  );
}
