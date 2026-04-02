'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, Query, CollectionReference, QuerySnapshot, DocumentData } from 'firebase/firestore';

export function useCollection<T = any>(memoizedTargetRefOrQuery: Query | CollectionReference | null): { 
  data: T[] | null; 
  isLoading: boolean; 
  error: Error | null; 
} {
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      return;
    }

    // Optimization: Only flip to loading if we have no data yet (initial load)
    if (!data) {
      setIsLoading(true);
    }

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T[];
        setData(items);
        setIsLoading(false);
      },
      (err) => {
        console.error("Firestore useCollection error:", err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery]);

  return { data, isLoading, error };
}

