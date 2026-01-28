import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { app } from '../lib/firebase';
import { processRetryQueue, setupOnlineListener } from '../lib/sync';

const db = getFirestore(app);

export function useSyncRetry() {
  const { user } = useAuth();
  const processingRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    const syncOperation = async (key: string, value: unknown) => {
      const docRef = doc(db, 'users', user.uid, 'data', key);
      await setDoc(docRef, { value, updatedAt: new Date().toISOString() }, { merge: true });
    };

    const processQueue = async () => {
      if (processingRef.current) return;
      processingRef.current = true;

      try {
        const result = await processRetryQueue(syncOperation);
        if (result.success > 0 || result.failed > 0) {
          console.log(`[SyncRetry] Processed queue: ${result.success} success, ${result.failed} failed`);
        }
      } finally {
        processingRef.current = false;
      }
    };

    processQueue();

    const cleanup = setupOnlineListener(processQueue);

    return cleanup;
  }, [user]);
}
