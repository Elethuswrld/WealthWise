import {
    calculateNetWorth,
    calculateCurrentMonthSummary,
    calculateMonthlyPerformance,
    calculatePortfolioAllocation,
    createFinancialSnapshot,
  } from '../finance';
  import type { WithId, Asset, Transaction } from '../types';
  import { Timestamp } from 'firebase/firestore';
  
  // Helper to create a Firestore-like Timestamp
  const toTimestamp = (date: Date): Timestamp => {
    return new Timestamp(Math.floor(date.getTime() / 1000), 0);
  };
  
  const mockAssets: WithId<Asset>[] = [
    { id: '1', userId: 'user1', assetType: 'Stock', assetName: 'Apple', investedAmount: 1000, currentValue: 1500 },
    { id: '2', userId: 'user1', assetType: 'Crypto', assetName: 'Bitcoin', investedAmount: 5000, currentValue: 4000 },
    { id: '3', userId: 'user1', assetType: 'Stock', assetName: 'Google', investedAmount: 2000, currentValue: 2500 },
  ];
  
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
  
  const mockTransactions: WithId<Transaction>[] = [
    { id: 't1', userId: 'user1', type: 'income', category: 'Salary', amount: 5000, date: toTimestamp(now) },
    { id: 't2', userId: 'user1', type: 'expense', category: 'Groceries', amount: 200, date: toTimestamp(now) },
    { id: 't3', userId: 'user1', type: 'expense', category: 'Rent', amount: 1500, date: toTimestamp(now) },
    { id: 't4', userId: 'user1', type: 'income', category: 'Bonus', amount: 1000, date: toTimestamp(lastMonth) },
    { id: 't5', userId: 'user1', type: 'expense', category: 'Utilities', amount: 150, date: toTimestamp(lastMonth) },
  ];
  
  describe('Finance Calculations', () => {
  
    describe('calculateNetWorth', () => {
      it('should calculate the total current value of all assets', () => {
        const netWorth = calculateNetWorth(mockAssets);
        expect(netWorth).toBe(1500 + 4000 + 2500); // 8000
      });
  
      it('should return 0 for an empty portfolio', () => {
        const netWorth = calculateNetWorth([]);
        expect(netWorth).toBe(0);
      });
    });
  
    describe('calculateCurrentMonthSummary', () => {
      it('should correctly sum income and expenses for the current month', () => {
        const summary = calculateCurrentMonthSummary(mockTransactions);
        expect(summary.income).toBe(5000);
        expect(summary.expenses).toBe(1700);
        expect(summary.profitLoss).toBe(3300);
      });
  
      it('should return all zeros if there are no transactions in the current month', () => {
        const oldTransactions = mockTransactions.filter(tx => toTimestamp(now).seconds !== tx.date.seconds);
        const summary = calculateCurrentMonthSummary(oldTransactions);
        expect(summary.income).toBe(0);
        expect(summary.expenses).toBe(0);
        expect(summary.profitLoss).toBe(0);
      });
    });
  
    describe('calculateMonthlyPerformance', () => {
        it('should group transactions by month and calculate summaries', () => {
            const performance = calculateMonthlyPerformance(mockTransactions);
            // This will have 2 months of data
            expect(performance.length).toBe(2);
            // Check current month data
            const currentMonthPerformance = performance.find(p => p.name.startsWith(new Intl.DateTimeFormat('en-US', { month: 'short' }).format(now)));
            expect(currentMonthPerformance?.income).toBe(5000);
            expect(currentMonthPerformance?.expenses).toBe(1700);
            // Check last month data
            const lastMonthPerformance = performance.find(p => p.name.startsWith(new Intl.DateTimeFormat('en-US', { month: 'short' }).format(lastMonth)));
            expect(lastMonthPerformance?.income).toBe(1000);
            expect(lastMonthPerformance?.expenses).toBe(150);
        });
    });
  
    describe('calculatePortfolioAllocation', () => {
        it('should group assets by type and sum their current values', () => {
            const allocation = calculatePortfolioAllocation(mockAssets);
            const stockAllocation = allocation.find(a => a.name === 'Stock');
            const cryptoAllocation = allocation.find(a => a.name === 'Crypto');
            
            expect(stockAllocation?.value).toBe(1500 + 2500); // 4000
            expect(cryptoAllocation?.value).toBe(4000);
        });
    });

    describe('createFinancialSnapshot', () => {
        it('should create a correct snapshot of the user\'s finances', () => {
            const snapshot = createFinancialSnapshot(mockTransactions, mockAssets);
            
            // Current Month
            expect(snapshot.currentMonth.income).toBe(5000);
            expect(snapshot.currentMonth.expenses).toBe(1700);

            // Previous Month
            expect(snapshot.previousMonth?.income).toBe(1000);
            expect(snapshot.previousMonth?.expenses).toBe(150);

            // Portfolio
            const totalValue = 1500 + 4000 + 2500;
            const stockAllocation = snapshot.portfolioAllocation.find(a => a.assetType === 'Stock');
            expect(stockAllocation?.value).toBe(4000);
            expect(stockAllocation?.percentage).toBeCloseTo(4000 / totalValue);

            // Spending by Category change
            // (No spending in previous month for these categories, so change should be 1 (100%))
            const groceries = snapshot.spendingByCategory.find(s => s.category === 'Groceries');
            expect(groceries?.amount).toBe(200);
            expect(groceries?.change).toBe(1); // from 0 to 200 is infinite, so we cap at 1
        });
    });
  
  });
  