import { collection, query, where, getDocs, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { db } from './firebase';
import type { Asset, Transaction } from './types';

export async function getUserPortfolio(userId: string): Promise<Asset[]> {
    const assetsQuery = query(collection(db, 'portfolio'), where('userId', '==', userId));
    const querySnapshot = await getDocs(assetsQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset));
}

export async function getUserTransactions(userId: string, count?: number): Promise<Transaction[]> {
    let transactionsQuery = query(
        collection(db, 'transactions'), 
        where('userId', '==', userId), 
        orderBy('date', 'desc')
    );

    if (count) {
        transactionsQuery = query(transactionsQuery, firestoreLimit(count));
    }

    const querySnapshot = await getDocs(transactionsQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
}
