import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Brain, 
  Settings, 
  PlusCircle, 
  Moon, 
  Sun, 
  Upload, 
  Download, 
  Trash2, 
  Volume2, 
  Check, 
  X, 
  Shuffle,
  RefreshCw,
  List as ListIcon,
  Grid as GridIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  Link as LinkIcon,
  Sparkles,
  MessageCircleQuestion,
  Loader2,
  Key,
  Filter,
  Type
} from 'lucide-react';

/**
 * ------------------------------------------------------------------
 * 1. Utilities & Core Logic
 * ------------------------------------------------------------------
 */

const generateId = (meaning: string, sentence: string): string => {
  const input = `${meaning.trim()}|${sentence.trim()}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
};

// Enhanced Fuzzy Matching
const checkAnswer = (input: string, answer: string): boolean => {
  const normalize = (str: string) => 
    str.toLowerCase()
       .replace(/[.,?!:;'"(){}\[\]<>~`\-\u3000-\u303F]/g, '') // punctuation
       .replace(/\s+/g, ''); // spaces
  return normalize(input) === normalize(answer);
};

// Improved CSV Parser
const parseCSV = (text: string) => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let inQuotes = false;
  
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  for (let i = 0; i < normalizedText.length; i++) {
    const char = normalizedText[i];
    
    if (inQuotes) {
      if (char === '"' && normalizedText[i + 1] === '"') {
        currentVal += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentVal.trim());
        currentVal = '';
      } else if (char === '\n') {
        currentRow.push(currentVal.trim());
        if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== '')) {
            rows.push(currentRow);
        }
        currentRow = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
  }
  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== '')) {
        rows.push(currentRow);
    }
  }
  return rows;
};

const callGemini = async (prompt: string, apiKey: string) => {
  if (!apiKey) throw new Error("API Key is missing. Please set it in Settings.");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Gemini API Error");
  }

  const result = await response.json();
  return result.candidates?.[0]?.content?.parts?.[0]?.text || "";
};


/**
 * ------------------------------------------------------------------
 * 2. Types
 * ------------------------------------------------------------------
 */

interface VocabItem {
  id: string;
  meaning: string;
  sentence: string;
  pronunciation?: string;
  tags: string[];
}

// Extended Quiz Item to support multiple types
type QuizType = 'writing' | 'interpretation' | 'cloze';

interface QuizItem extends VocabItem {
  type: QuizType;
  questionText: string; // The text shown to user
  answerText: string;   // The expected answer
  hint?: string;        // Additional hint (e.g. masked sentence for cloze)
}

interface LearningStatus {
  completedIds: string[];
  incorrectIds: string[];
}

type ViewMode = 'learn' | 'quiz' | 'builder' | 'settings';

/**
 * ------------------------------------------------------------------
 * 3. Components
 * ------------------------------------------------------------------
 */

const SAMPLE_DATA: VocabItem[] = [
  { id: generateId("안녕하세요", "こんにちは"), meaning: "안녕하세요", sentence: "こんにちは", pronunciation: "Konnichiwa", tags: ["Greeting", "Japanese"] },
  { id: generateId("감사합니다", "Obrigado"), meaning: "감사합니다", sentence: "Obrigado", pronunciation: "Obrigado", tags: ["Greeting", "Portuguese"] },
  { id: generateId("이 노래는 시티팝입니다", "この歌はシティポップです"), meaning: "이 노래는 시티팝입니다", sentence: "この歌はシティポップです", pronunciation: "Kono uta wa City Pop desu", tags: ["Music", "Japanese"] },
  { id: generateId("저는 엔지니어입니다", "Eu sou engenheiro"), meaning: "저는 엔지니어입니다", sentence: "Eu sou engenheiro", pronunciation: "Eu sou engenheiro", tags: ["Job", "Portuguese"] },
  { id: generateId("재즈를 좋아합니다", "Jazzが好きです"), meaning: "재즈를 좋아합니다", sentence: "Jazzが好きです", pronunciation: "Jazz ga suki desu", tags: ["Music", "Japanese"] },
];

