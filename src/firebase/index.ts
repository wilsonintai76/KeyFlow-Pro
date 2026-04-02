'use client';

/**
 * @fileOverview Firebase Barrel File (Production Mode)
 * Provides real implementations of Firebase services.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  enableMultiTabIndexedDbPersistence,
  memoryLocalCache,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Firestore with modern persistence (resolves deprecation warning)
const firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

const storage = getStorage(app);

export function initializeFirebase() {
  return {
    firebaseApp: app,
    auth,
    firestore,
    storage
  };
}

// Persistence Functions
export { setPersistence, browserSessionPersistence };

// Core Providers and Hooks
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';

// Re-export all Firestore SDK functions directly to avoid module mismatch
export * from 'firebase/firestore';

// Authentication Exports
export const initiateGoogleSignIn = (authInstance: any) => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(authInstance || auth, provider);
};

export const initiateAnonymousSignIn = (authInstance: any) => {
  return signInAnonymously(authInstance || auth);
};

export const initiateEmailSignUp = (authInstance: any, email: string, pass: string) => {
  return createUserWithEmailAndPassword(authInstance || auth, email, pass);
};

export const initiateEmailSignIn = (authInstance: any, email: string, pass: string) => {
  return signInWithEmailAndPassword(authInstance || auth, email, pass);
};

// Firestore Mutation Exports (linking to real implementations)
export * from './non-blocking-updates';

// Cabinet Hardware Control
import { setDoc } from 'firebase/firestore';

export const unlockCabinetStatus = async (firestore: any, userId: string, userName: string) => {
  const commandRef = doc(firestore, 'commands', 'cabinet');
  return setDoc(commandRef, {
    unlockRequested: true,
    requestedBy: userId,
    requestedByName: userName,
    timestamp: new Date().toISOString()
  });
};


