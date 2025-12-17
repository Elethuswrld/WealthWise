'use client';

import type { Asset, Transaction } from './types';
import { format, startOfMonth, subMonths, endOfMonth } from 'date-fns';

export interface MonthlySummary {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  netWorth: number;
}

export interface FinancialSnapshot {
  currentMonth: {
    income: number;
    expenses: number;
    netCashFlow: number;
  };
  previousMonth?: {
    income: number;
    expenses: number;
    netCashFlow: number;
  };
  spendingByCategory: {
    category: string;
    amount: number;
    change?: number;
  }[];
  portfolioAllocation: {
    assetType: string;
    percentage: number;
    value: number;
  }[];
  trends: {
    expenseGrowthStreak: number;
  };
};

/**
 * Calculates summary metrics for the current month from a list of transactions.
 * @param transactions - A list of all transactions.
 * @returns An object with income, expenses, and profit/loss for the current month.
 */
export function calculateCurrentMonthSummary(transactions: Transaction[]) {
  const now = new Date();
  const startOfCurrentMonth = startOfMonth(now);

  const monthlyTransactions = transactions.filter(tx => 
    tx.date && tx.date.toDate() >= startOfCurrentMonth
  );

  return monthlyTransactions.reduce(
    (acc, tx) => {
      if (tx.type === 'income') {
        acc.income += tx.amount;
      } else if (tx.type === 'expense') {
        acc.expenses += tx.amount;
      }
      acc.profitLoss = acc.income - acc.expenses;
      return acc;
    },
    { income: 0, expenses: 0, profitLoss: 0 }
  );
}

/**
 * Calculates the total net worth from a list of portfolio assets.
 * @param portfolio - A list of all assets.
 * @returns The total current value of all assets.
 */
export function calculateNetWorth(portfolio: Asset[]): number {
  return portfolio.reduce((sum, asset) => sum + asset.currentValue, 0);
}


/**
 * Groups transactions by month and calculates income and expenses for each month.
 * @param transactions - A list of all transactions.
 * @returns An array of monthly summary objects.
 */
export function calculateMonthlyPerformance(transactions: Transaction[]): MonthlySummary[] {
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
            name: format(new Date(month + '-02'), 'MMM yy'), // Use -02 to avoid timezone issues
            month: format(new Date(month + '-02'), 'MMM yy'),
            income: values.income,
            expenses: values.expense,
            net: values.income - values.expense,
        }))
        .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
}


/**
 * Calculates the allocation of assets by their type.
 * @param assets - A list of all assets.
 * @returns An array of objects, each with asset type name and its total value.
 */
export function calculatePortfolioAllocation(assets: Asset[]): { name: string; value: number }[] {
    const portfolioByType: { [key: string]: number } = {};
    assets.forEach(asset => {
        if (portfolioByType[asset.assetType]) {
            portfolioByType[asset.assetType] += asset.currentValue;
        } else {
            portfolioByType[asset.assetType] = asset.currentValue;
        }
    });

    return Object.entries(portfolioByType).map(([name, value]) => ({
        name,
        value,
    }));
}

/**
 * Creates a comprehensive financial snapshot for AI analysis.
 * @param transactions A list of all transactions.
 * @param portfolio A list of all assets.
 * @returns A FinancialSnapshot object.
 */
export function createFinancialSnapshot(transactions: Transaction[], portfolio: Asset[]): FinancialSnapshot {
  const now = new Date();
  const performance = calculateMonthlyPerformance(transactions);

  // Helper to get month data
  const getMonthSummary = (date: Date) => {
    const monthKey = format(date, 'yyyy-MM');
    const monthPerformance = performance.find(p => format(new Date(p.name), 'yyyy-MM') === monthKey);
    return {
      income: monthPerformance?.income || 0,
      expenses: monthPerformance?.expenses || 0,
      netCashFlow: monthPerformance?.net || 0,
    };
  };

  const currentMonthData = getMonthSummary(now);
  const previousMonthData = getMonthSummary(subMonths(now, 1));
  const twoMonthsAgoData = getMonthSummary(subMonths(now, 2));

  // Spending by category (current month vs previous)
  const getSpendingByCategory = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const categorySpending: { [key: string]: number } = {};
    transactions
      .filter(tx => tx.type === 'expense' && tx.date && tx.date.toDate() >= start && tx.date.toDate() <= end)
      .forEach(tx => {
        categorySpending[tx.category] = (categorySpending[tx.category] || 0) + tx.amount;
      });
    return categorySpending;
  };

  const currentMonthSpending = getSpendingByCategory(now);
  const prevMonthSpending = getSpendingByCategory(subMonths(now, 1));

  const spendingByCategory = Object.entries(currentMonthSpending).map(([category, amount]) => {
    const prevAmount = prevMonthSpending[category] || 0;
    const change = prevAmount > 0 ? (amount - prevAmount) / prevAmount : (amount > 0 ? 1 : 0);
    return { category, amount, change };
  });

  // Portfolio Allocation
  const totalValue = calculateNetWorth(portfolio);
  const portfolioAllocation = calculatePortfolioAllocation(portfolio).map(p => ({
    assetType: p.name,
    value: p.value,
    percentage: totalValue > 0 ? p.value / totalValue : 0,
  }));

  // Trends
  let expenseGrowthStreak = 0;
  if (currentMonthData.expenses > previousMonthData.expenses && previousMonthData.expenses > 0) {
    expenseGrowthStreak = 1;
    if (previousMonthData.expenses > twoMonthsAgoData.expenses && twoMonthsAgoData.expenses > 0) {
      expenseGrowthStreak = 2;
      // You can extend this logic further back if needed
    }
  }
  
  // A streak of 3 requires 4 months of data. Let's simplify for now.
  const sortedPerformance = [...performance].sort((a,b) => new Date(b.name).getTime() - new Date(a.name).getTime());
  let streak = 0;
  if (sortedPerformance.length >= 3) {
      if (sortedPerformance[0].expenses > sortedPerformance[1].expenses && sortedPerformance[1].expenses > sortedPerformance[2].expenses) {
          streak = 3;
      }
  }


  return {
    currentMonth: currentMonthData,
    previousMonth: previousMonthData,
    spendingByCategory,
    portfolioAllocation,
    trends: {
      expenseGrowthStreak: streak,
    },
  };
}
