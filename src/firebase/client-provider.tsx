'use client';

import React, { useMemo, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { 
  initializeFirebase,
  setPersistence,
  browserSessionPersistence,
  enableMultiTabIndexedDbPersistence
} from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase once per component mount.
    return initializeFirebase();
  }, []);

  useEffect(() => {
    // Persistence Setup
    if (firebaseServices.auth) {
      setPersistence(firebaseServices.auth, browserSessionPersistence).catch((error) => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn("Auth persistence failed:", error);
        }
      });
    }
  }, [firebaseServices.auth]);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
      storage={firebaseServices.storage}
    >
      {children}
    </FirebaseProvider>
  );
}
