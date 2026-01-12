import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en.json';
import esTranslation from './locales/es.json';
import frTranslation from './locales/fr.json';
import jaTranslation from './locales/ja.json';
import deTranslation from './locales/de.json';
import koTranslation from './locales/ko.json';
import itTranslation from './locales/it.json';
import zhTranslation from './locales/zh.json';
import ptTranslation from './locales/pt.json';
import hiTranslation from './locales/hi.json';

const resources = {
  en: { translation: enTranslation },
  es: { translation: esTranslation },
  fr: { translation: frTranslation },
  ja: { translation: jaTranslation },
  de: { translation: deTranslation },
  ko: { translation: koTranslation },
  it: { translation: itTranslation },
  zh: { translation: zhTranslation },
  pt: { translation: ptTranslation },
  hi: { translation: hiTranslation },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'es', 'fr', 'ja', 'de', 'ko', 'it', 'zh', 'pt', 'hi'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
