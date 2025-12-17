'use client';

import type { Asset, Transaction } from './types';
import { format, startOfMonth } from 'date-fns';

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
