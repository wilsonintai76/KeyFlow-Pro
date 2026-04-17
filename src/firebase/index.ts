'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import { getAnalytics, isSupported } from 'firebase/analytics';

/**
 * Initializes Firebase with explicit configuration to resolve auth/api-key errors.
 * Ensures single instance initialization across client-side navigation.
 */
export function initializeFirebase() {
  let app: FirebaseApp;
  
  if (!getApps().length) {
    // Explicitly pass config object to ensure API key is captured correctly
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  return getSdks(app);
}

export function getSdks(firebaseApp: FirebaseApp) {
  let firestore;
  try {
    // Force long polling for studio environments to avoid WebSocket/API key issues
    firestore = initializeFirestore(firebaseApp, {
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  } catch (e) {
    firestore = getFirestore(firebaseApp);
  }

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: firestore,
    storage: getStorage(firebaseApp),
    database: getDatabase(firebaseApp),
    analytics: typeof window !== 'undefined' ? getAnalytics(firebaseApp) : null
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
