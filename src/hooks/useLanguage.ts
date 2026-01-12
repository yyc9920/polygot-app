import { useTranslation } from 'react-i18next';
import useLocalStorage from './useLocalStorage';

export type Language = 'en' | 'es' | 'fr' | 'ja' | 'de' | 'ko' | 'it' | 'zh' | 'pt' | 'hi';

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  ja: '日本語',
  de: 'Deutsch',
  ko: '한국어',
  it: 'Italiano',
  zh: '中文',
  pt: 'Português',
  hi: 'हिंदी',
};

function useLanguage() {
  const { t, i18n } = useTranslation();
  const [language, setStoredLanguage] = useLocalStorage<Language>('language', 'en');

  const changeLanguage = (newLanguage: Language) => {
    setStoredLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  return { t, language, changeLanguage, i18n, LANGUAGE_NAMES };
}

export default useLanguage;
