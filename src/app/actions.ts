'use server';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  getFirestore, doc, setDoc, serverTimestamp, collection, query, where, getDocs,
} from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import type { Asset, Transaction } from '@/lib/types';
import { generatePersonalizedInsights } from '@/ai/flows/generate-personalized-financial-insights';
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
    
    // Only create if the user document doesn't exist
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


// --- Data Actions ---

export async function addTransaction(formData: FormData) {
    const userId = auth.currentUser?.uid;
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

export async function addAsset(formData: FormData) {
    const userId = auth.currentUser?.uid;
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


// --- GenAI Action ---
export async function getAIFinancialInsights(input: FinancialSnapshot) {
    if (!auth.currentUser?.uid) {
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
