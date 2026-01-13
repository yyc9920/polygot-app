import React, { createContext, useContext, useEffect, useState, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import type { LearningStatus, PhraseItem, ViewMode, SongMaterials } from '../types';
import { SAMPLE_DATA } from '../constants';
import useCloudStorage from '../hooks/useCloudStorage';
import useLocalStorage from '../hooks/useLocalStorage';
import { parseCSV, generateId } from '../lib/utils';
import type { YouTubeVideo } from '../lib/youtube';
import type { GeniusSong } from '../lib/lyrics';
import { PHRASE_DICTIONARY, type LanguageCode } from '../data/phraseDictionary';

export interface MusicViewState {
  query: string;
  results: YouTubeVideo[];
  geniusResults: GeniusSong[];
  selectedVideo: YouTubeVideo | null;
  selectedSong: GeniusSong | null;
  materials: SongMaterials | null;
  isLoading: boolean;
  isSearching: boolean;
  searchStep: 'song' | 'video';
  activeTab: 'lyrics' | 'phrase';
}

const initialMusicState: MusicViewState = {
  query: '',
  results: [],
  geniusResults: [],
  selectedVideo: null,
  selectedSong: null,
  materials: null,
  isLoading: false,
  isSearching: false,
  searchStep: 'song',
  activeTab: 'lyrics',
};

interface PhraseAppContextType {
  phraseList: PhraseItem[];
  setPhraseList: Dispatch<SetStateAction<PhraseItem[]>>;
  status: LearningStatus;
  setStatus: Dispatch<SetStateAction<LearningStatus>>;
  voiceURI: string | null;
  setVoiceURI: Dispatch<SetStateAction<string | null>>;
  apiKey: string;
  setApiKey: Dispatch<SetStateAction<string>>;
  youtubeApiKey: string;
  setYoutubeApiKey: Dispatch<SetStateAction<string>>;
  geniusApiKey: string;
  setGeniusApiKey: Dispatch<SetStateAction<string>>;
  savedUrls: string[];
  setSavedUrls: Dispatch<SetStateAction<string[]>>;
  currentView: ViewMode;
  setCurrentView: Dispatch<SetStateAction<ViewMode>>;
  reviewMode: boolean;
  setReviewMode: Dispatch<SetStateAction<boolean>>;
  musicState: MusicViewState;
  setMusicState: Dispatch<SetStateAction<MusicViewState>>;
  purchasedPackages: string[];
  addStarterPackage: (targetLang: LanguageCode, sourceLang?: LanguageCode) => void;
  handleReset: () => void;
  handleDeleteAllData: () => void;
  syncUrl: (url: string) => Promise<void>;
  totalCount: number;
}

const PhraseContext = createContext<PhraseAppContextType | undefined>(undefined);

export const PhraseAppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use Cloud Storage for Syncable Data
  const [phraseList, setPhraseList] = useCloudStorage<PhraseItem[]>(
    'phraseList', 
    SAMPLE_DATA, 
    (items: PhraseItem[]) => items.filter((item, index, self) => index === self.findIndex(t => t.id === item.id))
  );
  
  const [status, setStatus] = useCloudStorage<LearningStatus>('learningStatus', { completedIds: [], incorrectIds: [], points: 0, quizStats: {} });
  
  const [savedUrls, setSavedUrls] = useCloudStorage<string[]>('csvSourceUrls', []);
  const [purchasedPackages, setPurchasedPackages] = useCloudStorage<string[]>('purchasedPackages', []);

  // Use Local Storage for Device-Specific Settings (API Keys, Voices, etc)
  const [voiceURI, setVoiceURI] = useLocalStorage<string | null>('ttsVoiceURI', null);
  const [apiKey, setApiKey] = useLocalStorage<string>('geminiApiKey', '');
  const [youtubeApiKey, setYoutubeApiKey] = useLocalStorage<string>('youtubeApiKey', '');
  const [geniusApiKey, setGeniusApiKey] = useLocalStorage<string>('geniusApiKey', '');
  
  const [currentView, setCurrentView] = useState<ViewMode>('learn');
  const [reviewMode, setReviewMode] = useState(false);
  const [musicState, setMusicState] = useState<MusicViewState>(initialMusicState);

  // Migration for old savedUrl (local storage only)
  const [oldSavedUrl, setOldSavedUrl] = useLocalStorage<string>('csvSourceUrl', '');
  useEffect(() => {
    if (oldSavedUrl && savedUrls.length === 0) {
       setSavedUrls([oldSavedUrl]);
       setOldSavedUrl(''); // Clear old
    }
  }, []);

  const fetchFromUrl = async (url: string): Promise<PhraseItem[]> => {
      try {
          const fetchUrl = new URL(url);
          fetchUrl.searchParams.append('_t', String(Date.now())); // Cache busting
          const response = await fetch(fetchUrl.toString());
          if (!response.ok) return [];
          const text = await response.text();
          
          // Process CSV
          const cleanText = text.replace(/^\uFEFF/, '').trim();
          if (!cleanText) return [];
          const rows = parseCSV(cleanText);
          const startIdx = rows.length > 0 && rows[0].some(cell => cell.toLowerCase().includes('meaning')) ? 1 : 0;
          
          const items: PhraseItem[] = [];
          for (let i = startIdx; i < rows.length; i++) {
              const row = rows[i];
              if (row.length < 2) continue;
              if (!row[0] && !row[1]) continue;
              items.push({
                  id: generateId(row[0], row[1]),
                  meaning: row[0],
                  sentence: row[1],
                  pronunciation: row[2] || '',
                  tags: row[3] ? row[3].split(',').map(t => t.trim()) : []
              });
          }
          return items;
      } catch (error) {
          console.error(`Failed to fetch from ${url}:`, error);
          return [];
      }
  };

  const mergePhraseList = (newItems: PhraseItem[]) => {
      if (newItems.length === 0) return;
      
      setPhraseList((prev: PhraseItem[]) => {
          const itemMap = new Map(prev.map(item => [item.id, item]));
          let updatedCount = 0;
          let addedCount = 0;

          for (const item of newItems) {
              if (itemMap.has(item.id)) {
                  // Update existing
                  const existing = itemMap.get(item.id)!;
                  // Only update if something changed (optional optimization, but good for logs)
                  if (JSON.stringify(existing) !== JSON.stringify(item)) {
                      itemMap.set(item.id, { ...existing, ...item });
                      updatedCount++;
                  }
              } else {
                  // Add new
                  itemMap.set(item.id, item);
                  addedCount++;
              }
          }
          
          if (updatedCount > 0 || addedCount > 0) {
              console.log(`Synced data: ${addedCount} added, ${updatedCount} updated.`);
              return Array.from(itemMap.values());
          }
          return prev;
      });
  };

  const syncUrl = async (url: string) => {
      const items = await fetchFromUrl(url);
      if (items.length > 0) {
          mergePhraseList(items);
          alert(`Successfully synced ${items.length} items from URL.`);
      } else {
          alert('No items found or failed to fetch from URL.');
      }
  };

  const addStarterPackage = (targetLang: LanguageCode, sourceLang: LanguageCode = 'en') => {
    const packageId = `starter_${targetLang}`;
    if (purchasedPackages.includes(packageId)) {
      alert('Package already purchased!');
      return;
    }

    const newItems: PhraseItem[] = PHRASE_DICTIONARY.map(entry => {
      const source = entry.translations[sourceLang] || entry.translations['en'];
      const target = entry.translations[targetLang];
      
      return {
        id: generateId(source.text, target.text),
        meaning: source.text,
        sentence: target.text,
        pronunciation: target.pron || '',
        tags: [...entry.tags, 'Starter'],
        packageId: packageId
      };
    });

    mergePhraseList(newItems);
    setPurchasedPackages(prev => [...prev, packageId]);
    alert(`Successfully added Starter Package for ${targetLang}!`);
  };

  // Auto-fetch data from savedUrls on mount/change
  useEffect(() => {
    const fetchAll = async () => {
      if (savedUrls.length === 0) return;
      
      const promises = savedUrls.map(url => fetchFromUrl(url));
      const results = await Promise.all(promises);
      const allNewItems = results.flat();
      
      mergePhraseList(allNewItems);
    };

    fetchAll();
  }, [savedUrls]); // Removed setPhraseList from deps to prevent loops with cloud storage

  const handleReset = () => {
    if (confirm('모든 학습 기록을 초기화하시겠습니까?')) {
      setStatus({ completedIds: [], incorrectIds: [], points: 0, quizStats: {} });
    }
  };

  const handleDeleteAllData = () => {
    if (confirm('모든 데이터를 삭제하시겠습니까? (복구 불가)')) {
      setPhraseList([]);
      setStatus({ completedIds: [], incorrectIds: [], points: 0, quizStats: {} });
      setSavedUrls([]);
      setPurchasedPackages([]);
    }
  };

  const totalCount = phraseList.length;

  const value = {
    phraseList,
    setPhraseList,
    status,
    setStatus,
    voiceURI,
    setVoiceURI,
    apiKey,
    setApiKey,
    youtubeApiKey,
    setYoutubeApiKey,
    geniusApiKey,
    setGeniusApiKey,
    savedUrls,
    setSavedUrls,
    currentView,
    setCurrentView,
    reviewMode,
    setReviewMode,
    musicState,
    setMusicState,
    purchasedPackages,
    addStarterPackage,
    handleReset,
    handleDeleteAllData,
    syncUrl,
    totalCount,
  };

  return <PhraseContext.Provider value={value}>{children}</PhraseContext.Provider>;
};

export const usePhraseAppContext = () => {
  const context = useContext(PhraseContext);
  if (context === undefined) {
    throw new Error('usePhraseAppContext must be used within a PhraseAppProvider');
  }
  return context;
};
