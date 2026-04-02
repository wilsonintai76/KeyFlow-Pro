'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, DocumentReference, DocumentSnapshot, DocumentData } from 'firebase/firestore';

export function useDoc<T = any>(memoizedDocRef: DocumentReference | null): { 
  data: T | null; 
  isLoading: boolean; 
  error: Error | null; 
} {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      return;
    }

    // Only show loading if we don't have data yet OR if the document reference target has changed
    const isNewDoc = !data || (data as any).id !== memoizedDocRef.id;
    if (isNewDoc) {
      setIsLoading(true);
    }

    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() } as T);
        } else {
          setData(null);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error("Firestore useDoc error:", err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedDocRef]);

  return { data, isLoading, error };
}
