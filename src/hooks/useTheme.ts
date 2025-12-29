import { useEffect } from 'react';
import useLocalStorage from './useLocalStorage';

function useTheme() {
  const [darkMode, setDarkMode] = useLocalStorage<boolean>('theme', false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return { darkMode, toggleTheme };
}

export default useTheme;
