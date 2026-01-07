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
  error?: Error | null;
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
    const inView = useInView(ref, { once: true, margin: "-50px" });

    const springValue = useSpring(0, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    useEffect(() => {
        if (inView) {
            springValue.set(value);
        }
    }, [springValue, inView, value]);

    const displayValue = useRef<string>(formatCurrency(0, currency));

    useEffect(() => springValue.on("change", (latest) => {
        if (ref.current) {
            ref.current.textContent = formatCurrency(latest, currency);
        }
    }), [springValue, currency]);


    return <span ref={ref}>{displayValue.current}</span>;
}


export function StatCard({ title, value, icon: Icon, description, currency = 'USD', loading, error }: StatCardProps) {
  
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
        ) : error ? (
          <div className='space-y-2'>
              <div className="text-2xl font-bold text-destructive">-</div>
              <p className="text-xs text-destructive">Could not load data</p>
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
