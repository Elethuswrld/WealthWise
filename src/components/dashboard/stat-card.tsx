'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useSpring, animated } from '@react-spring/web';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  description?: string;
  currency?: string;
  loading?: boolean;
}

const AnimatedNumber = ({ value, currency = 'USD' }: { value: number, currency?: string }) => {
    const { number } = useSpring({
      from: { number: 0 },
      to: { number: value },
      delay: 200,
      config: { mass: 1, tension: 20, friction: 10 },
    });
  
    return (
      <animated.div>
        {number.to((n) => 
            new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency,
            }).format(n)
        )}
      </animated.div>
    );
  };

export function StatCard({ title, value, icon: Icon, description, currency = 'USD', loading }: StatCardProps) {
  
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
                <div className="text-2xl font-bold">
                    <AnimatedNumber value={value} currency={currency} />
                </div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </>
        )}
      </CardContent>
    </Card>
  );
}
