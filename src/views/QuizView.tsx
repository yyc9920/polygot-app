import React, { useState } from 'react';
import { 
  Brain, 
  Filter, 
  Type,
  X,
  Mic,
  Volume2,
  Signal,
  Trophy,
  Star
} from 'lucide-react';
import type { LearningStatus, PhraseItem, QuizItem, QuizType } from '../types';
import { checkAnswer } from '../lib/utils';
import { usePhraseAppContext } from '../context/PhraseContext';
import useLocalStorage from '../hooks/useLocalStorage';
import { FunButton } from '../components/FunButton';
import { triggerConfetti } from '../lib/fun-utils';
import { PhraseCard } from '../components/PhraseCard';
import useLanguage from '../hooks/useLanguage';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

// --- Enhanced Quiz View ---
export function QuizView() {
  const { phraseList, status, setStatus, voiceURI } = usePhraseAppContext();
  const { t } = useLanguage();

  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useLocalStorage<boolean>('quizIsPlaying', false);
  const [quizQueue, setQuizQueue] = useLocalStorage<QuizItem[]>('quizQueue', []);
  const [currentIndex, setCurrentIndex] = useLocalStorage<number>('quizCurrentIndex', 0);
  const [input, setInput] = useLocalStorage<string>('quizInput', '');
  const [feedback, setFeedback] = useLocalStorage<'none' | 'correct' | 'incorrect'>('quizFeedback', 'none');
  const [sessionPoints, setSessionPoints] = useLocalStorage<number>('quizSessionPoints', 0);
  const [earnedPoints, setEarnedPoints] = useState<number>(0);
  const [showSummary, setShowSummary] = useState(false);
  
  const [isListening, setIsListening] = useState(false);

  // Setup States
  const [mode, setMode] = useLocalStorage<'all' | 'incorrect' | 'tag'>('quizMode', 'all');
  const [selectedTag, setSelectedTag] = useLocalStorage<string>('quizSelectedTag', '');
  const [quizLevel, setQuizLevel] = useLocalStorage<'custom' | 'basic' | 'advanced' | 'legend'>('quizLevel', 'custom');
  const [quizType, setQuizType] = useLocalStorage<'random' | 'writing' | 'interpretation' | 'cloze' | 'speaking' | 'listening'>('quizType', 'writing');

  const tags = [...Array.from(new Set(phraseList.flatMap(v => v.tags)))];

  const POINT_SYSTEM: Record<Exclude<QuizType, 'random'>, number> = {
    cloze: 1,
    interpretation: 2,
    listening: 2,
    speaking: 2,
    writing: 3
  };

  const LEVELS = {
    basic: { total: 10, distribution: { cloze: 4, listening: 2, speaking: 2, interpretation: 1, writing: 1 } },
    advanced: { total: 15, distribution: { cloze: 5, listening: 3, speaking: 3, interpretation: 2, writing: 2 } },
    legend: { total: 20, distribution: { cloze: 4, listening: 4, speaking: 4, interpretation: 4, writing: 4 } }
  };


  // Helper to create Cloze item
  const createCloze = (item: PhraseItem): QuizItem => {
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

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (voiceURI) {
      const voice = window.speechSynthesis.getVoices().find(v => v.voiceURI === voiceURI);
      if (voice) utterance.voice = voice;
    }
    window.speechSynthesis.speak(utterance);
  };

  // Auto-play audio for listening questions
  React.useEffect(() => {
    if (isPlaying && quizQueue[currentIndex]?.type === 'listening' && feedback === 'none') {
      const timer = setTimeout(() => {
        speak(quizQueue[currentIndex].sentence);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isPlaying, quizQueue, feedback, voiceURI]);

  const startListening = () => {
    if (!SpeechRecognition) {
      alert(t('quiz.speechNotSupported'));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; 
    recognition.start();
    setIsListening(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  const createQuizItem = (item: PhraseItem, type: QuizType | 'random'): QuizItem => {
    // Handle Random Type
    if (type === 'random') {
      const types: QuizType[] = ['writing', 'interpretation', 'cloze', 'speaking', 'listening'];
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
    } else if (type === 'speaking') {
      return {
        ...item,
        type: 'speaking',
        questionText: item.sentence,
        answerText: item.sentence
      };
    } else if (type === 'listening') {
      return {
        ...item,
        type: 'listening',
        questionText: "🎧 " + t('quiz.questionType.listening'),
        answerText: item.sentence
      };
    } else {
      // Default: Writing
      return {
        ...item,
        type: 'writing',
        questionText: item.meaning,
        answerText: item.sentence
      };
    }
  };

  const startQuiz = () => {
    let list = [...phraseList];

    // 1. Filter by Scope
    if (mode === 'incorrect') {
      list = list.filter(v => status.incorrectIds.includes(v.id));
    } else if (mode === 'tag' && selectedTag) {
      list = list.filter(v => v.tags.includes(selectedTag));
    }

    if (list.length === 0) {
      alert(t('learn.noDataToDisplay'));
      return;
    }

    // 2. Shuffle
    list = list.sort(() => Math.random() - 0.5);

    let queue: QuizItem[] = [];

    if (quizLevel !== 'custom') {
      const levelConfig = LEVELS[quizLevel];
      if (list.length < levelConfig.total) {
        const msg = t('quiz.confirmNotEnough')
            .replace('{{level}}', quizLevel)
            .replace('{{need}}', levelConfig.total.toString())
            .replace('{{have}}', list.length.toString());
        if (!confirm(msg)) {
          return;
        }
      }

      // Limit list size if we have enough, otherwise use all
      const countToUse = Math.min(list.length, levelConfig.total);
      list = list.slice(0, countToUse);

      // Create distribution pool
      let typesPool: QuizType[] = [];
      Object.entries(levelConfig.distribution).forEach(([type, count]) => {
        for (let i = 0; i < count; i++) typesPool.push(type as QuizType);
      });

      // Adjust pool size to match actual list length (if list is smaller than total)
      // or if pool is smaller/larger for some reason. 
      // Simplest strategy: shuffle pool, take needed amount. 
      // If pool is larger (normal case), we take first N.
      // If pool is smaller (list was cut short?), we cycle or random fill? 
      // But here list <= levelConfig.total. 
      // If list < total, we should probably scale down the distribution or just pick randomly from the pool.
      
      typesPool = typesPool.sort(() => Math.random() - 0.5);
      
      queue = list.map((item, i) => {
        // If we run out of types in pool (because we are just taking best effort), fallback to random or writing
        const type = typesPool[i % typesPool.length] || 'writing'; 
        return createQuizItem(item, type);
      });

    } else {
      // 3. Transform to QuizItems based on Type (Custom Mode)
      queue = list.map(item => createQuizItem(item, quizType));
    }

    setQuizQueue(queue);
    setCurrentIndex(0);
    setInput('');
    setFeedback('none');
    setSessionPoints(0);
    setShowSummary(false);
    setIsPlaying(true);
  };

  const submitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback !== 'none') return; 
    
    // Safety check
    if (!quizQueue[currentIndex]) return;

    const currentItem = quizQueue[currentIndex];
    const isCorrect = checkAnswer(input, currentItem.answerText);
    const pts = POINT_SYSTEM[currentItem.type as QuizType] || 0;

    if (isCorrect) {
      triggerConfetti();
      setEarnedPoints(pts);
      setSessionPoints(prev => prev + pts);
    } else {
      setEarnedPoints(0);
    }

    setFeedback(isCorrect ? 'correct' : 'incorrect');

    setStatus((prev: LearningStatus) => {
      const newCompleted = isCorrect 
        ? [...new Set([...prev.completedIds, currentItem.id])]
        : prev.completedIds;
      
      const newIncorrect = !isCorrect
        ? [...new Set([...prev.incorrectIds, currentItem.id])]
        : isCorrect 
          ? prev.incorrectIds.filter(id => id !== currentItem.id) 
          : prev.incorrectIds;
      
      const newPoints = isCorrect ? (prev.points || 0) + pts : (prev.points || 0);

      // Update Quiz Stats
      const currentStats = prev.quizStats?.[currentItem.id] || { correct: [], incorrect: [] };
      const newStats = { ...prev.quizStats };
      
      if (isCorrect) {
        newStats[currentItem.id] = {
          ...currentStats,
          correct: [...new Set([...currentStats.correct, currentItem.type as QuizType])],
          // Optional: clear incorrect status for this type if mastered?
          // For now, we keep history or just let it be. 
          // If we want "incorrect" to only represent *current* trouble, we should remove it from incorrect list?
          // But 'incorrectIds' tracks the general review status. 
          // Let's just track cumulative success.
        };
      } else {
        newStats[currentItem.id] = {
          ...currentStats,
          incorrect: [...new Set([...currentStats.incorrect, currentItem.type as QuizType])]
        };
      }

      return { completedIds: newCompleted, incorrectIds: newIncorrect, points: newPoints, quizStats: newStats };
    });
  };

  const nextQuestion = () => {
    if (currentIndex < quizQueue.length - 1) {
      setCurrentIndex((prev: number) => prev + 1);
      setInput('');
      setFeedback('none');
      setIsFlipped(false);
    } else {
      setShowSummary(true);
      triggerConfetti();
    }
  };

  if (!isPlaying) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="min-h-full flex flex-col justify-center gap-6 p-4 pb-20">
          <div className="text-center mb-4">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-500 mx-auto mb-4">
              <Brain size={40} />
            </div>
            <h2 className="text-2xl font-bold">{t('quiz.setupTitle')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('quiz.customizePractice')}</p>
        </div>
        
        {/* Scope Selection */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <Filter size={16} /> {t('quiz.scope')}
          </h3>
          <div className="flex gap-2 mb-3">
            <button 
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}
              onClick={() => setMode('all')}
            >
              {t('common.all')}
            </button>
            <button 
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'incorrect' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}
              onClick={() => setMode('incorrect')}
            >
              {t('settings.toReview')} ({status.incorrectIds.length})
            </button>
            <button 
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'tag' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}
              onClick={() => setMode('tag')}
            >
              {t('learn.tags')}
            </button>
          </div>
          {mode === 'tag' && (
            <select 
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full p-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm"
            >
              <option value="">{t('quiz.selectTagPlaceholder')}</option>
              {tags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>

        {/* Level Selection */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <Signal size={16} /> {t('quiz.level')}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'custom', label: '⚙️ Custom' },
              { id: 'basic', label: '🌱 Basic' },
              { id: 'advanced', label: '🚀 Advanced' },
              { id: 'legend', label: '🏆 Legend' },
            ].map((l) => (
              <button
                key={l.id}
                onClick={() => setQuizLevel(l.id as 'custom' | 'basic' | 'advanced' | 'legend')}
                className={`py-3 px-2 text-xs font-bold rounded-xl transition-all border-2 ${
                  quizLevel === l.id 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300' 
                    : 'border-transparent bg-gray-100 dark:bg-gray-700 text-gray-500'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
          {quizLevel !== 'custom' && (
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
              {quizLevel === 'basic' && t('quiz.levelDesc.basic')}
              {quizLevel === 'advanced' && t('quiz.levelDesc.advanced')}
              {quizLevel === 'legend' && t('quiz.levelDesc.legend')}
            </div>
          )}
        </div>

        {/* Type Selection (Only for Custom) */}
        {quizLevel === 'custom' && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Type size={16} /> {t('quiz.type')}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'writing', label: '✍️ ' + t('quiz.questionType.writing') },
                { id: 'interpretation', label: '🗣️ ' + t('quiz.questionType.interpretation') },
                { id: 'cloze', label: '🧩 ' + t('quiz.questionType.cloze') },
                { id: 'speaking', label: '🎤 ' + t('quiz.questionType.speaking') },
                { id: 'listening', label: '🎧 ' + t('quiz.questionType.listening') },
                { id: 'random', label: '🔀 Random' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setQuizType(t.id as 'random' | 'writing' | 'interpretation' | 'cloze' | 'speaking' | 'listening')}
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
        )}

        <FunButton 
          onClick={startQuiz}
          fullWidth
          variant="primary"
          className="text-lg"
        >
          {t('quiz.start')}
        </FunButton>
        </div>
      </div>
    );
  }

  if (showSummary) {
    return (
        <div className="h-full flex flex-col justify-center items-center gap-6 p-4 animate-in fade-in zoom-in-95 duration-500">
             <div className="text-center space-y-4">
                 <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-500 mx-auto animate-bounce">
                     <Trophy size={48} />
                 </div>
                 <h2 className="text-3xl font-black bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                     {t('quiz.complete')}
                 </h2>
                 <p className="text-gray-500 dark:text-gray-400">{t('quiz.greatJob')}</p>
             </div>

             <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border-2 border-yellow-100 dark:border-yellow-900 w-full max-w-xs text-center relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
                 <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">{t('settings.totalScore')}</p>
                 <div className="text-6xl font-black text-gray-800 dark:text-white mb-2 flex justify-center items-end gap-2">
                     {sessionPoints}
                     <span className="text-xl font-bold text-gray-400 mb-2">{t('settings.points')}</span>
                 </div>
                 <div className="flex justify-center gap-1 text-yellow-400">
                     {[...Array(5)].map((_, i) => <Star key={i} size={20} fill="currentColor" className={i < 3 ? "opacity-100" : "opacity-30"} />)}
                 </div>
             </div>

             <div className="w-full max-w-xs space-y-3">
                 <FunButton 
                     onClick={startQuiz}
                     fullWidth
                     variant="primary"
                 >
                     {t('quiz.tryAgain')}
                 </FunButton>
                 <FunButton 
                     onClick={() => setIsPlaying(false)}
                     fullWidth
                     variant="neutral"
                 >
                     {t('quiz.backToSetup')}
                 </FunButton>
             </div>
        </div>
    );
  }

  const currentItem = quizQueue[currentIndex];

  return (
    <div className="flex flex-col h-full max-w-sm mx-auto pt-12 px-4 overflow-y-auto pb-20">
      <div className="flex justify-between items-center mb-2">
        <button 
          onClick={() => setIsPlaying(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider"
        >
          <X size={16} /> {t('quiz.exit')}
        </button>
        <div className="flex gap-1 text-sm text-gray-400">
          <span>Question {currentIndex + 1}</span>
          <span>/</span>
          <span>{quizQueue.length}</span>
        </div>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full mb-8">
        <div 
          className="bg-blue-500 h-full rounded-full transition-all" 
          style={{ width: `${((currentIndex) / quizQueue.length) * 100}%` }}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 text-center">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          {currentItem.type === 'interpretation' ? t('quiz.questionType.interpretation') : 
           currentItem.type === 'cloze' ? t('quiz.questionType.cloze') : 
           currentItem.type === 'speaking' ? t('quiz.questionType.speaking') :
           currentItem.type === 'listening' ? t('quiz.questionType.listening') : t('quiz.questionType.writing')}
        </span>
        <h3 className="text-xl font-bold mt-4 leading-snug break-words">
          {currentItem.questionText}
        </h3>
        {/* For Cloze, show the hinted sentence */}
        {currentItem.type === 'cloze' && (
          <p className="mt-4 text-blue-600 dark:text-blue-300 font-mono text-lg p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg break-words">
            {currentItem.hint}
          </p>
        )}
        {currentItem.type === 'speaking' && (
            <button 
                type="button"
                onClick={() => speak(currentItem.sentence)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-full text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
                <Volume2 size={16} /> {t('quiz.action.listen')}
            </button>
        )}
      </div>

      <form onSubmit={submitAnswer} className="flex flex-col gap-4">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={currentItem.type === 'cloze' ? t('quiz.placeholder.cloze') : currentItem.type === 'speaking' ? t('quiz.placeholder.speaking') : t('quiz.placeholder.writing')}
            className={`w-full p-4 rounded-xl border-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-lg outline-none transition-colors pr-14
              ${feedback === 'none' ? 'border-gray-200 dark:border-gray-700 focus:border-blue-500' : ''}
              ${feedback === 'correct' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : ''}
              ${feedback === 'incorrect' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 animate-shake' : ''}
            `}
            readOnly={feedback !== 'none'}
            autoFocus
          />
          {currentItem.type === 'speaking' && feedback === 'none' && (
            <button
              type="button"
              onClick={startListening}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse shadow-md' 
                  : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
              }`}
              title={t('quiz.title.speak')}
            >
              <Mic size={20} />
            </button>
          )}
          {currentItem.type === 'listening' && feedback === 'none' && (
            <button
              type="button"
              onClick={() => speak(currentItem.sentence)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500 transition-all"
              title={t('quiz.title.play')}
            >
              <Volume2 size={20} />
            </button>
          )}
        </div>

        {feedback === 'none' ? (
          <FunButton 
            type="submit" 
            fullWidth
            variant="primary"
          >
            {t('quiz.checkAnswer')}
          </FunButton>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4">
            <div className={`p-4 rounded-xl border-2 flex flex-col gap-4 ${
              feedback === 'correct' 
                ? 'bg-green-50 dark:bg-green-900/10 border-green-500 shadow-lg shadow-green-100 dark:shadow-none' 
                : 'bg-red-50 dark:bg-red-900/10 border-red-500 shadow-lg shadow-red-100 dark:shadow-none'
            }`}>
              <div className="flex justify-between items-center px-2 gap-4">
                <span className={`shrink-0 text-xs font-black uppercase px-2.5 py-1 rounded-full ${
                  feedback === 'correct' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {feedback === 'correct' ? (
                      <span className="flex items-center gap-1">
                          ✨ Perfect <span className="text-green-200">+{earnedPoints}pts</span>
                      </span>
                  ) : '📚 Learning'}
                </span>
                {feedback === 'incorrect' && (
                  <span className="text-xs font-bold text-red-500/80 uppercase tracking-wider break-words text-right">
                    Correct: {currentItem.answerText}
                  </span>
                )}
              </div>

              <div 
                className="relative w-full cursor-pointer group perspective-1000"
                onClick={() => {
                  if (!isFlipped) speak(currentItem.sentence);
                  setIsFlipped(!isFlipped);
                }}
              >
                <div 
                  className={`w-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''} grid grid-cols-1 grid-rows-1`}
                >
                  <PhraseCard 
                    item={currentItem}
                    status={status}
                    side="front"
                    onSpeak={() => speak(currentItem.sentence)}
                    className="col-start-1 row-start-1 backface-hidden shadow-none border-none bg-white/50 dark:bg-gray-800/50 min-h-0 py-4"
                  />
                  <PhraseCard 
                    item={currentItem}
                    status={status}
                    side="back"
                    className="col-start-1 row-start-1 backface-hidden rotate-y-180 shadow-none border-none bg-white/50 dark:bg-gray-800/50 min-h-0 py-4"
                  />
                </div>
              </div>
            </div>

            <FunButton 
              type="button" 
              onClick={nextQuestion}
              fullWidth
              variant={feedback === 'correct' ? 'success' : 'danger'}
              className="py-4 shadow-md"
            >
              {t('quiz.nextQuestion')} &rarr;
            </FunButton>
          </div>
        )}
      </form>
    </div>
  );
}
