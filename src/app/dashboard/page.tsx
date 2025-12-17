'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Asset, Transaction } from '@/lib/types';
import { StatCard } from '@/components/dashboard/stat-card';
import { Wallet, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { PerformanceChart } from '@/components/dashboard/performance-chart';
import { PortfolioChart } from '@/components/dashboard/portfolio-chart';
import { AddDataDialog } from '@/components/dashboard/add-data-dialog';
import { AiInsights } from '@/components/dashboard/ai-insights';
import { calculateNetWorth, calculateCurrentMonthSummary, createFinancialSnapshot } from '@/lib/finance';
import type { FinancialSnapshot } from '@/lib/finance';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const portfolioQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/portfolio`);
  }, [firestore, user]);

  const transactionsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/transactions`);
  }, [firestore, user]);

  const recentTransactionsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/transactions`),
      orderBy('date', 'desc'),
      limit(5)
    );
  }, [firestore, user]);

  const { data: portfolio, isLoading: portfolioLoading } = useCollection<Asset>(portfolioQuery);
  const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);
  const { data: recentTransactions, isLoading: recentTransactionsLoading } = useCollection<Transaction>(recentTransactionsQuery);
  
  const isLoading = portfolioLoading || transactionsLoading;

  const netWorth = portfolio ? calculateNetWorth(portfolio) : 0;
  const { income, expenses, profitLoss } = transactions ? calculateCurrentMonthSummary(transactions) : { income: 0, expenses: 0, profitLoss: 0 };
  const financialSnapshot: FinancialSnapshot | null = transactions && portfolio ? createFinancialSnapshot(transactions, portfolio) : null;
  
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <motion.div 
        className="space-y-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
    >
        <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold font-headline">
                    Welcome, {user?.displayName || 'User'}!
                </h1>
                <p className="text-muted-foreground">
                    Here&apos;s your financial overview for this month.
                </p>
            </div>
            <div className='flex items-center gap-2'>
                {financialSnapshot && <AiInsights data={financialSnapshot} />}
                <AddDataDialog />
            </div>
        </motion.div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={itemVariants}><StatCard title="Net Worth" value={netWorth} icon={Wallet} description="Total value of your assets" loading={isLoading} /></motion.div>
        <motion.div variants={itemVariants}><StatCard title="Monthly Income" value={income} icon={TrendingUp} description="Earnings this month" loading={isLoading} /></motion.div>
        <motion.div variants={itemVariants}><StatCard title="Monthly Expenses" value={expenses} icon={TrendingDown} description="Spendings this month" loading={isLoading} /></motion.div>
        <motion.div variants={itemVariants}><StatCard title="Profit / Loss" value={profitLoss} icon={Scale} description="Income minus expenses" loading={isLoading} /></motion.div>
      </div>

      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
            <PerformanceChart transactions={transactions} />
        </div>
        <div className="lg:col-span-3">
            <PortfolioChart assets={portfolio} />
        </div>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <RecentTransactions transactions={recentTransactions || []} loading={recentTransactionsLoading} />
      </motion.div>

    </motion.div>
  );
}
