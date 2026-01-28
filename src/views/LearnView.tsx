import React, { useState, useEffect } from 'react';
import { usePhraseAppContext } from '../context/PhraseContext';
import useLocalStorage from '../hooks/useLocalStorage';
import useLanguage from '../hooks/useLanguage';
import { useTTS } from '../hooks/useTTS';
import { callGemini } from '../lib/gemini';
import type { PhraseEntity } from '../types/schema';

import { LearnHeader } from './learn/LearnHeader';
import { TagFilter } from './learn/TagFilter';
import { MemoList } from './learn/MemoList';
import { AiTutorModal } from './learn/AiTutorModal';
import { EmptyState, ReviewModeBanner } from './learn/EmptyState';
import { CardDeck } from './learn/CardDeck';
import { FlipListItem } from '../components/FlipListItem';
import { EditPhraseModal } from '../components/EditPhraseModal';
import { CheckCircle, AlertCircle, BookOpen } from 'lucide-react';

export function LearnView() {
  const { phraseList, setPhraseList, status, apiKey, reviewMode, setReviewMode } = usePhraseAppContext();
  const { t, language, LANGUAGE_NAMES } = useLanguage();
  const { speak } = useTTS();

  const [viewMode, setViewMode] = useLocalStorage<'card' | 'list'>('learnViewMode', 'card');
  const [currentIndex, setCurrentIndex] = useLocalStorage<number>('learnCurrentIndex', 0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useLocalStorage<boolean>('learnIsShuffled', false);
  const [displayList, setDisplayList] = useState<PhraseEntity[]>(phraseList);
  const [selectedTags, setSelectedTags] = useLocalStorage<string[]>('learnSelectedTags', []);
  const [searchTerm, setSearchTerm] = useLocalStorage<string>('learnSearchTerm', '');
  
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showMemoList, setShowMemoList] = useState(false);
  
  const [editingItem, setEditingItem] = useState<PhraseEntity | null>(null);

  const prevItemIdRef = React.useRef<string | null>(null);
  
  const allTags = Array.from(new Set(phraseList.flatMap(v => v.tags)));

  // Effect 1: Handle Filtering and Sorting
  useEffect(() => {
    let list = phraseList;

    if (reviewMode) {
        list = list.filter(v => status.incorrectIds.includes(v.id));
    }
    
    if (selectedTags.length > 0) {
      list = list.filter(v => v.tags.some(tag => selectedTags.includes(tag)));
    }

    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        list = list.filter(v => 
            v.meaning.toLowerCase().includes(lowerTerm) || 
            v.sentence.toLowerCase().includes(lowerTerm) ||
            (v.pronunciation && v.pronunciation.toLowerCase().includes(lowerTerm))
        );
    }

    if (isShuffled) {
      list = [...list].sort(() => Math.random() - 0.5);
    }

    setDisplayList(list);
  }, [phraseList, selectedTags, isShuffled, searchTerm, reviewMode, status.incorrectIds]);

  // Effect 2: Handle Index Validation and State Reset on List Change
  
  useEffect(() => {
    if (displayList.length === 0) return;

    // 1. Validate Index
    if (currentIndex >= displayList.length) {
      setCurrentIndex(0);
      setIsFlipped(false);
      setAiExplanation('');
      setShowAiModal(false);
      return;
    }

    // 2. Check if the current item has changed (e.g. filtered out or reordered)
    const currentItem = displayList[currentIndex];
    const prevId = prevItemIdRef.current;
    
    if (prevId && currentItem.id !== prevId) {
        setIsFlipped(false);
        setAiExplanation('');
        setShowAiModal(false);
    }

    prevItemIdRef.current = currentItem.id;
  }, [displayList, currentIndex, setCurrentIndex]);

  const handleNext = () => {
    window.speechSynthesis.cancel();
    setIsFlipped(false);
    setAiExplanation('');
    setShowAiModal(false);
    setCurrentIndex((prev: number) => (prev + 1) % displayList.length);
  };

  const handlePrev = () => {
    window.speechSynthesis.cancel();
    setIsFlipped(false);
    setAiExplanation('');
    setShowAiModal(false);
    setCurrentIndex((prev: number) => (prev - 1 + displayList.length) % displayList.length);
  };

  const handleSaveEdit = (updatedItem: PhraseEntity) => {
       setPhraseList((prev: PhraseEntity[]) => prev.map(item => {
          if (item.id === updatedItem.id) {
              return updatedItem;
          }
          return item;
      }));
      setEditingItem(null);
  };

  const handleAiExplain = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!apiKey) {
      alert(t('learn.pleaseEnterApiKey'));
      return;
    }
    
    setShowAiModal(true);

    if (aiExplanation) return;

    setIsLoadingAi(true);
    try {
      const item = displayList[currentIndex];
      const isEnglish = item.tags.some(t => t.toLowerCase() === 'english' || t === '영어');
      const tagsStr = item.tags && item.tags.length > 0 ? `Tags: ${item.tags.join(', ')}` : '';
      const pronStr = (item.pronunciation && !isEnglish) ? `Pronunciation: ${item.pronunciation}` : '';
      const targetLangName = LANGUAGE_NAMES[language] || 'English';
      
      const prompt = `
      Analyze this sentence as a friendly language tutor.
      
      Sentence: "${item.sentence}"
      Meaning: "${item.meaning}"
      ${pronStr}
      ${tagsStr}

      Please provide a structured explanation in ${targetLangName} using **Markdown** format:
      - Use **bold** for key terms.
      - Use lists for multiple points.
      - Structure:
        ### 🧩 Grammar
        Brief breakdown...
        ### 💡 Nuance
        Contextual usage...
        ### 📖 Phrase
        Key words...

      Keep the total response concise.
      Do not contain greetings or any small talks. Just straight through the point.
      `;
      const text = await callGemini(prompt, apiKey);
      setAiExplanation(text);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setAiExplanation(`Error: ${message}`);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleOpenMemo = (e: React.MouseEvent) => {
    e.stopPropagation();
    const item = displayList[currentIndex];
    if (item && item.memo) {
      setAiExplanation(item.memo);
      setShowAiModal(true);
    }
  };

  const handleSaveMemo = () => {
      if (!aiExplanation) return;
      const currentItem = displayList[currentIndex];
      setPhraseList(prev => prev.map(item => 
          item.id === currentItem.id ? { ...item, memo: aiExplanation } : item
      ));
      alert(t('learn.memoSaved'));
  };

  const handleUpdatePhrase = (id: string, updates: Partial<PhraseEntity>) => {
    setPhraseList(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
    ));
  };

  const toggleTag = (tag: string) => {
      if (selectedTags.includes(tag)) {
          setSelectedTags(selectedTags.filter(t => t !== tag));
      } else {
          setSelectedTags([...selectedTags, tag]);
      }
  };

  const memoList = phraseList.filter(v => v.memo);

  return (
    <div className="flex flex-col h-full gap-4 relative">
      {reviewMode && <ReviewModeBanner onExit={() => setReviewMode(false)} />}

      <div className="flex-none flex flex-col gap-3 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 z-10">
        <LearnHeader 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm}
          isShuffled={isShuffled}
          setIsShuffled={setIsShuffled}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onToggleMemoList={() => setShowMemoList(true)}
        />
        <TagFilter 
          allTags={allTags} 
          selectedTags={selectedTags} 
          toggleTag={toggleTag} 
        />
      </div>

      {displayList.length === 0 ? (
        <EmptyState 
          reviewMode={reviewMode}
          onExitReviewMode={() => setReviewMode(false)}
          searchTerm={searchTerm}
        />
      ) : (
        <>
          {viewMode === 'card' && (
            <CardDeck 
              displayList={displayList}
              currentIndex={currentIndex}
              status={status}
              isFlipped={isFlipped}
              setIsFlipped={setIsFlipped}
              onNext={handleNext}
              onPrev={handlePrev}
              onAiExplain={handleAiExplain}
              onOpenMemo={handleOpenMemo}
              onEdit={() => setEditingItem(displayList[currentIndex])}
            />
          )}
          
          {viewMode === 'list' && (
            <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-2">
              <div className="space-y-2">
                {displayList.map((item, idx) => (
                  <FlipListItem 
                    key={item.id} 
                    item={item} 
                    index={idx} 
                    onSpeak={() => speak(item.sentence)}
                    badges={
                      <>
                        {status.completedIds.includes(item.id) && (
                          <div className="relative group/icon">
                            <CheckCircle size={14} className="text-green-500" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black/80 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover/icon:opacity-100 transition-opacity pointer-events-none z-10">
                              {t('learn.passed')} {status.quizStats?.[item.id]?.correct.join(', ') || 'N/A'}
                            </div>
                          </div>
                        )}
                        {status.incorrectIds.includes(item.id) && (
                          <div className="relative group/icon">
                            <AlertCircle size={14} className="text-red-500" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black/80 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover/icon:opacity-100 transition-opacity pointer-events-none z-10">
                              {t('learn.failed')} {status.quizStats?.[item.id]?.incorrect.join(', ') || t('learn.reviewNeeded')}
                            </div>
                          </div>
                        )}
                        {item.memo && (
                          <button 
                            onClick={(e) => {
                               e.stopPropagation(); 
                               setCurrentIndex(idx);
                               setAiExplanation(item.memo || '');
                               setShowAiModal(true);
                            }}
                            className="flex items-center gap-1 text-[10px] font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-1.5 py-0.5 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
                          >
                            <BookOpen size={10} /> {t('learn.memo')}
                          </button>
                        )}
                      </>
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showMemoList && (
        <MemoList 
          memoList={memoList} 
          onClose={() => setShowMemoList(false)}
          onUpdatePhrase={handleUpdatePhrase}
        />
      )}

      {showAiModal && (
        <AiTutorModal 
          aiExplanation={aiExplanation}
          setAiExplanation={setAiExplanation}
          isLoadingAi={isLoadingAi}
          onClose={() => setShowAiModal(false)}
          onSaveMemo={handleSaveMemo}
        />
      )}

      <EditPhraseModal 
        item={editingItem} 
        onSave={handleSaveEdit} 
        onCancel={() => setEditingItem(null)} 
      />
    </div>
  );
}
