import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { app } from '../lib/firebase';
import { get, set } from 'idb-keyval';
import { addToRetryQueue } from '../lib/sync';

const db = getFirestore(app);

function useCloudStorage<T>(
  key: string,
  initialValue: T | (() => T),
  transform?: (value: T) => T,
  mergeStrategy?: (local: T, cloud: T) => T
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const { user } = useAuth();
  const lastCloudStr = useRef<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 1. Initialize state with default value (cannot read IDB synchronously)
  const [storedValue, setStoredValue] = useState<T>(() => {
    return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
  });

  // 2. Load from IDB
  useEffect(() => {
    let mounted = true;

    const loadFromStorage = async () => {
        try {
            const lsItem = localStorage.getItem(key);
            if (lsItem) {
                try {
                    const parsed = JSON.parse(lsItem);
                    await set(key, parsed);
                    localStorage.removeItem(key);
                    
                    if (mounted) {
                        setStoredValue(transform ? transform(parsed) : parsed);
                        setIsInitialized(true);
                    }
                    return;
                } catch (e) {
                    console.error(e);
                }
            }

            const val = await get<T>(key);
            if (val !== undefined) {
                if (mounted) {
                    setStoredValue(transform ? transform(val) : val);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            if (mounted) {
                setIsInitialized(true);
            }
        }
    };

    loadFromStorage();
    return () => { mounted = false; };
  }, [key]);

  // 3. Sync to/from Cloud Firestore
  useEffect(() => {
    if (!user) {
        return;
    }

    const docRef = doc(db, 'users', user.uid, 'data', key);

    // Initial Fetch (Pull from Cloud) & Realtime Listener
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && data.value !== undefined) {
                 const cloudValue = data.value;
                 
                 lastCloudStr.current = JSON.stringify(cloudValue);

                 setStoredValue(prev => {
                     let newValue = cloudValue;

                     if (mergeStrategy) {
                         newValue = mergeStrategy(prev, cloudValue);
                     }

                     newValue = transform ? transform(newValue) : newValue;

                     // Only update if different to avoid loops/re-renders
                     if (JSON.stringify(prev) !== JSON.stringify(newValue)) {
                         return newValue;
                     }
                     return prev;
                 });
            }
        }
    });

    return () => unsubscribe();
  }, [user, key, mergeStrategy, transform]);


  // 4. Persist changes to IDB AND Cloud (if logged in)
  useEffect(() => {
    // Wait until initialized to prevent overwriting storage with default values
    if (!isInitialized) return;

    // Save to IDB
    set(key, storedValue).catch(err => console.error('Error saving to IDB:', err));
      
    // If logged in, save to Firestore
    if (user) {
        const currentStr = JSON.stringify(storedValue);
        if (currentStr === lastCloudStr.current) {
            return;
        }

        const saveToCloud = async () => {
            try {
                const docRef = doc(db, 'users', user.uid, 'data', key);
                await setDoc(docRef, { value: storedValue, updatedAt: new Date().toISOString() }, { merge: true });
                lastCloudStr.current = currentStr;
            } catch (err) {
                console.error("Error saving to cloud:", err);
                const errorMsg = err instanceof Error ? err.message : 'Unknown error';
                addToRetryQueue(key, storedValue, errorMsg).catch(e => 
                  console.error('Failed to add to retry queue:', e)
                );
            }
        };
        
        const timeoutId = setTimeout(saveToCloud, 1000); 
        return () => clearTimeout(timeoutId);
    }

  }, [key, storedValue, user, isInitialized]);

  return [storedValue, setStoredValue, isInitialized];
}

export default useCloudStorage;
