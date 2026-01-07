'use client';

import { Pie, PieChart, ResponsiveContainer, Cell, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Asset } from '@/lib/types';
import { useMemo, useState } from 'react';
import { calculatePortfolioAllocation } from '@/lib/finance';
import EmptyState from '../empty-state';
import { PieChart as PieChartIcon, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface PortfolioChartProps {
  assets: Asset[] | null;
  error?: Error | null;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function PortfolioChart({ assets, error }: PortfolioChartProps) {
    const data = useMemo(() => calculatePortfolioAllocation(assets || []), [assets]);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    const onPieLeave = () => {
        setActiveIndex(null);
    };
    
    const renderContent = () => {
        if (error) {
            return (
                <EmptyState
                    title="Could not load chart"
                    description="There was an error fetching the portfolio data."
                    icon={AlertCircle}
                />
            );
        }

        if (!assets || assets.length === 0) {
            return (
                <EmptyState
                    title="No assets to display"
                    description="Your portfolio allocation will appear here once you add an asset."
                    icon={PieChartIcon}
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
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    dataKey="value"
                    nameKey="name"
                    isAnimationActive={true}
                    animationDuration={1000}
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                      return (
                        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12}>
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  >
                    {data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        style={{ 
                            transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                            transformOrigin: 'center center',
                            transition: 'transform 0.2s ease-in-out'
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)}
                  />
                  <Legend iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
        );
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Allocation</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] flex items-center justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
