'use client';

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction } from '@/lib/types';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';
import { format } from 'date-fns';

interface PerformanceChartProps {
  transactions: Transaction[];
}

const resolveChartTheme = (theme: string | undefined) => {
    const isDark = theme === 'dark';
    return {
      stroke: isDark ? '#A1A1AA' : '#71717A', // zinc-400 : zinc-500
      fill: isDark ? '#FAFAFA' : '#09090B', // zinc-50 : zinc-950
      line: '#2A9D8F' // primary color
    };
  };

export function PerformanceChart({ transactions }: PerformanceChartProps) {
  const { theme } = useTheme();
  const chartTheme = resolveChartTheme(theme);

  const data = useMemo(() => {
    const monthlyData: { [key: string]: { income: number; expense: number } } = {};
    
    transactions.forEach(tx => {
      if (!tx.date) return;
      const month = format(tx.date.toDate(), 'yyyy-MM');
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expense: 0 };
      }
      if (tx.type === 'income') {
        monthlyData[month].income += tx.amount;
      } else if (tx.type === 'expense') {
        monthlyData[month].expense += tx.amount;
      }
    });

    return Object.entries(monthlyData)
        .map(([month, values]) => ({
            name: format(new Date(month + '-02'), 'MMM yy'),
            net: values.income - values.expense,
        }))
        .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
  }, [transactions]);
  
  if (transactions.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Not enough data to display chart.
                </div>
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
              <Line type="monotone" dataKey="net" stroke={chartTheme.line} strokeWidth={2} dot={{ r: 4, fill: chartTheme.line }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
