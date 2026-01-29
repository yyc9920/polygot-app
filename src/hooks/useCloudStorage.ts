import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../lib/services/StorageService';
import { SyncErrorService } from '../lib/services/SyncErrorService';

function useCloudStorage<T>(
  key: string,
  initialValue: T | (() => T),
  transform?: (value: T) => T,
  mergeStrategy?: (local: T, cloud: T) => T
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const { user } = useAuth();
  const lastCloudStr = useRef<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 1. Initialize state with default value
  const [storedValue, setStoredValue] = useState<T>(() => {
    return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
  });

  // 2. Load from Storage
  useEffect(() => {
    let mounted = true;

    const loadFromStorage = async () => {
        try {
            const val = await StorageService.readLocal<T>(key);
            if (val !== undefined && mounted) {
                setStoredValue(transform ? transform(val) : val);
            }
        } catch (error) {
            console.error(error);
            SyncErrorService.emit('local_load', key, error);
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
    if (!user) return;

    const onData = (cloudValue: T) => {
         lastCloudStr.current = JSON.stringify(cloudValue);

         setStoredValue(prev => {
             let newValue = cloudValue;

             if (mergeStrategy) {
                 newValue = mergeStrategy(prev, cloudValue);
             }

             newValue = transform ? transform(newValue) : newValue;

             if (JSON.stringify(prev) !== JSON.stringify(newValue)) {
                 return newValue;
             }
             return prev;
         });
    };

    const unsubscribe = StorageService.subscribeToCloud<T>(
        user.uid,
        key,
        onData
    );

    return () => unsubscribe();
  }, [user, key, mergeStrategy, transform]);


  // 4. Persist changes
  useEffect(() => {
    if (!isInitialized) return;

    // Save to IDB
    StorageService.writeLocal(key, storedValue)
        .catch(err => {
            console.error('Error saving to IDB:', err);
            SyncErrorService.emit('local_save', key, err);
        });
      
    // If logged in, save to Firestore
    if (user) {
        const currentStr = JSON.stringify(storedValue);
        if (currentStr === lastCloudStr.current) {
            return;
        }

        const saveToCloud = async () => {
            try {
                await StorageService.writeToCloud(user.uid, key, storedValue);
                lastCloudStr.current = currentStr;
            } catch (err) {
                console.error("Error saving to cloud:", err);
                SyncErrorService.emit('cloud_save', key, err);
            }
        };
        
        const timeoutId = setTimeout(saveToCloud, 1000); 
        return () => clearTimeout(timeoutId);
    }

  }, [key, storedValue, user, isInitialized]);

  return [storedValue, setStoredValue, isInitialized];
}

export default useCloudStorage;
