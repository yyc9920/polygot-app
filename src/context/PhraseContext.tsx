import React, { useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { LearningStatus, ViewMode, QuizItem } from '../types';
import type { PhraseEntity } from '../types/schema';
import { createPhraseEntity } from '../types/schema';
import { SAMPLE_DATA } from '../constants';
import useCloudStorage from '../hooks/useCloudStorage';
import useLocalStorage from '../hooks/useLocalStorage';
import { parseCSV, generateId, detectLanguageFromTags } from '../lib/utils';
import { PHRASE_DICTIONARY, type LanguageCode } from '../data/phraseDictionary';
import { PhraseContext } from './PhraseContextDefinition';
import { FSRSSyncService } from '../lib/services/FSRSSyncService';
import { PerformanceMonitor } from '../lib/performance';

const uniquePhrases = (items: PhraseEntity[]) => {
  return PerformanceMonitor.measure('PhraseContext:uniquePhrases', () => {
    const seenIds = new Set<string>();
    const seenContent = new Set<string>();
    
    return items.filter((item) => {
      // 1. Filter by ID
      if (seenIds.has(item.id)) return false;
      
      // 2. Filter by Content (handling potential migration duplicates with different IDs)
      // Create a content hash from sentence + meaning (normalized)
      const contentHash = `${item.sentence.trim().toLowerCase()}|${item.meaning.trim().toLowerCase()}`;
      if (seenContent.has(contentHash)) return false;
      
      seenIds.add(item.id);
      seenContent.add(contentHash);
      return true;
    });
  });
};

const mergePhrasesWithFSRS = (local: PhraseEntity[], cloud: PhraseEntity[]): PhraseEntity[] => {
  return PerformanceMonitor.measure('PhraseContext:mergePhrasesWithFSRS', () => {
    const merged = FSRSSyncService.mergePhraseLists(local, cloud);
    return uniquePhrases(merged);
  });
};

import { LoadingSpinner } from '../components/LoadingSpinner';

export const PhraseAppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use Cloud Storage for Syncable Data with FSRS-aware merge strategy
  const [phraseList, setPhraseList, isPhraseListReady] = useCloudStorage<PhraseEntity[]>(
    'phraseList', 
    SAMPLE_DATA, 
    uniquePhrases,
    mergePhrasesWithFSRS
  );
  
  const [status, setStatus] = useCloudStorage<LearningStatus>('learningStatus', { completedIds: [], incorrectIds: [], points: 0, quizStats: {} });
  
  // Auto-detect learning language
  useEffect(() => {
    if (isPhraseListReady) {
      console.log(`[Performance] PhraseList Ready. Total items: ${phraseList.length}`);
    }

    if (phraseList.length > 0) {
      const allTags = phraseList.flatMap(v => v.tags);
      const detectedLang = detectLanguageFromTags(allTags);
      
      if (detectedLang && status.learningLanguage !== detectedLang) {
        setStatus(prev => ({
          ...prev,
          learningLanguage: detectedLang
        }));
      }
    }
  }, [phraseList, status.learningLanguage, setStatus]);
  
  const [savedUrls, setSavedUrls] = useCloudStorage<string[]>('csvSourceUrls', []);
  const [purchasedPackages, setPurchasedPackages] = useCloudStorage<string[]>('purchasedPackages', []);

  // Use Local Storage for Device-Specific Settings (API Keys, Voices, etc)
  const [voiceURI, setVoiceURI] = useLocalStorage<string | null>('ttsVoiceURI', null);
  const [apiKey, setApiKey] = useLocalStorage<string>('geminiApiKey', '');
  
  const lastFmApiKey = import.meta.env.VITE_LASTFM_API_KEY || '';
  const youtubeApiKey = import.meta.env.VITE_YOUTUBE_API_KEY || '';
  
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [reviewMode, setReviewMode] = useState(false);
  const [customQuizQueue, setCustomQuizQueue] = useState<QuizItem[]>([]);

  // Migration for old savedUrl (local storage only)
  const [oldSavedUrl, setOldSavedUrl] = useLocalStorage<string>('csvSourceUrl', '');
  useEffect(() => {
    if (oldSavedUrl && savedUrls.length === 0) {
       setSavedUrls([oldSavedUrl]);
       setOldSavedUrl(''); // Clear old
    }
  }, [oldSavedUrl, savedUrls.length, setOldSavedUrl, setSavedUrls]);

  const fetchFromUrl = async (url: string): Promise<PhraseEntity[]> => {
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
          
           const items: PhraseEntity[] = [];
           for (let i = startIdx; i < rows.length; i++) {
               const row = rows[i];
               if (row.length < 2) continue;
               if (!row[0] && !row[1]) continue;
               items.push(createPhraseEntity(
                   generateId(row[0], row[1]),
                   row[0],
                   row[1],
                   row[3] ? row[3].split(',').map(t => t.trim()) : [],
                   { pronunciation: row[2] || '' }
               ));
           }
          return items;
      } catch (error) {
          console.error(`Failed to fetch from ${url}:`, error);
          return [];
      }
  };

  const mergePhraseList = useCallback((newItems: PhraseEntity[]) => {
      if (newItems.length === 0) return;
      
      setPhraseList((prev: PhraseEntity[]) => {
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
  }, [setPhraseList]);

   const syncUrl = async (url: string) => {
       const items = await fetchFromUrl(url);
       if (items.length > 0) {
           mergePhraseList(items);
           return { success: true, count: items.length };
       }
       return { success: false, count: 0 };
   };

   const addStarterPackage = (targetLang: LanguageCode, sourceLang: LanguageCode = 'en') => {
     const packageId = `starter_${targetLang}`;
     if (purchasedPackages.includes(packageId)) {
       return { success: false, alreadyPurchased: true };
     }

     const newItems: PhraseEntity[] = PHRASE_DICTIONARY.map(entry => {
       const source = entry.translations[sourceLang] || entry.translations['en'];
       const target = entry.translations[targetLang];
       
       return createPhraseEntity(
         generateId(source.text, target.text),
         source.text,
         target.text,
         [...entry.tags, 'Starter'],
         { pronunciation: target.pron || '', packageId: packageId }
       );
     });

     mergePhraseList(newItems);
     setPurchasedPackages(prev => [...prev, packageId]);
     return { success: true };
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
  }, [savedUrls, mergePhraseList]); // Removed setPhraseList from deps to prevent loops with cloud storage

  const handleReset = () => {
    setStatus({ completedIds: [], incorrectIds: [], points: 0, quizStats: {} });
  };

  const handleDeleteAllData = () => {
    setPhraseList([]);
    setStatus({ completedIds: [], incorrectIds: [], points: 0, quizStats: {} });
    setSavedUrls([]);
    setPurchasedPackages([]);
  };

  if (!isPhraseListReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

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
    lastFmApiKey,
    youtubeApiKey,
    savedUrls,
    setSavedUrls,
    currentView,
    setCurrentView,
    reviewMode,
    setReviewMode,
    purchasedPackages,
    addStarterPackage,
    handleReset,
    handleDeleteAllData,
    syncUrl,
    totalCount,
    customQuizQueue,
    setCustomQuizQueue
  };

  return <PhraseContext.Provider value={value}>{children}</PhraseContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePhraseAppContext = () => {
  const context = useContext(PhraseContext);
  if (context === undefined) {
    throw new Error('usePhraseAppContext must be used within a PhraseAppProvider');
  }
  return context;
};
