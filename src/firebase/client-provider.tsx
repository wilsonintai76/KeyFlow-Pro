'use client';

import React, { useMemo, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { setPersistence, browserSessionPersistence } from 'firebase/auth';
import { enableMultiTabIndexedDbPersistence } from 'firebase/firestore';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    // Set persistence to session so user logs out when closing the browser/app
    // browserSessionPersistence clears auth state when the tab or window is closed.
    if (firebaseServices.auth) {
      setPersistence(firebaseServices.auth, browserSessionPersistence).catch((error) => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn("Failed to set auth persistence:", error);
        }
      });
    }

    // Enable Firestore Offline Persistence for PWA support
    if (firebaseServices.firestore) {
      enableMultiTabIndexedDbPersistence(firebaseServices.firestore).catch((err) => {
        if (process.env.NODE_ENV !== 'production') {
          if (err.code === 'failed-precondition') {
            console.warn('Firestore persistence failed: Multiple tabs open');
          } else if (err.code === 'unimplemented') {
            console.warn('Firestore persistence failed: Browser not supported');
          }
        }
      });
    }
  }, [firebaseServices.auth, firebaseServices.firestore]);

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
