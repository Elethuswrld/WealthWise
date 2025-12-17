'use client';

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction } from '@/lib/types';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';
import { calculateMonthlyPerformance } from '@/lib/finance';
import EmptyState from '../empty-state';
import { LineChart as LineChartIcon } from 'lucide-react';


interface PerformanceChartProps {
  transactions: Transaction[] | null;
}

const resolveChartTheme = (theme: string | undefined) => {
    const isDark = theme === 'dark';
    return {
      stroke: isDark ? '#A1A1AA' : '#71717A', // zinc-400 : zinc-500
      fill: isDark ? '#FAFAFA' : '#09090B', // zinc-50 : zinc-950
      line: 'hsl(var(--primary))'
    };
  };

export function PerformanceChart({ transactions }: PerformanceChartProps) {
  const { theme } = useTheme();
  const chartTheme = resolveChartTheme(theme);

  const data = useMemo(() => calculateMonthlyPerformance(transactions || []), [transactions]);
  
  if (!transactions || transactions.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
                <EmptyState 
                    title="Not enough data"
                    description="Your monthly performance will appear here after you log some transactions."
                    icon={LineChartIcon}
                />
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="name" stroke={chartTheme.stroke} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={chartTheme.stroke} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip 
                contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Line type="monotone" dataKey="net" stroke={chartTheme.line} strokeWidth={2} dot={{ r: 4, fill: chartTheme.line }} activeDot={{ r: 6 }} animationDuration={1000} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
