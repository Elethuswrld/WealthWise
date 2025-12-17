'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { motion, useInView, useSpring } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  description?: string;
  currency?: string;
  loading?: boolean;
}

const formatCurrency = (value: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
    }).format(value);
};

function AnimatedNumber({ value, currency }: { value: number; currency?: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });

    const { number } = useSpring(0, {
        from: 0,
        to: inView ? value : 0,
        config: { duration: 1000 },
    });

    useEffect(() => {
        if (inView) {
            number.set(value);
        }
    }, [number, inView, value]);

    const BRL = (val: number) =>
        `${formatCurrency(val, currency).replace(/(\D+)/, '$1 ')}`;

    return <motion.span ref={ref}>{BRL(value)}</motion.span>;
}


export function StatCard({ title, value, icon: Icon, description, currency = 'USD', loading }: StatCardProps) {
  
  return (
    <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300 }}
    >
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
    </motion.div>
  );
}