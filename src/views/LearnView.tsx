
import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  X, 
  Shuffle,
  List as ListIcon,
  Grid as GridIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles,
  MessageCircleQuestion,
  Loader2,
} from 'lucide-react';
import type { LearningStatus, VocabItem } from '../types';
import { callGemini } from '../lib/gemini';
import { useVocabAppContext } from '../context/VocabContext';
import useLocalStorage from '../hooks/useLocalStorage';

// --- Learn View ---
export function LearnView() {
  const { vocabList, voiceURI, status, apiKey } = useVocabAppContext();

  const [viewMode, setViewMode] = useLocalStorage<'card' | 'list'>('learnViewMode', 'card');
  const [currentIndex, setCurrentIndex] = useLocalStorage<number>('learnCurrentIndex', 0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useLocalStorage<boolean>('learnIsShuffled', false);
  const [displayList, setDisplayList] = useState<VocabItem[]>(vocabList);
  const [filterTag, setFilterTag] = useLocalStorage<string>('learnFilterTag', 'All');
  const [searchTerm, setSearchTerm] = useLocalStorage<string>('learnSearchTerm', '');
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  const tags = ['All', ...Array.from(new Set(vocabList.flatMap(v => v.tags)))];

  useEffect(() => {
    let list = vocabList;
    
    // 1. Filter by Tag
    if (filterTag !== 'All') {
      list = vocabList.filter(v => v.tags.includes(filterTag));
    }

    // 2. Filter by Search Term
    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        list = list.filter(v => 
            v.meaning.toLowerCase().includes(lowerTerm) || 
            v.sentence.toLowerCase().includes(lowerTerm) ||
            (v.pronunciation && v.pronunciation.toLowerCase().includes(lowerTerm))
        );
    }

    // 3. Shuffle (only if enabled)
    if (isShuffled) {
      // Use a consistent seed or just re-shuffle? 
      // If we re-shuffle every time dependencies change, the list order changes wildly.
      // But here we just want to apply shuffle if the flag is on.
      // Ideally we'd persist the shuffled order too, but for now simple shuffle is fine.
      list = [...list].sort(() => Math.random() - 0.5);
    }

    setDisplayList(list);
    // Only reset index if it's out of bounds
    if (currentIndex >= list.length) {
      setCurrentIndex(0);
    }
    setIsFlipped(false);
    setAiExplanation('');
  }, [vocabList, filterTag, isShuffled, searchTerm]); // Removed currentIndex to avoid loop


  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (voiceURI) {
      const voice = window.speechSynthesis.getVoices().find(v => v.voiceURI === voiceURI);
      if (voice) utterance.voice = voice;
    }
    window.speechSynthesis.speak(utterance);
  };

  const handleNext = () => {
    window.speechSynthesis.cancel();
    setIsFlipped(false);
    setAiExplanation('');
    setShowAiModal(false);
    setCurrentIndex((prev) => (prev + 1) % displayList.length);
  };

  const handlePrev = () => {
    window.speechSynthesis.cancel();
    setIsFlipped(false);
    setAiExplanation('');
    setShowAiModal(false);
    setCurrentIndex((prev) => (prev - 1 + displayList.length) % displayList.length);
  };

  const handleAiExplain = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!apiKey) {
      alert("Please enter your Gemini API Key in Settings first.");
      return;
    }
    
    setShowAiModal(true);
    if (aiExplanation) return;

    setIsLoadingAi(true);
    try {
      const item = displayList[currentIndex];
      const prompt = `Please act as a language tutor. Explain the grammar, nuance, and vocabulary of this sentence: "${item.sentence}" (Meaning: "${item.meaning}"). Provide the breakdown in Korean. Keep it concise (under 200 characters if possible) and helpful.`;
      const text = await callGemini(prompt, apiKey);
      setAiExplanation(text);
    } catch (err: any) {
      setAiExplanation(`Error: ${err.message}`);
    } finally {
      setIsLoadingAi(false);
    }
  };

  if (displayList.length === 0 && !searchTerm) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p>표시할 데이터가 없습니다.</p>
        <p className="text-sm mt-2">빌더 탭에서 데이터를 추가하세요.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4 relative">
      {/* Unified Controls Container */}
      <div className="flex-none flex items-center justify-between gap-2 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        
        {/* Left: Tag Filter */}
        <select 
          value={filterTag} 
          onChange={(e) => setFilterTag(e.target.value)}
          className="bg-transparent text-sm font-medium focus:outline-none max-w-[80px] sm:max-w-[100px] truncate"
        >
          {tags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
        </select>

        {/* Middle: Search Bar (Flexible width) */}
        <div className="flex-1 relative min-w-0">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-7 p-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {searchTerm && (
                <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5"
                >
                    <X size={12} />
                </button>
            )}
        </div>
        
        {/* Right: Toggles */}
        <div className="flex gap-1 flex-none">
          <button 
              onClick={() => setIsShuffled(!isShuffled)}
              className={`p-2 rounded-lg transition-colors ${isShuffled ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-400'}`}
              title="Shuffle"
              type="button"
          >
              <Shuffle size={18} />
          </button>
          <div className="w-[1px] bg-gray-200 dark:bg-gray-700 mx-1"></div>
          <button 
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'card' ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-400'}`}
              title="Card View"
              type="button"
          >
              <GridIcon size={18} />
          </button>
          <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-400'}`}
              title="List View"
              type="button"
          >
              <ListIcon size={18} />
          </button>
        </div>
      </div>

      {/* Empty Search Result State */}
      {displayList.length === 0 && searchTerm && (
          <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
              <Search size={48} className="mb-2 opacity-20" />
              <p>No results found for "{searchTerm}"</p>
          </div>
      )}

      {/* AI Explanation Modal */}
      {showAiModal && (
        <div className="absolute inset-x-0 top-16 z-20 mx-4 p-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur shadow-2xl rounded-2xl border border-blue-100 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <Sparkles size={16} /> AI Tutor
            </h4>
            <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
          <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-200 min-h-[60px]">
            {isLoadingAi ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 size={16} className="animate-spin" /> Thinking...
              </div>
            ) : (
              aiExplanation
            )}
          </div>
        </div>
      )}

      {/* Card View - Dynamic Height */}
      {viewMode === 'card' && displayList.length > 0 && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-none mb-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 h-full transition-all duration-300" 
                style={{ width: `${((currentIndex + 1) / displayList.length) * 100}%` }}
              />
            </div>
            <div className="text-right text-xs text-gray-400 mt-1">
              {currentIndex + 1} / {displayList.length}
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center perspective-1000 min-h-0">
            <div 
              className="relative w-full max-w-md cursor-pointer group"
              onClick={() => {
                if (!isFlipped) speak(displayList[currentIndex].sentence);
                setIsFlipped(!isFlipped);
              }}
            >
              <div 
                className={`w-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''} grid grid-cols-1 grid-rows-1`}
              >
                {/* Front (Sentence) */}
                <div className="col-start-1 row-start-1 backface-hidden bg-blue-50 dark:bg-gray-800 rounded-3xl shadow-xl border border-blue-100 dark:border-gray-700 flex flex-col p-6 text-center min-h-[300px]">
                  <div className="flex-none mb-4">
                    <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Expression</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <h2 className="text-2xl md:text-3xl font-bold break-words w-full text-blue-900 dark:text-blue-100 leading-snug">
                      {displayList[currentIndex].sentence}
                    </h2>
                    {displayList[currentIndex].pronunciation && (
                      <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium text-lg break-words w-full">{displayList[currentIndex].pronunciation}</p>
                    )}
                    <div className="flex gap-2 mt-4 flex-wrap justify-center w-full">
                       {displayList[currentIndex].tags.map(tag => (
                         <span key={tag} className="text-xs px-2 py-1 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-500 flex-shrink-0">
                           #{tag}
                         </span>
                       ))}
                    </div>
                  </div>
                  <div className="flex-none mt-4 pt-2">
                    <div className="flex justify-center gap-4">
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); speak(displayList[currentIndex].sentence); }}
                        className="p-4 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 active:scale-95 transition-all"
                      >
                        <Volume2 size={24} />
                      </button>
                      <button 
                        type="button"
                        onClick={handleAiExplain}
                        className="p-4 bg-white dark:bg-gray-700 text-blue-500 dark:text-blue-300 rounded-full shadow-lg border border-blue-100 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-600 active:scale-95 transition-all"
                        title="AI Explain"
                      >
                        <MessageCircleQuestion size={24} />
                      </button>
                    </div>
                    <div className="text-gray-400 text-xs animate-pulse mt-4">
                      Tap to see meaning
                    </div>
                  </div>
                </div>

                {/* Back (Meaning) */}
                <div className="col-start-1 row-start-1 backface-hidden rotate-y-180 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col p-6 text-center min-h-[300px]">
                  <div className="flex-none mb-4">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Meaning</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <h2 className="text-2xl md:text-3xl font-bold break-words w-full leading-snug">
                      {displayList[currentIndex].meaning}
                    </h2>
                    <div className="flex gap-2 mt-6 flex-wrap justify-center w-full">
                       {status.completedIds.includes(displayList[currentIndex].id) && (
                         <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full font-medium flex-shrink-0">Learned</span>
                       )}
                       {status.incorrectIds.includes(displayList[currentIndex].id) && (
                         <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full font-medium flex-shrink-0">Review</span>
                       )}
                    </div>
                  </div>
                  {/* Spacer to match front height visual balance if needed, or just let flex handle it */}
                  <div className="flex-none mt-20"></div> 
                </div>
              </div>
            </div>
          </div>

          <div className="flex-none flex gap-4 mt-4 h-14">
            <button 
              type="button"
              onClick={handlePrev}
              className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 font-medium active:bg-gray-50 dark:active:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <ChevronLeft size={20} /> Prev
            </button>
            <button 
              type="button"
              onClick={handleNext}
              className="flex-1 bg-blue-500 text-white rounded-2xl shadow-md font-medium active:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              Next <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
      
      {viewMode === 'list' && displayList.length > 0 && (
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-2">
           <div className="space-y-2">
             {displayList.map((item, idx) => (
               <FlipListItem 
                 key={item.id} 
                 item={item} 
                 idx={idx} 
                 status={status} 
                 speak={speak} 
               />
             ))}
           </div>
        </div>
      )}
    </div>
  );
}

