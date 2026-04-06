import { ref, push, set, onValue, off, type DatabaseReference } from 'firebase/database';
import { initializeFirebase } from './index';
import { useEffect, useState } from 'react';

const { database } = initializeFirebase();

/**
 * Hook to listen to a specific path in RTDB.
 * Optimized for 'live action' folder.
 */
export function useRTDB<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!database) return;

    const dbRef = ref(database, path);
    
    const unsubscribe = onValue(dbRef, (snapshot) => {
      setData(snapshot.val());
      setLoading(false);
    }, (err) => {
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [path]);

  return { data, loading, error };
}

/**
 * Appends a log entry to the '/log' folder.
 */
export async function writeLog(action: string, details: any) {
  if (!database) return;

  const logRef = ref(database, 'log');
  const newLogRef = push(logRef);
  
  await set(newLogRef, {
    action,
    details,
    timestamp: new Date().toISOString()
  });
}

/**
 * Updates a value in the '/live' folder.
 */
export async function updateLiveAction(key: string, value: any) {
  if (!database) return;

  const liveRef = ref(database, `live/${key}`);
  await set(liveRef, {
    ...value,
    lastUpdated: new Date().toISOString()
  });
}
