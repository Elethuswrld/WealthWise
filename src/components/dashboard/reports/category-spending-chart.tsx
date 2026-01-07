'use client';

import { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Transaction } from '@/lib/types';
import { startOfMonth } from 'date-fns';
import { useTheme } from 'next-themes';
import EmptyState from '@/components/empty-state';
import { AlertCircle, BarChart2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const resolveChartTheme = (theme: string | undefined) => {
    const isDark = theme === 'dark';
    return {
      stroke: isDark ? '#A1A1AA' : '#71717A',
      fill: 'hsl(var(--chart-1))',
    };
  };

export default function CategorySpendingChart() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { theme } = useTheme();
    const chartTheme = resolveChartTheme(theme);
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);

    const transactionsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(
            collection(firestore, `users/${user.uid}/transactions`),
            where('type', '==', 'expense'),
            where('date', '>=', startOfCurrentMonth)
        );
    }, [firestore, user, startOfCurrentMonth]);

    const { data: transactions, isLoading, error } = useCollection<Transaction>(transactionsQuery);

    const categoryData = useMemo(() => {
        if (!transactions) return [];

        const spending: { [key: string]: number } = {};
        transactions.forEach(tx => {
            spending[tx.category] = (spending[tx.category] || 0) + tx.amount;
        });

        return Object.entries(spending)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount);

    }, [transactions]);
    
    const renderContent = () => {
        if (isLoading) {
            return <Skeleton className="h-[350px] w-full" />;
        }
        if (error) {
            return <EmptyState title="Error loading chart data" description="There was a problem fetching your spending data." icon={AlertCircle} />;
        }
        if (categoryData.length === 0) {
            return <EmptyState title="No spending data for this month" description="Your spending by category will appear here once you add some expenses." icon={BarChart2} />;
        }
        return (
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis type="number" stroke={chartTheme.stroke} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <YAxis dataKey="name" type="category" stroke={chartTheme.stroke} fontSize={12} tickLine={false} axisLine={false} interval={0} width={80} />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))'
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                        cursor={{ fill: 'hsl(var(--accent))', fillOpacity: 0.2 }}
                        formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)}
                    />
                    <Bar dataKey="amount" fill={chartTheme.fill} radius={[0, 4, 4, 0]} isAnimationActive={true} animationDuration={800} />
                </BarChart>
            </ResponsiveContainer>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
                <CardDescription>A breakdown of your expenses for the current month.</CardDescription>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    );
}