function FlipListItem({ item, idx, status, speak }: { item: VocabItem, idx: number, status: LearningStatus, speak: (t:string)=>void }) {
  const [showMeaning, setShowMeaning] = useState(false);

  return (
    <div 
      className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex justify-between items-center group cursor-pointer active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
      onClick={() => setShowMeaning(!showMeaning)}
    >
      <div className="flex-1 min-w-0 pr-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-blue-500 w-6 flex-none">{idx + 1}</span>
          <h4 className={`font-bold transition-all duration-300 ${showMeaning ? 'text-gray-500 dark:text-gray-400 text-sm' : 'text-blue-900 dark:text-blue-100 text-lg'}`}>
            {showMeaning ? item.meaning : item.sentence}
          </h4>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 pl-8 truncate min-h-[1.25rem]">
          {showMeaning ? (
             <span className="text-blue-500 font-medium">{item.sentence}</span>
          ) : (
             <span className="opacity-50 text-xs">Tap to reveal meaning</span>
          )}
        </p>
        <div className="flex gap-1 mt-1 pl-8">
           {status.completedIds.includes(item.id) && <div className="w-2 h-2 rounded-full bg-green-500" title="Learned"/>}
           {status.incorrectIds.includes(item.id) && <div className="w-2 h-2 rounded-full bg-red-500" title="Incorrect"/>}
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); speak(item.sentence); }}
        className="p-3 bg-white dark:bg-gray-600 rounded-full shadow-sm text-blue-500 active:scale-90 transition-transform"
      >
        <Volume2 size={18} />
      </button>
    </div>
  );
}
