import type { Timestamp } from 'firebase/firestore';

export type WithId<T> = T & { id: string };

export interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  currency: string;
  createdAt: Timestamp;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense' | 'investment';
  category: string;
  amount: number;
  date: Timestamp;
  notes?: string;
}

export interface Asset {
  id: string;
  userId: string;
  assetType: 'Cash' | 'Crypto' | 'Stock' | 'Forex' | 'Other';
  assetName: string;
  investedAmount: number;
  currentValue: number;
}