export default function App() {
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [status, setStatus] = useState<LearningStatus>({ completedIds: [], incorrectIds: [] });
  const [currentView, setCurrentView] = useState<ViewMode>('learn');
  const [darkMode, setDarkMode] = useState(false);
  const [voiceURI, setVoiceURI] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    const savedVocab = localStorage.getItem('vocabList');
    const savedStatus = localStorage.getItem('learningStatus');
    const savedTheme = localStorage.getItem('theme');
    const savedKey = localStorage.getItem('geminiApiKey');
    
    if (savedVocab) {
      try {
        const parsed = JSON.parse(savedVocab);
        const uniqueList = parsed.filter((item: VocabItem, index: number, self: VocabItem[]) => 
          index === self.findIndex((t) => t.id === item.id)
        );
        setVocabList(uniqueList);
      } catch (e) {
        setVocabList(SAMPLE_DATA);
      }
    } else {
      setVocabList(SAMPLE_DATA);
    }

    if (savedStatus) setStatus(JSON.parse(savedStatus));
    
    if (savedTheme === 'dark') setDarkMode(true);
    if (savedKey) setApiKey(savedKey);
  }, []);

  useEffect(() => {
    localStorage.setItem('vocabList', JSON.stringify(vocabList));
    localStorage.setItem('learningStatus', JSON.stringify(status));
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    if (apiKey) localStorage.setItem('geminiApiKey', apiKey);
    
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [vocabList, status, darkMode, apiKey]);

  const handleReset = () => {
    if (confirm('모든 학습 기록을 초기화하시겠습니까?')) {
      setStatus({ completedIds: [], incorrectIds: [] });
    }
  };

  const handleDeleteAllData = () => {
    if (confirm('모든 데이터를 삭제하시겠습니까? (복구 불가)')) {
      setVocabList([]);
      setStatus({ completedIds: [], incorrectIds: [] });
    }
  };

  return (
    <div className={`fixed inset-0 flex flex-col transition-colors duration-300 ${darkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} font-sans`}>
      {/* Header */}
      <header className="flex-none sticky top-0 z-10 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 px-4 h-14 flex items-center justify-between">
        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent truncate pr-4 flex items-center gap-2">
          Learn Language via CSV <Sparkles size={16} className="text-yellow-500" />
        </h1>
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="flex-none p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          type="button"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden w-full max-w-md mx-auto relative">
        <div className="absolute inset-0 overflow-y-auto p-4 pb-20">
          {currentView === 'learn' && (
            <LearnView 
              vocabList={vocabList} 
              voiceURI={voiceURI} 
              status={status}
              apiKey={apiKey}
            />
          )}
          {currentView === 'quiz' && (
            <QuizView 
              vocabList={vocabList} 
              status={status} 
              setStatus={setStatus} 
            />
          )}
          {currentView === 'builder' && (
            <BuilderView 
              vocabList={vocabList} 
              setVocabList={setVocabList} 
              apiKey={apiKey}
            />
          )}
          {currentView === 'settings' && (
            <SettingsView 
              voiceURI={voiceURI} 
              setVoiceURI={setVoiceURI} 
              handleReset={handleReset}
              handleDeleteAllData={handleDeleteAllData}
              status={status}
              totalCount={vocabList.length}
              apiKey={apiKey}
              setApiKey={setApiKey}
            />
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-none bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe z-20">
        <div className="max-w-md mx-auto flex justify-around items-center h-16">
          <NavButton 
            active={currentView === 'learn'} 
            onClick={() => setCurrentView('learn')} 
            icon={<BookOpen size={24} />} 
            label="학습" 
          />
          <NavButton 
            active={currentView === 'quiz'} 
            onClick={() => setCurrentView('quiz')} 
            icon={<Brain size={24} />} 
            label="퀴즈" 
          />
          <NavButton 
            active={currentView === 'builder'} 
            onClick={() => setCurrentView('builder')} 
            icon={<PlusCircle size={24} />} 
            label="빌더" 
          />
          <NavButton 
            active={currentView === 'settings'} 
            onClick={() => setCurrentView('settings')} 
            icon={<Settings size={24} />} 
            label="설정" 
          />
        </div>
      </nav>
      
      <GlobalStyles />
    </div>
  );
}

// ... (Sub-Views) ...

// --- Learn View ---
function LearnView({ vocabList, voiceURI, status, apiKey }: { vocabList: VocabItem[], voiceURI: string | null, status: LearningStatus, apiKey: string }) {
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [displayList, setDisplayList] = useState<VocabItem[]>(vocabList);
  const [filterTag, setFilterTag] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
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
      list = [...list].sort(() => Math.random() - 0.5);
    }

    setDisplayList(list);
    setCurrentIndex(0);
    setIsFlipped(false);
    setAiExplanation('');
  }, [vocabList, filterTag, isShuffled, searchTerm]);

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

