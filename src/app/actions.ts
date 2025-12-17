'use server';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignout,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, addDoc, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { Asset, Transaction } from '@/lib/types';
import { generatePersonalizedInsights, type FinancialInsightsInput } from '@/ai/flows/generate-personalized-financial-insights';
import { dummyAssets, dummyTransactions } from '@/lib/dummy-data';
import type { FinancialSnapshot } from '@/lib/finance';

// --- Auth Actions ---

async function createNewUserDocument(user: import('firebase/auth').User) {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        currency: 'USD',
        createdAt: serverTimestamp(),
    });

    // Populate with dummy data
    const batch = writeBatch(db);
    const transactionsCollection = collection(db, "transactions");
    dummyTransactions.forEach(tx => {
        const docRef = doc(transactionsCollection);
        batch.set(docRef, { ...tx, userId: user.uid, date: serverTimestamp() });
    });

    const assetsCollection = collection(db, "portfolio");
    dummyAssets.forEach(asset => {
        const docRef = doc(assetsCollection);
        batch.set(docRef, { ...asset, userId: user.uid });
    });

    await batch.commit();
}

export async function signUpWithPassword(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  if (!email || !password || !name) {
    return { error: 'Missing fields' };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // We can't update displayName directly on creation this way,
    // so we'll store it in our Firestore document.
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        name: name,
        photoURL: null,
        currency: 'USD',
        createdAt: serverTimestamp(),
    });
    
    await createNewUserDocument(user);

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function signInWithPassword(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user is new
    const userQuery = query(collection(db, 'users'), where('uid', '==', user.uid));
    const querySnapshot = await getDocs(userQuery);
    if(querySnapshot.empty) {
        await createNewUserDocument(user);
    }

    return { success: true, user: result.user };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function signOut() {
  try {
    await firebaseSignout(auth);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}


// --- Data Actions ---

export async function addTransaction(formData: FormData) {
    const userId = auth.currentUser?.uid;
    if (!userId) return { error: 'User not authenticated' };

    try {
        const newTransaction: Omit<Transaction, 'id' | 'date'> = {
            userId,
            type: formData.get('type') as Transaction['type'],
            category: formData.get('category') as string,
            amount: parseFloat(formData.get('amount') as string),
            notes: formData.get('notes') as string | undefined,
        };

        await addDoc(collection(db, 'transactions'), {
            ...newTransaction,
            date: serverTimestamp(),
        });

        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function addAsset(formData: FormData) {
    const userId = auth.currentUser?.uid;
    if (!userId) return { error: 'User not authenticated' };

    try {
        const newAsset: Omit<Asset, 'id'> = {
            userId,
            assetType: formData.get('assetType') as Asset['assetType'],
            assetName: formData.get('assetName') as string,
            investedAmount: parseFloat(formData.get('investedAmount') as string),
            currentValue: parseFloat(formData.get('currentValue') as string),
        };

        await addDoc(collection(db, 'portfolio'), newAsset);

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
