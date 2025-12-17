'use server';

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignout,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp, collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import type { Asset, Transaction } from '@/lib/types';
import { generatePersonalizedInsights } from '@/ai/flows/generate-personalized-financial-insights';
import { dummyAssets, dummyTransactions } from '@/lib/dummy-data';
import type { FinancialSnapshot } from '@/lib/finance';
import { setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { v4 as uuidv4 } from 'uuid';

// Server-side Firebase initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);


// --- Auth Actions ---

async function createNewUserDocument(user: import('firebase/auth').User) {
    const userRef = doc(db, 'users', user.uid);
    const userData = {
        id: user.uid,
        email: user.email,
        name: user.displayName,
        currency: 'USD',
        createdAt: serverTimestamp(),
    };
    setDocumentNonBlocking(userRef, userData, { merge: true });

    // Populate with dummy data
    const transactionsCollection = collection(db, `users/${user.uid}/transactions`);
    dummyTransactions.forEach(tx => {
        const docRef = doc(transactionsCollection, uuidv4());
        addDocumentNonBlocking(docRef, { ...tx, userId: user.uid, id: docRef.id, date: serverTimestamp() });
    });

    const assetsCollection = collection(db, `users/${user.uid}/portfolio`);
    dummyAssets.forEach(asset => {
        const docRef = doc(assetsCollection, uuidv4());
        addDocumentNonBlocking(docRef, { ...asset, userId: user.uid, id: docRef.id });
    });
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
    
    // Manually update profile to include name, as it's not done automatically
    const userRef = doc(db, 'users', user.uid);
    const userData = {
        id: user.uid,
        email: user.email,
        name: name, // Use the name from the form
        currency: 'USD',
        createdAt: serverTimestamp(),
    };
    await setDoc(userRef, userData, { merge: true });
    
    // Update user object for createNewUserDocument
    const userWithDisplayName = { ...user, displayName: name };
    await createNewUserDocument(userWithDisplayName);

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

    const userQuery = query(collection(db, 'users'), where('id', '==', user.uid));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
      // New user, create document and populate data
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
          id: user.uid,
          email: user.email,
          name: user.displayName,
          currency: 'USD',
          createdAt: serverTimestamp(),
      }, { merge: true });
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
        const transactionId = uuidv4();
        const newTransaction: Omit<Transaction, 'date' | 'id' | 'userId' > = {
            type: formData.get('type') as Transaction['type'],
            category: formData.get('category') as string,
            amount: parseFloat(formData.get('amount') as string),
            notes: formData.get('notes') as string | undefined,
        };

        const docRef = doc(db, `users/${userId}/transactions`, transactionId);
        addDocumentNonBlocking(docRef, {
            ...newTransaction,
            id: transactionId,
            userId,
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
        const assetId = uuidv4();
        const newAsset: Omit<Asset, 'id' | 'userId'> = {
            assetType: formData.get('assetType') as Asset['assetType'],
            assetName: formData.get('assetName') as string,
            investedAmount: parseFloat(formData.get('investedAmount') as string),
            currentValue: parseFloat(formData.get('currentValue') as string),
        };

        const docRef = doc(db, `users/${userId}/portfolio`, assetId);
        addDocumentNonBlocking(docRef, { ...newAsset, id: assetId, userId });

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
