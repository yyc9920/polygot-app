import '@testing-library/jest-dom';
import { vi } from 'vitest';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Mock i18n to avoid Suspense/Backend issues in tests
vi.mock('./lib/i18n', () => {
  i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    ns: ['translation'],
    defaultNS: 'translation',
    debug: false,
    resources: {
      en: {
        translation: {
          'app.title': 'Polyglot',
          'nav.home': 'Home',
          'nav.learn': 'Learn',
          'nav.music': 'Music',
          'nav.quiz': 'Quiz',
          'nav.build': 'Build',
          'nav.settings': 'Settings',
        },
      },
    },
    react: {
      useSuspense: false,
    },
  });

  return { default: i18n };
});

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(() => vi.fn()), // Return unsubscribe function
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()), // Return unsubscribe function
}));

// Mock idb-keyval (indexedDB is not available in jsdom)
vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(undefined),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}));


