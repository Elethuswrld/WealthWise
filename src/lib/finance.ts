'use client';

import type { Asset, Transaction, WithId } from './types';
import { format, startOfMonth, subMonths, endOfMonth, isValid } from 'date-fns';

export interface MonthlySummary {
  month: string;
  income: number;
  expenses: number;
  net: number;
  name: string;
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

const getDateFromTimestamp = (timestamp: any): Date | null => {
    if (!timestamp) return null;
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
    return null;
}


/**
 * Calculates summary metrics for the current month from a list of transactions.
 * @param transactions - A list of all transactions.
 * @returns An object with income, expenses, and profit/loss for the current month.
 */
export function calculateCurrentMonthSummary(transactions: WithId<Transaction>[]) {
  const now = new Date();
  const startOfCurrentMonth = startOfMonth(now);

  const monthlyTransactions = transactions.filter(tx => {
    const txDate = getDateFromTimestamp(tx.date);
    return txDate && txDate >= startOfCurrentMonth;
  });

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
export function calculateNetWorth(portfolio: WithId<Asset>[]): number {
  return portfolio.reduce((sum, asset) => sum + asset.currentValue, 0);
}


/**
 * Groups transactions by month and calculates income and expenses for each month.
 * @param transactions - A list of all transactions.
 * @returns An array of monthly summary objects.
 */
export function calculateMonthlyPerformance(transactions: WithId<Transaction>[]): MonthlySummary[] {
    const monthlyData: { [key: string]: { income: number; expense: number } } = {};
    
    transactions.forEach(tx => {
      const txDate = getDateFromTimestamp(tx.date);
      if (!txDate || !isValid(txDate)) return;

      const month = format(txDate, 'yyyy-MM');
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
        .map(([month, values]) => {
            const monthDate = new Date(month + '-02');
            return {
                name: isValid(monthDate) ? format(monthDate, 'MMM yy') : 'Invalid Date',
                month: isValid(monthDate) ? format(monthDate, 'MMM yy') : 'Invalid Date',
                income: values.income,
                expenses: values.expense,
                net: values.income - values.expense,
            }
        })
        .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
}


/**
 * Calculates the allocation of assets by their type.
 * @param assets - A list of all assets.
 * @returns An array of objects, each with asset type name and its total value.
 */
export function calculatePortfolioAllocation(assets: WithId<Asset>[]): { name: string; value: number }[] {
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
export function createFinancialSnapshot(transactions: WithId<Transaction>[], portfolio: WithId<Asset>[]): FinancialSnapshot {
  const now = new Date();
  const performance = calculateMonthlyPerformance(transactions);

  // Helper to get month data
  const getMonthSummary = (date: Date) => {
    const monthKey = format(date, 'MMM yy');
    const monthPerformance = performance.find(p => p.name === monthKey);
    return {
      income: monthPerformance?.income || 0,
      expenses: monthPerformance?.expenses || 0,
      netCashFlow: monthPerformance?.net || 0,
    };
  };

  const currentMonthData = getMonthSummary(now);
  const previousMonthData = getMonthSummary(subMonths(now, 1));
  
  // Spending by category (current month vs previous)
  const getSpendingByCategory = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const categorySpending: { [key: string]: number } = {};
    transactions
      .filter(tx => {
        const txDate = getDateFromTimestamp(tx.date);
        return tx.type === 'expense' && txDate && txDate >= start && txDate <= end
      })
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
  const sortedPerformance = [...performance].sort((a,b) => new Date(b.name).getTime() - new Date(a.name).getTime());
  let streak = 0;
  if (sortedPerformance.length >= 3) {
      if (sortedPerformance[0].expenses > sortedPerformance[1].expenses && sortedPerformance[1].expenses > sortedPerformance[2].expenses) {
          streak = 3;
      } else if (sortedPerformance.length >= 2 && sortedPerformance[0].expenses > sortedPerformance[1].expenses) {
        streak = 2;
      } else if (sortedPerformance.length >= 1) {
        streak = 1;
      }
  } else if (sortedPerformance.length === 2) {
    if (sortedPerformance[0].expenses > sortedPerformance[1].expenses) {
        streak = 2;
    }
  } else if (sortedPerformance.length === 1) {
    if (sortedPerformance[0].expenses > 0) {
        streak = 1;
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
