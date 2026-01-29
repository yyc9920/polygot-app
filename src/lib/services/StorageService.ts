import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { NativeStorageAdapter } from './NativeStorageAdapter';
import { app } from '../firebase';
import { addToRetryQueue } from '../sync';
import { PerformanceMonitor } from '../performance';

const db = getFirestore(app);

export const StorageService = {
  async readLocal<T>(key: string): Promise<T | undefined> {
    return PerformanceMonitor.measureAsync(`Storage:readLocal:${key}`, async () => {
      try {
        if (typeof window !== 'undefined') {
          const lsItem = localStorage.getItem(key);
          if (lsItem) {
            try {
              const parsed = JSON.parse(lsItem);
              await NativeStorageAdapter.set(key, parsed);
              localStorage.removeItem(key);
              return parsed as T;
            } catch (e) {
              console.error(`Error parsing localStorage for key ${key}:`, e);
            }
          }
        }

        const val = await NativeStorageAdapter.get<T>(key);
        return val;
      } catch (error) {
        console.error(`Error reading from local storage for key ${key}:`, error);
        return undefined;
      }
    });
  },

  async writeLocal<T>(key: string, value: T): Promise<void> {
    return PerformanceMonitor.measureAsync(`Storage:writeLocal:${key}`, async () => {
      try {
        await NativeStorageAdapter.set(key, value);
      } catch (error) {
        console.error(`Error writing to storage for key ${key}:`, error);
        throw error;
      }
    });
  },


  /**
   * Subscribes to Cloud Firestore updates.
   * Returns an unsubscribe function.
   */
  subscribeToCloud<T>(
    userId: string,
    key: string,
    onData: (data: T, metadata?: { schemaVersion: number }) => void,
    onError?: (error: Error) => void
  ): () => void {
    if (!userId || !key) return () => {};

    const docRef = doc(db, 'users', userId, 'data', key);
    
    return onSnapshot(docRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          // but we just pass the 'value' field to the callback
          if (data && data.value !== undefined) {
            onData(data.value as T, { schemaVersion: data.schemaVersion ?? 1 });
          }
        }
      },
      (error) => {
        console.error(`Firestore subscription error for key ${key}:`, error);
        if (onError) onError(error);
      }
    );
  },

  /**
   * Writes value to Cloud Firestore.
   * Handles retry queue on failure.
   */
  async writeToCloud<T>(userId: string, key: string, value: T, schemaVersion: number = 1): Promise<void> {
    if (!userId || !key) return;

    return PerformanceMonitor.measureAsync(`Storage:writeToCloud:${key}`, async () => {
      try {
        const docRef = doc(db, 'users', userId, 'data', key);
        // Sanitize undefined values before writing to Firestore
        // Firestore does not support 'undefined', but JSON.stringify strips them
        const sanitizedValue = JSON.parse(JSON.stringify(value));
        
        await setDoc(docRef, { 
          value: sanitizedValue, 
          updatedAt: new Date().toISOString(),
          schemaVersion
        }, { merge: true });
      } catch (err) {
        console.error(`Error saving to cloud for key ${key}:`, err);
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        await addToRetryQueue(key, value, errorMsg);
        throw err;
      }
    });
  }
};
