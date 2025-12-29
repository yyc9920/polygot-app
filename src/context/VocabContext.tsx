import React, { createContext, useContext, useEffect, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import type { LearningStatus, VocabItem } from '../types';
import { SAMPLE_DATA } from '../constants';
import useLocalStorage from '../hooks/useLocalStorage';
import { parseCSV, generateId } from '../lib/utils';

interface VocabAppContextType {
  vocabList: VocabItem[];
  setVocabList: Dispatch<SetStateAction<VocabItem[]>>;
  status: LearningStatus;
  setStatus: Dispatch<SetStateAction<LearningStatus>>;
  voiceURI: string | null;
  setVoiceURI: Dispatch<SetStateAction<string | null>>;
  apiKey: string;
  setApiKey: Dispatch<SetStateAction<string>>;
  savedUrl: string;
  setSavedUrl: Dispatch<SetStateAction<string>>;
  handleReset: () => void;
  handleDeleteAllData: () => void;
  totalCount: number;
}

const VocabAppContext = createContext<VocabAppContextType | undefined>(undefined);

export const VocabAppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [vocabList, setVocabList] = useLocalStorage<VocabItem[]>(
    'vocabList', 
    SAMPLE_DATA, 
    (items: VocabItem[]) => items.filter((item, index, self) => index === self.findIndex(t => t.id === item.id))
  );
  const [status, setStatus] = useLocalStorage<LearningStatus>('learningStatus', { completedIds: [], incorrectIds: [] });
  const [voiceURI, setVoiceURI] = useLocalStorage<string | null>('ttsVoiceURI', null);
  const [apiKey, setApiKey] = useLocalStorage<string>('geminiApiKey', '');
  const [savedUrl, setSavedUrl] = useLocalStorage<string>('csvSourceUrl', '');

  // Auto-fetch data from savedUrl on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!savedUrl) return;
      try {
        const fetchUrl = new URL(savedUrl);
        fetchUrl.searchParams.append('_t', String(Date.now())); // Cache busting
        const response = await fetch(fetchUrl.toString());
        if (!response.ok) return;
        const text = await response.text();
        
        // Process CSV
        const cleanText = text.replace(/^\uFEFF/, '').trim();
        if (!cleanText) return;
        const rows = parseCSV(cleanText);
        const startIdx = rows.length > 0 && rows[0].some(cell => cell.toLowerCase().includes('meaning')) ? 1 : 0;
        const newItems: VocabItem[] = [];
        for (let i = startIdx; i < rows.length; i++) {
            const row = rows[i];
            if (row.length < 2) continue;
            if (!row[0] && !row[1]) continue;
            newItems.push({
                id: generateId(row[0], row[1]),
                meaning: row[0],
                sentence: row[1],
                pronunciation: row[2] || '',
                tags: row[3] ? row[3].split(',').map(t => t.trim()) : []
            });
        }

        if (newItems.length > 0) {
            setVocabList((prev: VocabItem[]) => {
                const existingIds = new Set(prev.map(p => p.id));
                const uniqueNew = newItems.filter(item => !existingIds.has(item.id));
                if (uniqueNew.length === 0) return prev;
                // Merge and dedup
                return [...prev, ...uniqueNew];
            });
            console.log(`Updated data from ${savedUrl}: ${newItems.length} items processed.`);
        }
      } catch (error) {
        console.error("Failed to auto-fetch from saved URL:", error);
      }
    };

    fetchData();
  }, [savedUrl, setVocabList]);

  const handleReset = () => {
    if (confirm('모든 학습 기록을 초기화하시겠습니까?')) {
      setStatus({ completedIds: [], incorrectIds: [] });
    }
  };

  const handleDeleteAllData = () => {
    if (confirm('모든 데이터를 삭제하시겠습니까? (복구 불가)')) {
      setVocabList([]);
      setStatus({ completedIds: [], incorrectIds: [] });
      setSavedUrl('');
    }
  };

  const totalCount = vocabList.length;

  const value = {
    vocabList,
    setVocabList,
    status,
    setStatus,
    voiceURI,
    setVoiceURI,
    apiKey,
    setApiKey,
    savedUrl,
    setSavedUrl,
    handleReset,
    handleDeleteAllData,
    totalCount,
  };

  return <VocabAppContext.Provider value={value}>{children}</VocabAppContext.Provider>;
};

export const useVocabAppContext = () => {
  const context = useContext(VocabAppContext);
  if (context === undefined) {
    throw new Error('useVocabAppContext must be used within a VocabAppProvider');
  }
  return context;
};
