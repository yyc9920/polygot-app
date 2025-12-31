import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
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
  BookOpen,
  Save,
  CheckSquare, 
  Square,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Pencil
} from 'lucide-react';
import type { LearningStatus, VocabItem } from '../types';
import { callGemini } from '../lib/gemini';
import { useVocabAppContext } from '../context/VocabContext';
import useLocalStorage from '../hooks/useLocalStorage';
import { FunButton } from '../components/FunButton';

// --- Learn View ---
export function LearnView() {
  const { vocabList, setVocabList, voiceURI, status, apiKey, reviewMode, setReviewMode } = useVocabAppContext();

  const [viewMode, setViewMode] = useLocalStorage<'card' | 'list'>('learnViewMode', 'card');
  const [currentIndex, setCurrentIndex] = useLocalStorage<number>('learnCurrentIndex', 0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useLocalStorage<boolean>('learnIsShuffled', false);
  const [displayList, setDisplayList] = useState<VocabItem[]>(vocabList);
  const [selectedTags, setSelectedTags] = useLocalStorage<string[]>('learnSelectedTags', []);
  const [searchTerm, setSearchTerm] = useLocalStorage<string>('learnSearchTerm', '');
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showMemoList, setShowMemoList] = useState(false);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  
  // Editing states
  const [isAiEditing, setIsAiEditing] = useState(false);
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState('');

  // Ref to track current displayList without adding to useEffect deps (avoids infinite loop)
  const displayListRef = React.useRef(displayList);
  useEffect(() => { displayListRef.current = displayList; }, [displayList]);

  // Extract all unique tags
  const allTags = Array.from(new Set(vocabList.flatMap(v => v.tags)));

  useEffect(() => {
    let list = vocabList;

    // 0. Review Mode Filter
    if (reviewMode) {
        list = list.filter(v => status.incorrectIds.includes(v.id));
    }
    
    // 1. Filter by Tags (Multiple)
    if (selectedTags.length > 0) {
      // Show items that have AT LEAST ONE of the selected tags
      list = list.filter(v => v.tags.some(tag => selectedTags.includes(tag)));
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

    // 3. Shuffle logic (Stable update)
    if (isShuffled) {
      const currentList = displayListRef.current;
      const currentIds = new Set(currentList.map(v => v.id));
      const newIds = new Set(list.map(v => v.id));

      // Check if the set of items is effectively the same (ignoring updates to content like memo)
      const isSameSet = currentIds.size === newIds.size && list.every(v => currentIds.has(v.id));

      if (isSameSet && currentList.length > 0) {
        // Preserve the current shuffled order, but update the item data
        const itemMap = new Map(list.map(v => [v.id, v]));
        list = currentList.map(v => itemMap.get(v.id)!);
      } else {
        // New set of items -> Re-shuffle
        list = [...list].sort(() => Math.random() - 0.5);
      }
    }

    setDisplayList(list);

    // 4. Handle UI State Reset
    // Only reset UI if the *current item* has changed ID or index is invalid
    // This allows updating data (like adding a memo) without closing the modal or flipping the card
    const prevItem = displayListRef.current[currentIndex];
    
    // Check if index needs reset
    if (currentIndex >= list.length) {
      setCurrentIndex(0);
      setIsFlipped(false);
      setAiExplanation('');
      setShowAiModal(false);
      setIsAiEditing(false);
    } else {
      const newItem = list[currentIndex];
      // If the item ID at the current index changed, reset the view
      if (!prevItem || newItem.id !== prevItem.id) {
         setIsFlipped(false);
         setAiExplanation('');
         setShowAiModal(false);
         setIsAiEditing(false);
         setEditingMemoId(null);
      }
      // Otherwise (same item ID), keep the UI state (modal open, card flipped, etc.)
    }
    
  }, [vocabList, selectedTags, isShuffled, searchTerm, reviewMode, status.incorrectIds]);


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
    setIsAiEditing(false);
    setEditingMemoId(null);
    setCurrentIndex((prev: number) => (prev + 1) % displayList.length);
  };

  const handlePrev = () => {
    window.speechSynthesis.cancel();
    setIsFlipped(false);
    setAiExplanation('');
    setShowAiModal(false);
    setIsAiEditing(false);
    setEditingMemoId(null);
    setCurrentIndex((prev: number) => (prev - 1 + displayList.length) % displayList.length);
  };

  const startEditing = (id: string, currentText: string) => {
      setEditingMemoId(id);
      setEditBuffer(currentText);
  };

  const saveEdit = (id: string) => {
      setVocabList(prev => prev.map(item => 
          item.id === id ? { ...item, memo: editBuffer } : item
      ));
      setEditingMemoId(null);
      setEditBuffer('');
  };

  const cancelEdit = () => {
      setEditingMemoId(null);
      setEditBuffer('');
  };

  const handleAiExplain = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!apiKey) {
      alert("Please enter your Gemini API Key in Settings first.");
      return;
    }
    
    setShowAiModal(true);
    setIsAiEditing(false);

    if (aiExplanation) return;

    setIsLoadingAi(true);
    try {
      const item = displayList[currentIndex];
      const tagsStr = item.tags && item.tags.length > 0 ? `Tags: ${item.tags.join(', ')}` : '';
      const pronStr = item.pronunciation ? `Pronunciation: ${item.pronunciation}` : '';
      
      const prompt = `
      Analyze this sentence as a friendly language tutor.
      
      Sentence: "${item.sentence}"
      Meaning: "${item.meaning}"
      ${pronStr}
      ${tagsStr}

      Please provide a structured explanation in Korean using **Markdown** format:
      - Use **bold** for key terms.
      - Use lists for multiple points.
      - Structure:
        ### 🧩 문법 (Grammar)
        Brief breakdown...
        ### 💡 뉘앙스 (Nuance)
        Contextual usage...
        ### 📖 단어 (Vocabulary)
        Key words...

      Keep the total response concise.
      Do not contain greetings or any small talks. Just straight through the point.
      `;
      const text = await callGemini(prompt, apiKey);
      setAiExplanation(text);
    } catch (err: any) {
      setAiExplanation(`Error: ${err.message}`);
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
      setIsAiEditing(false);
    }
  };

  const handleSaveMemo = () => {
      if (!aiExplanation) return;
      const currentItem = displayList[currentIndex];
      setVocabList(prev => prev.map(item => 
          item.id === currentItem.id ? { ...item, memo: aiExplanation } : item
      ));
      alert("Memo saved!");
  };

  const toggleTag = (tag: string) => {
      if (selectedTags.includes(tag)) {
          setSelectedTags(selectedTags.filter(t => t !== tag));
      } else {
          setSelectedTags([...selectedTags, tag]);
      }
  };

  // Memo List Filter
  const memoList = vocabList.filter(v => v.memo);

  if (displayList.length === 0) {
      if (reviewMode) {
          return (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-4">
                  <p>복습할 항목이 없습니다.</p>
                  <FunButton onClick={() => setReviewMode(false)} variant="primary">
                      학습 모드로 돌아가기
                  </FunButton>
              </div>
          );
      }
      if (!searchTerm && selectedTags.length === 0 && !showMemoList) {
        return (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p>표시할 데이터가 없습니다.</p>
            <p className="text-sm mt-2">빌더 탭에서 데이터를 추가하세요.</p>
          </div>
        );
      }
  }

  return (
    <div className="flex flex-col h-full gap-4 relative">
      {/* Review Mode Banner */}
      {reviewMode && (
          <div className="flex-none bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-2 rounded-xl text-sm font-bold flex items-center justify-between">
              <span className="flex items-center gap-2"><AlertCircle size={16}/> Review Session Active</span>
              <button onClick={() => setReviewMode(false)} className="text-xs underline">Exit</button>
          </div>
      )}

      {/* Unified Controls Container */}
      <div className="flex-none flex flex-col gap-3 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 z-10">
        
        {/* Row 1: Search and Tools */}
        <div className="flex items-center gap-2 w-full">
            {/* Search Bar (Flexible width) */}
            <div className="flex-1 relative min-w-0">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-7 p-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
                onClick={() => setShowMemoList(true)}
                className={`p-2 rounded-lg transition-colors text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20`}
                title="Memo List"
                type="button"
            >
                <BookOpen size={18} />
            </button>

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

        {/* Row 2: Tag Filters */}
        <div className="flex items-center gap-2 w-full">
            <div className="relative flex-none z-20">
                <button 
                    onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                    className={`flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                        isTagDropdownOpen 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' 
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                    }`}
                >
                    <span className="whitespace-nowrap">
                        Tags
                    </span>
                    <ChevronDown size={14} className={`transition-transform ${isTagDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Tag Dropdown Overlay */}
                {isTagDropdownOpen && (
                    <>
                        <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsTagDropdownOpen(false)}
                        />
                        <div className="absolute top-full left-0 mt-1 w-48 max-h-60 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
                            {allTags.map(tag => (
                                <div 
                                    key={tag} 
                                    onClick={() => toggleTag(tag)}
                                    className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer text-sm"
                                >
                                    {selectedTags.includes(tag) ? <CheckSquare size={16} className="text-blue-500" /> : <Square size={16} className="text-gray-300" />}
                                    <span className="truncate">{tag}</span>
                                </div>
                            ))}
                            {allTags.length === 0 && <div className="text-xs text-gray-400 p-2">No tags available</div>}
                        </div>
                    </>
                )}
            </div>

            {/* Selected Tags Chips */}
            <div className="flex-1 overflow-x-auto flex items-center gap-2 scrollbar-hide">
                {selectedTags.length > 0 ? (
                    selectedTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className="flex-none flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 text-xs rounded-full border border-blue-100 dark:border-blue-800 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors group animate-in fade-in zoom-in-95 duration-200"
                            title="Remove tag"
                        >
                            <span className="font-medium">#{tag}</span>
                            <X size={12} className="opacity-60 group-hover:opacity-100" />
                        </button>
                    ))
                ) : (
                    <span className="text-xs text-gray-400 italic pl-1">No tags selected</span>
                )}
            </div>
        </div>
      </div>

      {/* Empty Search Result State */}
      {displayList.length === 0 && searchTerm && (
          <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
              <Search size={48} className="mb-2 opacity-20" />
              <p>No results found for "{searchTerm}"</p>
          </div>
      )}

      {/* Memo List Overlay */}
      {showMemoList && (
          <div className="absolute inset-0 z-50 bg-white dark:bg-gray-900 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <h2 className="text-lg font-bold flex items-center gap-2"><BookOpen className="text-blue-500"/> My Memos</h2>
                  <button onClick={() => setShowMemoList(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                      <X size={20} />
                  </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {memoList.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                          <BookOpen size={48} className="mb-4 opacity-20"/>
                          <p>No saved memos yet.</p>
                          <p className="text-sm">Use the AI Tutor to save explanations.</p>
                      </div>
                  ) : (
                      memoList.map(item => (
                          <div key={item.id} className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-xl relative">
                               <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-1 text-lg">{item.sentence}</h4>
                               
                               <div className="flex flex-wrap gap-2 mb-2">
                                  {item.pronunciation && (
                                    <span className="text-xs text-gray-500 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">/{item.pronunciation}/</span>
                                  )}
                                  {item.tags.map(tag => (
                                    <span key={tag} className="text-xs text-blue-500 border border-blue-200 dark:border-blue-900 px-2 py-0.5 rounded">#{tag}</span>
                                  ))}
                               </div>

                               <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 italic">Meaning: {item.meaning}</p>
                               
                               {editingMemoId === item.id ? (
                                   <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-blue-200 dark:border-blue-900">
                                       <textarea 
                                           className="w-full h-32 p-2 text-sm text-gray-700 dark:text-gray-200 bg-transparent resize-none focus:outline-none"
                                           value={editBuffer}
                                           onChange={(e) => setEditBuffer(e.target.value)}
                                       />
                                       <div className="flex justify-end gap-2 mt-2">
                                           <button onClick={cancelEdit} className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Cancel</button>
                                           <button onClick={() => saveEdit(item.id)} className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">Save</button>
                                       </div>
                                   </div>
                               ) : (
                                   <div className="relative group/memo">
                                        <div className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg border border-yellow-100 dark:border-gray-700 p-3 prose prose-sm dark:prose-invert max-w-none">
                                            <ReactMarkdown>
                                                {item.memo}
                                            </ReactMarkdown>
                                        </div>
                                        <button 
                                            onClick={() => startEditing(item.id, item.memo || '')}
                                            className="absolute top-2 right-2 p-1.5 bg-white dark:bg-gray-700 rounded shadow-sm text-gray-400 hover:text-blue-500 opacity-0 group-hover/memo:opacity-100 transition-opacity"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                   </div>
                               )}

                               <button 
                                 onClick={() => {
                                     // Delete memo
                                     setVocabList(prev => prev.map(v => v.id === item.id ? { ...v, memo: undefined } : v));
                                 }}
                                 className="absolute top-2 right-2 text-gray-300 hover:text-red-400"
                               >
                                   <X size={14} />
                               </button>
                          </div>
                      ))
                  )}
              </div>
          </div>
      )}

      {/* AI Explanation Modal */}
      {showAiModal && (
        <div className="absolute inset-x-0 top-16 z-20 mx-4 p-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur shadow-2xl rounded-2xl border border-blue-100 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <Sparkles size={16} /> AI Tutor
            </h4>
            <div className="flex gap-2">
                {!isLoadingAi && aiExplanation && (
                    <>
                    <button 
                        onClick={() => setIsAiEditing(!isAiEditing)}
                        className={`text-gray-400 hover:text-blue-500 p-1 rounded ${isAiEditing ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' : ''}`}
                    >
                        <Pencil size={16}/>
                    </button>
                    <button onClick={handleSaveMemo} className="text-blue-500 hover:text-blue-600 text-sm font-bold flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                        <Save size={14}/> Save
                    </button>
                    </>
                )}
                <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
                </button>
            </div>
          </div>
          <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-200 min-h-[60px]">
            {isLoadingAi ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 size={16} className="animate-spin" /> Thinking...
              </div>
            ) : isAiEditing ? (
              <textarea 
                  className="w-full h-64 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  value={aiExplanation}
                  onChange={(e) => setAiExplanation(e.target.value)}
                  placeholder="Edit explanation..."
              />
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>
                  {aiExplanation}
                </ReactMarkdown>
              </div>
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

          <div className="flex-1 flex flex-col items-center perspective-1000 min-h-0 overflow-y-auto">
            <div 
              className="relative w-full max-w-md cursor-pointer group my-auto"
              onClick={() => {
                if (!isFlipped) speak(displayList[currentIndex].sentence);
                setIsFlipped(!isFlipped);
              }}
            >
              <div 
                className={`w-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''} grid grid-cols-1 grid-rows-1`}
              >
                {/* Front (Sentence) */}
                <div className="col-start-1 row-start-1 backface-hidden bg-blue-50 dark:bg-gray-800 rounded-3xl shadow-xl border border-blue-100 dark:border-gray-700 flex flex-col p-6 text-center min-h-[200px] relative">
                  <div className="absolute top-4 right-4 flex gap-1">
                    {status.completedIds.includes(displayList[currentIndex].id) && (
                      <CheckCircle className="text-green-500" size={24} />
                    )}
                    {status.incorrectIds.includes(displayList[currentIndex].id) && (
                      <AlertCircle className="text-red-500" size={24} />
                    )}
                  </div>
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
                    {/* Memo Indicator / Button */}
                    {displayList[currentIndex].memo && (
                        <button 
                            type="button"
                            onClick={handleOpenMemo}
                            className="mt-4 flex items-center gap-1 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1.5 rounded-full text-xs font-bold border border-yellow-200 dark:border-yellow-900/50 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
                        >
                            <BookOpen size={12} /> View Memo
                        </button>
                    )}
                  </div>
                  <div className="flex-none mt-4 pt-2">
                    <div className="flex justify-center gap-3">
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); speak(displayList[currentIndex].sentence); }}
                        className="p-4 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 active:scale-95 transition-all"
                        title="Speak"
                      >
                        <Volume2 size={24} />
                      </button>
                      
                      {displayList[currentIndex].memo && (
                        <button 
                          type="button"
                          onClick={handleOpenMemo}
                          className="p-4 bg-yellow-500 text-white rounded-full shadow-lg hover:bg-yellow-600 active:scale-95 transition-all animate-in zoom-in duration-300"
                          title="View Memo"
                        >
                          <BookOpen size={24} />
                        </button>
                      )}

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
                <div className="col-start-1 row-start-1 backface-hidden rotate-y-180 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col p-6 text-center min-h-[200px] relative">
                  <div className="absolute top-4 right-4 flex gap-1">
                    {status.completedIds.includes(displayList[currentIndex].id) && (
                      <CheckCircle className="text-green-500" size={24} />
                    )}
                    {status.incorrectIds.includes(displayList[currentIndex].id) && (
                      <AlertCircle className="text-red-500" size={24} />
                    )}
                  </div>
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
                  <div className="flex-none mt-20"></div> 
                </div>
              </div>
            </div>
          </div>

          <div className="flex-none flex gap-4 mt-4 h-14">
            <FunButton 
              type="button"
              onClick={handlePrev}
              className="flex-1 flex items-center justify-center gap-2"
              variant="neutral"
            >
              <ChevronLeft size={20} /> Prev
            </FunButton>
            <FunButton 
              type="button"
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2"
              variant="primary"
            >
              Next <ChevronRight size={20} />
            </FunButton>
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
                 onOpenMemo={() => {
                    setCurrentIndex(idx);
                    setAiExplanation(item.memo || '');
                    setShowAiModal(true);
                    setIsAiEditing(false);
                 }}
               />
             ))}
           </div>
        </div>
      )}
    </div>
  );
}

function FlipListItem({ item, idx, status, speak, onOpenMemo }: { 
    item: VocabItem, 
    idx: number, 
    status: LearningStatus, 
    speak: (t:string)=>void,
    onOpenMemo?: () => void
}) {
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
        <div className="flex gap-1 mt-1 pl-8 items-center">
           {status.completedIds.includes(item.id) && <CheckCircle size={14} className="text-green-500" />}
           {status.incorrectIds.includes(item.id) && <AlertCircle size={14} className="text-red-500" />}
           {item.memo && (
               <button 
                onClick={(e) => { e.stopPropagation(); onOpenMemo?.(); }}
                className="flex items-center gap-1 text-[10px] font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-1.5 py-0.5 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
               >
                 <BookOpen size={10} /> MEMO
               </button>
           )}
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