// --- Enhanced Quiz View ---
function QuizView({ vocabList, status, setStatus }: { vocabList: VocabItem[], status: LearningStatus, setStatus: React.Dispatch<React.SetStateAction<LearningStatus>> }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [quizQueue, setQuizQueue] = useState<QuizItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'incorrect'>('none');
  
  // Setup States
  const [mode, setMode] = useState<'all' | 'incorrect' | 'tag'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [quizType, setQuizType] = useState<'random' | 'writing' | 'interpretation' | 'cloze'>('writing');

  const tags = [...Array.from(new Set(vocabList.flatMap(v => v.tags)))];

  // Helper to create Cloze item
  const createCloze = (item: VocabItem): QuizItem => {
    const sentence = item.sentence.trim();
    // Check if space-separated
    const hasSpaces = sentence.includes(' ');
    
    let target = "";
    let masked = "";

    if (hasSpaces) {
      // Space-separated logic (Portuguese, English)
      const words = sentence.split(' ');
      // Filter out very short words (1 char) unless that's all there is
      const candidateIndices = words.map((w, i) => w.length > 1 ? i : -1).filter(i => i !== -1);
      const indices = candidateIndices.length > 0 ? candidateIndices : words.map((_, i) => i);
      
      const startIdx = indices[Math.floor(Math.random() * indices.length)];
      
      // Decide if we mask 1 or 2 words (30% chance for 2 words if possible)
      const count = (Math.random() > 0.7 && startIdx < words.length - 1) ? 2 : 1;
      
      const targetWords = words.slice(startIdx, startIdx + count);
      target = targetWords.join(' ');
      
      // Replace words with blank. Note: replace only the specific occurrence
      // To do this safely with duplicates, we reconstruct the array
      const newWords = [...words];
      for (let i = 0; i < count; i++) {
        newWords[startIdx + i] = "______";
      }
      masked = newWords.join(' ');

    } else {
      // Non-space logic (Japanese)
      const len = sentence.length;
      if (len <= 4) {
        // Very short: mask 50%
        const maskLen = Math.max(1, Math.floor(len / 2));
        const start = Math.floor(Math.random() * (len - maskLen + 1));
        target = sentence.substring(start, start + maskLen);
        masked = sentence.substring(0, start) + "______" + sentence.substring(start + maskLen);
      } else {
        // Longer: mask 2-4 chars (simulating a word)
        const maskLen = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4
        const start = Math.floor(Math.random() * (len - maskLen)); // Ensure strictly inside or at bounds
        target = sentence.substring(start, start + maskLen);
        masked = sentence.substring(0, start) + "______" + sentence.substring(start + maskLen);
      }
    }
    
    return {
      ...item,
      type: 'cloze',
      questionText: item.meaning,
      hint: masked, // Show sentence with blank as hint
      answerText: target // User answers the missing word
    };
  };

  const startQuiz = () => {
    let list = [...vocabList];

    // 1. Filter by Scope
    if (mode === 'incorrect') {
      list = list.filter(v => status.incorrectIds.includes(v.id));
    } else if (mode === 'tag' && selectedTag) {
      list = list.filter(v => v.tags.includes(selectedTag));
    }

    if (list.length === 0) {
      alert('선택한 범위에 데이터가 없습니다.');
      return;
    }

    // 2. Shuffle
    list = list.sort(() => Math.random() - 0.5);

    // 3. Transform to QuizItems based on Type
    const queue: QuizItem[] = list.map(item => {
      let type = quizType;
      
      // Handle Random Type
      if (type === 'random') {
        const types: QuizType[] = ['writing', 'interpretation', 'cloze'];
        type = types[Math.floor(Math.random() * types.length)];
      }

      if (type === 'interpretation') {
        return {
          ...item,
          type: 'interpretation',
          questionText: item.sentence,
          answerText: item.meaning
        };
      } else if (type === 'cloze') {
        return createCloze(item);
      } else {
        // Default: Writing
        return {
          ...item,
          type: 'writing',
          questionText: item.meaning,
          answerText: item.sentence
        };
      }
    });

    setQuizQueue(queue);
    setCurrentIndex(0);
    setInput('');
    setFeedback('none');
    setIsPlaying(true);
  };

  const submitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback !== 'none') return; 

    const currentItem = quizQueue[currentIndex];
    
    // Check answer logic depends on type? 
    // Actually our `checkAnswer` fuzzy matcher handles most cases nicely.
    // For Cloze, `answerText` is just the missing word.
    const isCorrect = checkAnswer(input, currentItem.answerText);

    setFeedback(isCorrect ? 'correct' : 'incorrect');

    setStatus(prev => {
      const newCompleted = isCorrect 
        ? [...new Set([...prev.completedIds, currentItem.id])]
        : prev.completedIds;
      
      const newIncorrect = !isCorrect
        ? [...new Set([...prev.incorrectIds, currentItem.id])]
        : isCorrect 
          ? prev.incorrectIds.filter(id => id !== currentItem.id) 
          : prev.incorrectIds;

      return { completedIds: newCompleted, incorrectIds: newIncorrect };
    });
  };

  const nextQuestion = () => {
    if (currentIndex < quizQueue.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setInput('');
      setFeedback('none');
    } else {
      alert('퀴즈가 종료되었습니다!');
      setIsPlaying(false);
    }
  };

  if (!isPlaying) {
    return (
      <div className="h-full flex flex-col justify-center gap-6 p-2">
        <div className="text-center mb-4">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-500 mx-auto mb-4">
            <Brain size={40} />
          </div>
          <h2 className="text-2xl font-bold">Quiz Setup</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Customize your practice session</p>
        </div>
        
        {/* Scope Selection */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <Filter size={16} /> Scope (범위)
          </h3>
          <div className="flex gap-2 mb-3">
            <button 
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}
              onClick={() => setMode('all')}
            >
              All
            </button>
            <button 
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'incorrect' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}
              onClick={() => setMode('incorrect')}
            >
              Review ({status.incorrectIds.length})
            </button>
            <button 
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'tag' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}
              onClick={() => setMode('tag')}
            >
              Tags
            </button>
          </div>
          {mode === 'tag' && (
            <select 
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full p-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm"
            >
              <option value="">Select a tag...</option>
              {tags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>

        {/* Type Selection */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <Type size={16} /> Type (유형)
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'writing', label: '✍️ Writing' },
              { id: 'interpretation', label: '🗣️ Meaning' },
              { id: 'cloze', label: '🧩 Cloze' },
              { id: 'random', label: '🔀 Random' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setQuizType(t.id as any)}
                className={`py-3 px-2 text-xs font-bold rounded-xl transition-all border-2 ${
                  quizType === t.id 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300' 
                    : 'border-transparent bg-gray-100 dark:bg-gray-700 text-gray-500'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={startQuiz}
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95"
        >
          Start Quiz
        </button>
      </div>
    );
  }

  const currentItem = quizQueue[currentIndex];

  return (
    <div className="flex flex-col h-full max-w-sm mx-auto pt-8">
      <div className="flex justify-between text-sm text-gray-400 mb-2">
        <span>Question {currentIndex + 1}</span>
        <span>{quizQueue.length} total</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full mb-8">
        <div 
          className="bg-blue-500 h-full rounded-full transition-all" 
          style={{ width: `${((currentIndex) / quizQueue.length) * 100}%` }}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 text-center">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          {currentItem.type === 'interpretation' ? 'Translate to Native' : 
           currentItem.type === 'cloze' ? 'Fill in the blank' : 'Translate to Target'}
        </span>
        <h3 className="text-xl font-bold mt-4 leading-snug break-keep">
          {currentItem.questionText}
        </h3>
        {/* For Cloze, show the hinted sentence */}
        {currentItem.type === 'cloze' && (
          <p className="mt-4 text-blue-600 dark:text-blue-300 font-mono text-lg p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            {currentItem.hint}
          </p>
        )}
      </div>

      <form onSubmit={submitAnswer} className="flex flex-col gap-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={currentItem.type === 'cloze' ? "Type the missing word..." : "Type answer..."}
          className={`w-full p-4 rounded-xl border-2 bg-transparent text-lg outline-none transition-colors
            ${feedback === 'none' ? 'border-gray-200 dark:border-gray-700 focus:border-blue-500' : ''}
            ${feedback === 'correct' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : ''}
            ${feedback === 'incorrect' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : ''}
          `}
          readOnly={feedback !== 'none'}
          autoFocus
        />

        {feedback === 'none' ? (
          <button 
            type="submit" 
            className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold shadow-md hover:bg-blue-600 active:scale-95 transition-transform"
          >
            Check Answer
          </button>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            {feedback === 'incorrect' && (
              <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-xl mb-4 text-center">
                <p className="text-xs text-red-500 font-bold uppercase mb-1">Correct Answer</p>
                <p className="text-lg font-bold text-red-700 dark:text-red-300">{currentItem.answerText}</p>
                {currentItem.type !== 'interpretation' && currentItem.type !== 'cloze' && (
                   <p className="text-sm text-red-600/70 mt-1">{currentItem.pronunciation}</p>
                )}
                {currentItem.type === 'cloze' && (
                   <p className="text-sm text-red-600/70 mt-1">Full: {currentItem.sentence}</p>
                )}
              </div>
            )}
            {feedback === 'correct' && (
               <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-xl mb-4 text-center text-green-700 dark:text-green-300 font-bold">
                 Correct! 🎉
               </div>
            )}
            <button 
              type="button" 
              onClick={nextQuestion}
              className={`w-full py-3 rounded-xl font-bold shadow-md transition-transform active:scale-95 text-white
                ${feedback === 'correct' ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-800 hover:bg-gray-900'}
              `}
            >
              Next Question &rarr;
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

// ... (BuilderView and SettingsView remain unchanged) ...
function BuilderView({ vocabList, setVocabList, apiKey }: { vocabList: VocabItem[], setVocabList: React.Dispatch<React.SetStateAction<VocabItem[]>>, apiKey: string }) {
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('ai'); 
  const [form, setForm] = useState({ meaning: '', sentence: '', pronunciation: '', tags: '' });
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.meaning || !form.sentence) return;
    const newItem: VocabItem = {
      id: generateId(form.meaning, form.sentence),
      meaning: form.meaning,
      sentence: form.sentence,
      pronunciation: form.pronunciation,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
    };
    setVocabList(prev => {
        if (prev.some(v => v.id === newItem.id)) {
            alert(`"${form.meaning}" is already in your list!`);
            return prev;
        }
        return [...prev, newItem];
    });
    setForm({ meaning: '', sentence: '', pronunciation: '', tags: '' });
  };

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      alert("Please enter your Gemini API Key in Settings first.");
      return;
    }
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
      const prompt = `Generate ${aiCount} vocabulary items for learning language about '${aiPrompt}'. Return ONLY a JSON array...`; 
      const resultText = await callGemini(prompt, apiKey);
      const jsonStr = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      const generatedItems = JSON.parse(jsonStr);
      if (Array.isArray(generatedItems)) {
        const newItems = generatedItems.map((item: any) => ({
          id: generateId(item.meaning, item.sentence),
          meaning: item.meaning,
          sentence: item.sentence,
          pronunciation: item.pronunciation || '',
          tags: Array.isArray(item.tags) ? item.tags : []
        }));
        if (newItems.length > 0) {
           setVocabList(prev => {
             const existingIds = new Set(prev.map(p => p.id));
             const uniqueNew = newItems.filter(item => !existingIds.has(item.id));
             const reallyUnique: VocabItem[] = [];
             const seenInBatch = new Set();
             for(const item of uniqueNew) {
               if(!seenInBatch.has(item.id)) {
                 seenInBatch.add(item.id);
                 reallyUnique.push(item);
               }
             }
             if (reallyUnique.length === 0) {
               alert("All generated items were duplicates!");
               return prev;
             }
             alert(`✨ Successfully generated ${reallyUnique.length} new items!`);
             return [...prev, ...reallyUnique];
           });
           setAiPrompt('');
        }
      }
    } catch (err: any) {
      alert(`AI Generation Failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const processCSVText = (text: string) => {
    const cleanText = text.replace(/^\uFEFF/, '').trim(); 
    if (!cleanText) { alert("파일 내용이 비어있습니다."); return; }
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
      setVocabList(prev => {
         const existingIds = new Set(prev.map(p => p.id));
         const uniqueNew = newItems.filter(item => !existingIds.has(item.id));
         const reallyUnique: VocabItem[] = [];
         const seenInBatch = new Set();
         for(const item of uniqueNew) {
           if(!seenInBatch.has(item.id)) {
             seenInBatch.add(item.id);
             reallyUnique.push(item);
           }
         }
         if (reallyUnique.length === 0) {
           alert("All imported items were duplicates!");
           return prev;
         }
         alert(`성공! ${reallyUnique.length}개의 새로운 단어가 추가되었습니다.`);
         return [...prev, ...reallyUnique];
      });
    } else {
      alert('데이터를 찾을 수 없습니다.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => { processCSVText(evt.target?.result as string); };
    reader.readAsText(file);
  };

  const handleUrlUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;
    setIsLoading(true);
    try {
      const fetchUrl = new URL(urlInput);
      fetchUrl.searchParams.append('_t', String(Date.now()));
      const response = await fetch(fetchUrl.toString());
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const text = await response.text();
      processCSVText(text);
      setUrlInput('');
    } catch (error: any) {
      if (error.name === 'TypeError') {
        alert('CORS 오류 또는 네트워크 문제로 데이터를 불러올 수 없습니다.');
      } else {
        alert(`데이터 로드 실패: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const exportCSV = () => {
    const header = ['Meaning', 'Sentence', 'Pronunciation', 'Tags'];
    const rows = vocabList.map(v => [
      `"${v.meaning}"`,
      `"${v.sentence}"`,
      `"${v.pronunciation || ''}"`,
      `"${v.tags.join(', ')}"`
    ]);
    const csvContent = "\uFEFF" + [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vocab_export_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <button onClick={() => setActiveTab('ai')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-500' : 'text-gray-500'}`}>
          <Sparkles size={16} /> AI Generator
        </button>
        <button onClick={() => setActiveTab('manual')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'manual' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-800 dark:text-gray-100' : 'text-gray-500'}`}>
          <PlusCircle size={16} /> Manual
        </button>
      </div>
      {activeTab === 'ai' ? (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 p-6 rounded-2xl shadow-sm border border-blue-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4"><Sparkles className="text-blue-500" /><h3 className="font-bold text-lg">AI Vocabulary Generator</h3></div>
          <form onSubmit={handleAiGenerate} className="flex flex-col gap-3">
             <div className="flex gap-2">
               <input className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Travel in Japan" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} required />
               <input type="number" min="1" max="20" value={aiCount} onChange={(e) => setAiCount(parseInt(e.target.value))} className="w-16 p-3 rounded-xl border border-gray-200 dark:border-gray-600 text-center" />
             </div>
             <button type="submit" disabled={isGenerating} className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-md">
                {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />} Generate Phrases
             </button>
          </form>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-bold mb-4 flex items-center gap-2"><PlusCircle size={20} className="text-blue-500"/> Manual Entry</h3>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <input className="p-2 rounded-lg border dark:border-gray-600 bg-transparent" placeholder="Meaning (뜻) *" value={form.meaning} onChange={e => setForm({...form, meaning: e.target.value})} required />
            <input className="p-2 rounded-lg border dark:border-gray-600 bg-transparent" placeholder="Sentence (문장) *" value={form.sentence} onChange={e => setForm({...form, sentence: e.target.value})} required />
            <input className="p-2 rounded-lg border dark:border-gray-600 bg-transparent" placeholder="Pronunciation (발음)" value={form.pronunciation} onChange={e => setForm({...form, pronunciation: e.target.value})} />
            <input className="p-2 rounded-lg border dark:border-gray-600 bg-transparent" placeholder="Tags (쉼표로 구분)" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
            <button type="submit" className="bg-gray-800 text-white py-2 rounded-lg font-medium hover:bg-gray-900 transition-colors">Add Item</button>
          </form>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4">
        <label className="flex flex-col items-center justify-center p-6 bg-gray-100 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-dashed border-gray-300 dark:border-gray-600 group">
          <Upload size={32} className="text-gray-500 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-bold text-gray-600 dark:text-gray-400">CSV File Import</span>
          <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
        </label>
        <div className="flex flex-col p-6 bg-gray-100 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
          <div className="flex items-center gap-2 mb-4 justify-center text-gray-500"><LinkIcon size={24} /><span className="text-sm font-bold text-gray-600 dark:text-gray-400">CSV from URL</span></div>
          <form onSubmit={handleUrlUpload} className="flex gap-2 w-full">
            <input type="url" placeholder="https://gist.githubusercontent.com/..." className="flex-1 min-w-0 p-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} required />
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-500 text-white text-sm font-bold rounded-lg hover:bg-blue-600 disabled:opacity-50 whitespace-nowrap flex-shrink-0">{isLoading ? '...' : 'Load'}</button>
          </form>
        </div>
      </div>
      <button onClick={exportCSV} className="w-full py-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center gap-2" type="button"><Download size={20} className="text-gray-500" /><span className="text-sm font-medium text-gray-600 dark:text-gray-400">Download CSV (Export)</span></button>
      <div className="flex-1 overflow-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 min-h-[500px]">
        <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 sticky top-0 bg-white dark:bg-gray-800 py-2">Stored Items ({vocabList.length})</h3>
        <div className="space-y-3">
          {vocabList.slice().reverse().map((item) => (
            <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div><p className="font-bold text-sm">{item.meaning}</p><p className="text-blue-600 dark:text-blue-300 text-sm">{item.sentence}</p><div className="flex gap-1 mt-1">{item.tags.map(t => <span key={t} className="text-[10px] bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">{t}</span>)}</div></div>
              <button onClick={() => setVocabList(prev => prev.filter(v => v.id !== item.id))} className="text-gray-400 hover:text-red-500 p-1" type="button"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsView({ voiceURI, setVoiceURI, handleReset, handleDeleteAllData, status, totalCount, apiKey, setApiKey }: any) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceSearch, setVoiceSearch] = useState('');
  useEffect(() => {
    const loadVoices = () => { const vs = window.speechSynthesis.getVoices(); setVoices(vs); };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);
  const progress = totalCount > 0 ? Math.round((status.completedIds.length / totalCount) * 100) : 0;
  const filteredVoices = voices.filter(v => v.name.toLowerCase().includes(voiceSearch.toLowerCase()) || v.lang.toLowerCase().includes(voiceSearch.toLowerCase()));
  return (
    <div className="flex flex-col gap-6 pt-4">
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 rounded-2xl shadow-lg">
        <h3 className="font-bold text-lg mb-4 opacity-90">Learning Progress</h3>
        <div className="flex justify-between items-end mb-2"><span className="text-4xl font-bold">{progress}%</span><span className="opacity-80 text-sm">{status.completedIds.length} / {totalCount} words</span></div>
        <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden"><div className="bg-white h-full transition-all duration-500" style={{ width: `${progress}%` }} /></div>
        <div className="mt-4 flex gap-4 text-sm opacity-80"><div className="flex items-center gap-1"><Check size={16} /> Completed: {status.completedIds.length}</div><div className="flex items-center gap-1"><X size={16} /> To Review: {status.incorrectIds.length}</div></div>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
         <h3 className="font-bold mb-4 flex items-center gap-2"><Key size={20} className="text-blue-500"/> Gemini API Key</h3>
         <div className="flex gap-2"><input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Paste your API key here..." className="flex-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Volume2 size={20} className="text-blue-500"/> TTS Voice (음성 설정)</h3>
        <div className="relative mb-2"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search voice..." value={voiceSearch} onChange={(e) => setVoiceSearch(e.target.value)} className="w-full pl-9 p-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <select value={voiceURI || ''} onChange={(e) => setVoiceURI(e.target.value || null)} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm">
          <option value="">Default (Browser)</option>
          {filteredVoices.map(v => (<option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>))}
        </select>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold mb-4 text-red-500 flex items-center gap-2"><RefreshCw size={20}/> Data Management</h3>
        <div className="flex flex-col gap-3">
          <button onClick={handleReset} className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl text-left text-sm font-medium transition-colors flex justify-between items-center" type="button">학습 기록 초기화 (Reset Progress)<RefreshCw size={16} /></button>
          <button onClick={handleDeleteAllData} className="w-full py-3 px-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-left text-sm font-medium transition-colors flex justify-between items-center" type="button">모든 데이터 삭제 (Delete All)<Trash2 size={16} /></button>
        </div>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${active ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`} type="button">
      <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'scale-100'}`}>{icon}</div>
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </button>
  );
}

const GlobalStyles = () => (
  <style>{`
    .perspective-1000 { perspective: 1000px; }
    .transform-style-3d { transform-style: preserve-3d; }
    .backface-hidden { backface-visibility: hidden; }
    .rotate-y-180 { transform: rotateY(180deg); }
    .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `}</style>
);

