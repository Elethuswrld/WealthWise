'use server';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  getFirestore, doc, setDoc, serverTimestamp, collection, query, where, getDocs, updateDoc, deleteDoc, Timestamp, getDoc,
} from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import type { Asset, Goal, Transaction, UserProfile } from '@/lib/types';
import { generatePersonalizedInsights } from '@/ai/flows/generate-personalized-financial-insights.ts';
import { dummyAssets, dummyTransactions } from '@/lib/dummy-data';
import type { FinancialSnapshot } from '@/lib/finance';
import { v4 as uuidv4 } from 'uuid';
import { getAuth } from 'firebase/auth';

// Server-side Firebase initialization
let app: FirebaseApp;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}
const auth = getAuth(app);
const db = getFirestore(app);


// --- Auth Actions ---

export async function createNewUserDocument(user: FirebaseUser) {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDocs(query(collection(db, 'users'), where('id', '==', user.uid)));
    
    if (userSnap.empty) {
        await setDoc(userRef, {
            id: user.uid,
            email: user.email,
            name: user.displayName,
            currency: 'USD',
            createdAt: serverTimestamp(),
        }, { merge: true });

        // Populate with dummy data
        const transactionsCollection = collection(db, `users/${user.uid}/transactions`);
        for (const tx of dummyTransactions) {
            const docRef = doc(transactionsCollection, uuidv4());
            await setDoc(docRef, { ...tx, userId: user.uid, id: docRef.id, date: serverTimestamp() });
        }

        const assetsCollection = collection(db, `users/${user.uid}/portfolio`);
        for (const asset of dummyAssets) {
            const docRef = doc(assetsCollection, uuidv4());
            await setDoc(docRef, { ...asset, userId: user.uid, id: docRef.id });
        }
    }
}

export async function updateUserProfile(userId: string, formData: FormData) {
    if (!userId) return { error: 'User not authenticated' };

    try {
        const name = formData.get('name') as string;
        const currency = formData.get('currency') as string;

        if (!name || name.trim().length < 2) {
            return { error: 'Name must be at least 2 characters long.' };
        }

        const userRef = doc(db, 'users', userId);
        
        // Use updateDoc to only change the mutable fields.
        // This avoids conflicts with security rules that protect immutable fields.
        await updateDoc(userRef, {
            name: name,
            currency: currency,
        });

        return { success: true };

    } catch (error: any) {
        console.error(error);
        return { error: error.message };
    }
}


// --- Data Actions ---

export async function addTransaction(userId: string, formData: FormData) {
    if (!userId) return { error: 'User not authenticated' };

    try {
        const transactionId = uuidv4();
        const newTransactionData = {
            type: formData.get('type') as Transaction['type'],
            category: formData.get('category') as string,
            amount: parseFloat(formData.get('amount') as string),
            notes: formData.get('notes') as string | undefined,
            id: transactionId,
            userId,
            date: serverTimestamp(),
        };

        const docRef = doc(db, `users/${userId}/transactions`, transactionId);
        await setDoc(docRef, newTransactionData);

        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function updateTransaction(userId: string, transactionId: string, formData: FormData) {
    if (!userId) return { error: 'User not authenticated' };
  
    try {
      const updatedTransactionData = {
        type: formData.get('type') as Transaction['type'],
        category: formData.get('category') as string,
        amount: parseFloat(formData.get('amount') as string),
        notes: formData.get('notes') as string | undefined,
      };
  
      const docRef = doc(db, `users/${userId}/transactions`, transactionId);
      await updateDoc(docRef, updatedTransactionData);
  
      return { success: true };
    } catch (error: any) {
      return { error: error.message };
    }
  }
  
  export async function deleteTransaction(userId: string, transactionId: string) {
    if (!userId) return { error: 'User not authenticated' };
  
    try {
      const docRef = doc(db, `users/${userId}/transactions`, transactionId);
      await deleteDoc(docRef);
  
      return { success: true };
    } catch (error: any) {
      return { error: error.message };
    }
  }


export async function addAsset(userId: string, formData: FormData) {
    if (!userId) return { error: 'User not authenticated' };

    try {
        const assetId = uuidv4();
        const newAssetData = {
            assetType: formData.get('assetType') as Asset['assetType'],
            assetName: formData.get('assetName') as string,
            investedAmount: parseFloat(formData.get('investedAmount') as string),
            currentValue: parseFloat(formData.get('currentValue') as string),
            id: assetId,
            userId,
        };

        const docRef = doc(db, `users/${userId}/portfolio`, assetId);
        await setDoc(docRef, newAssetData);

        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function updateAsset(userId: string, assetId: string, formData: FormData) {
    if (!userId) return { error: 'User not authenticated' };

    try {
        const updatedAssetData = {
            assetType: formData.get('assetType') as Asset['assetType'],
            assetName: formData.get('assetName') as string,
            investedAmount: parseFloat(formData.get('investedAmount') as string),
            currentValue: parseFloat(formData.get('currentValue') as string),
        };

        const docRef = doc(db, `users/${userId}/portfolio`, assetId);
        await updateDoc(docRef, updatedAssetData);

        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function deleteAsset(userId: string, assetId: string) {
    if (!userId) return { error: 'User not authenticated' };

    try {
        const docRef = doc(db, `users/${userId}/portfolio`, assetId);
        await deleteDoc(docRef);

        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}


// --- Goal Actions ---

export async function addGoal(userId: string, formData: FormData) {
    if (!userId) return { error: 'User not authenticated' };

    try {
        const goalId = uuidv4();
        const targetDate = formData.get('targetDate') as string;

        const newGoalData = {
            id: goalId,
            userId,
            name: formData.get('name') as string,
            targetAmount: parseFloat(formData.get('targetAmount') as string),
            currentAmount: parseFloat(formData.get('currentAmount') as string),
            targetDate: targetDate ? Timestamp.fromDate(new Date(targetDate)) : null,
            createdAt: serverTimestamp(),
        };

        const docRef = doc(db, `users/${userId}/goals`, goalId);
        await setDoc(docRef, newGoalData);

        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function updateGoal(userId: string, goalId: string, formData: FormData) {
    if (!userId) return { error: 'User not authenticated' };

    try {
        const targetDate = formData.get('targetDate') as string;
        const updatedGoalData = {
            name: formData.get('name') as string,
            targetAmount: parseFloat(formData.get('targetAmount') as string),
            currentAmount: parseFloat(formData.get('currentAmount') as string),
            targetDate: targetDate ? Timestamp.fromDate(new Date(targetDate)) : null,
        };

        const docRef = doc(db, `users/${userId}/goals`, goalId);
        await updateDoc(docRef, updatedGoalData);

        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function deleteGoal(userId: string, goalId: string) {
    if (!userId) return { error: 'User not authenticated' };

    try {
        const docRef = doc(db, `users/${userId}/goals`, goalId);
        await deleteDoc(docRef);
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}


// --- GenAI Action ---
export async function getAIFinancialInsights(userId: string, input: FinancialSnapshot) {
    if (!userId) {
        return { error: 'You must be logged in to get insights.' };
    }
    try {
        const result = await generatePersonalizedInsights(input);
        return { insights: result.insights };
    } catch (error: any) {
        console.error('Error generating AI insights:', error);
        return { error: 'Failed to generate insights. Please try again later.' };
    }
}
