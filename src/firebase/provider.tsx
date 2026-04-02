'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export const FirebaseContext = createContext<any>(undefined);

/**
 * FirebaseProvider (Production Implementation)
 * Provides real-time user authentication and service state.
 */
export const FirebaseProvider: React.FC<{ 
  children: ReactNode; 
  firebaseApp: any;
  auth: any;
  firestore: any;
  storage: any;
}> = ({ children, firebaseApp, auth, firestore, storage }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(
      auth, 
      (currentUser) => {
        setUser(currentUser);
        setIsUserLoading(false);
      },
      (error) => {
        console.error("Auth state error:", error);
        setUserError(error);
        setIsUserLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth]);

  const contextValue = useMemo(() => ({
    areServicesAvailable: !!firebaseApp,
    firebaseApp,
    firestore,
    auth,
    storage,
    user,
    isUserLoading,
    userError,
  }), [firebaseApp, firestore, auth, storage, user, isUserLoading, userError]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().firestore;
export const useStorage = () => useFirebase().storage;
export const useFirebaseApp = () => useFirebase().firebaseApp;

/** Hook to get the current authenticated user state. */
export const useUser = () => {
  const { user, isUserLoading } = useFirebase();
  return { user, isUserLoading };
};

/** Specialized hook for memoizing Firebase references. */
export const useMemoFirebase = (factory: () => any, deps: any[]) => useMemo(factory, deps);

