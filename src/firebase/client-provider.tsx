'use client';

import React, { useMemo, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { setPersistence, browserLocalPersistence } from 'firebase/auth';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase once per component mount.
    return initializeFirebase();
  }, []);

  useEffect(() => {
    // Set persistence to Local so the session survives page refreshes and browser restarts
    if (firebaseServices.auth) {
      console.log("FirebaseClientProvider: Configuring Auth persistence...");
      setPersistence(firebaseServices.auth, browserLocalPersistence)
        .then(() => {
          console.log("FirebaseClientProvider: Persistence set to browserLocalPersistence.");
        })
        .catch((error) => {
          console.error("FirebaseClientProvider: Failed to set auth persistence:", error);
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
