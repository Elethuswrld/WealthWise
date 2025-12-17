import { auth } from '@/lib/firebase';
import { redirect } from 'next/navigation';
import { getUserPortfolio, getUserTransactions } from '@/lib/api';
import type { Asset, Transaction } from '@/lib/types';
import { StatCard } from '@/components/dashboard/stat-card';
import { Wallet, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { PerformanceChart } from '@/components/dashboard/performance-chart';
import { PortfolioChart } from '@/components/dashboard/portfolio-chart';
import { AddDataDialog } from '@/components/dashboard/add-data-dialog';
import { AiInsights } from '@/components/dashboard/ai-insights';

export default async function DashboardPage() {
  const user = auth.currentUser;
  if (!user) {
    redirect('/login');
  }

  const portfolio: Asset[] = await getUserPortfolio(user.uid);
  const transactions: Transaction[] = await getUserTransactions(user.uid);
  const recentTransactions = transactions.slice(0, 5);

  const netWorth = portfolio.reduce((sum, asset) => sum + asset.currentValue, 0);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const monthlyTransactions = transactions.filter(tx => tx.date && tx.date.toDate() >= startOfMonth);
  
  const income = monthlyTransactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
    
  const expenses = monthlyTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);
    
  const profitLoss = income - expenses;

  const aiInputData = {
    income,
    expenses,
    netWorth,
    transactionHistory: transactions.map(tx => `${tx.date.toDate().toLocaleDateString()}: ${tx.type} - ${tx.category} - $${tx.amount}`).join('\n')
  }

  return (
    <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold font-headline">
                    Welcome, {user.displayName || 'User'}!
                </h1>
                <p className="text-muted-foreground">
                    Here&apos;s your financial overview for this month.
                </p>
            </div>
            <div className='flex items-center gap-2'>
                <AiInsights data={aiInputData} />
                <AddDataDialog />
            </div>
        </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Net Worth" value={netWorth} icon={Wallet} description="Total value of your assets" />
        <StatCard title="Monthly Income" value={income} icon={TrendingUp} description="Earnings this month" />
        <StatCard title="Monthly Expenses" value={expenses} icon={TrendingDown} description="Spendings this month" />
        <StatCard title="Profit / Loss" value={profitLoss} icon={Scale} description="Income minus expenses" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
            <PerformanceChart transactions={transactions} />
        </div>
        <div className="lg:col-span-3">
            <PortfolioChart assets={portfolio} />
        </div>
      </div>
      
      <div>
        <RecentTransactions transactions={recentTransactions} />
      </div>

    </div>
  );
}
