import { createContext, type Dispatch, type SetStateAction } from 'react';
import type { LearningStatus, ViewMode, QuizItem } from '../types';
import type { PhraseEntity } from '../types/schema';
import type { LanguageCode } from '../data/phraseDictionary';

export interface PhraseAppContextType {
  phraseList: PhraseEntity[];
  setPhraseList: Dispatch<SetStateAction<PhraseEntity[]>>;
  status: LearningStatus;
  setStatus: Dispatch<SetStateAction<LearningStatus>>;
  voiceURI: string | null;
  setVoiceURI: Dispatch<SetStateAction<string | null>>;
  apiKey: string;
  setApiKey: Dispatch<SetStateAction<string>>;
  lastFmApiKey: string;
  youtubeApiKey: string;
  savedUrls: string[];
  setSavedUrls: Dispatch<SetStateAction<string[]>>;
  currentView: ViewMode;
  setCurrentView: Dispatch<SetStateAction<ViewMode>>;
  reviewMode: boolean;
  setReviewMode: Dispatch<SetStateAction<boolean>>;
  purchasedPackages: string[];
  addStarterPackage: (targetLang: LanguageCode, sourceLang?: LanguageCode) => void;
  handleReset: () => void;
  handleDeleteAllData: () => void;
  syncUrl: (url: string) => Promise<void>;
  totalCount: number;
  customQuizQueue: QuizItem[];
  setCustomQuizQueue: Dispatch<SetStateAction<QuizItem[]>>;
}

export const PhraseContext = createContext<PhraseAppContextType | undefined>(undefined);
