'use client';

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction } from '@/lib/types';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';
import { calculateMonthlyPerformance } from '@/lib/finance';
import EmptyState from '../empty-state';
import { LineChart as LineChartIcon, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';


interface PerformanceChartProps {
  transactions: Transaction[] | null;
  error?: Error | null;
}

const resolveChartTheme = (theme: string | undefined) => {
    const isDark = theme === 'dark';
    return {
      stroke: isDark ? '#A1A1AA' : '#71717A', // zinc-400 : zinc-500
      fill: isDark ? '#FAFAFA' : '#09090B', // zinc-50 : zinc-950
      incomeLine: 'hsl(var(--chart-1))',
      expenseLine: 'hsl(var(--destructive))',
    };
  };

export function PerformanceChart({ transactions, error }: PerformanceChartProps) {
  const { theme } = useTheme();
  const chartTheme = resolveChartTheme(theme);

  const data = useMemo(() => calculateMonthlyPerformance(transactions || []), [transactions]);
  
  const renderContent = () => {
    if (error) {
        return (
            <EmptyState
                title="Could not load chart"
                description="There was an error fetching the performance data."
                icon={AlertCircle}
            />
        );
    }
    if (!transactions || transactions.length === 0) {
      return (
          <EmptyState 
              title="Not enough data"
              description="Your monthly performance will appear here after you log some transactions."
              icon={LineChartIcon}
          />
      );
    }
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="name" stroke={chartTheme.stroke} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={chartTheme.stroke} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip 
                contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    opacity: 0.95,
                    transition: 'opacity 0.3s ease'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1.5 }}
              />
              <Line type="monotone" dataKey="income" stroke={chartTheme.incomeLine} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} animationDuration={1000} />
              <Line type="monotone" dataKey="expenses" stroke={chartTheme.expenseLine} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} animationDuration={1000} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Performance</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] flex items-center justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
