import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';

function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
  transform?: (value: T) => T
): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      let value: T;
      if (item) {
        value = JSON.parse(item);
      } else {
        value = typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
      }
      return transform ? transform(value) : value;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      const value = typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
      return transform ? transform(value) : value;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;
