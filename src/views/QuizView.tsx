import React from 'react';
import { 
  Brain, 
  Filter, 
  Type,
  X
} from 'lucide-react';
import type { LearningStatus, VocabItem, QuizItem, QuizType } from '../types';
import { checkAnswer } from '../lib/utils';
import { useVocabAppContext } from '../context/VocabContext';
import useLocalStorage from '../hooks/useLocalStorage';
import { FunButton } from '../components/FunButton';
import { triggerConfetti } from '../lib/fun-utils';

// --- Enhanced Quiz View ---
export function QuizView() {
  const { vocabList, status, setStatus } = useVocabAppContext();

  const [isPlaying, setIsPlaying] = useLocalStorage<boolean>('quizIsPlaying', false);
  const [quizQueue, setQuizQueue] = useLocalStorage<QuizItem[]>('quizQueue', []);
  const [currentIndex, setCurrentIndex] = useLocalStorage<number>('quizCurrentIndex', 0);
  const [input, setInput] = useLocalStorage<string>('quizInput', '');
  const [feedback, setFeedback] = useLocalStorage<'none' | 'correct' | 'incorrect'>('quizFeedback', 'none');
  
  // Setup States
  const [mode, setMode] = useLocalStorage<'all' | 'incorrect' | 'tag'>('quizMode', 'all');
  const [selectedTag, setSelectedTag] = useLocalStorage<string>('quizSelectedTag', '');
  const [quizType, setQuizType] = useLocalStorage<'random' | 'writing' | 'interpretation' | 'cloze'>('quizType', 'writing');

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
    const isCorrect = checkAnswer(input, currentItem.answerText);

    if (isCorrect) {
      triggerConfetti();
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

      return { completedIds: newCompleted, incorrectIds: newIncorrect };
    });
  };

  const nextQuestion = () => {
    if (currentIndex < quizQueue.length - 1) {
      setCurrentIndex((prev: number) => prev + 1);
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
              className="w-full p-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm"
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

        <FunButton 
          onClick={startQuiz}
          fullWidth
          variant="primary"
          className="text-lg"
        >
          Start Quiz
        </FunButton>
      </div>
    );
  }

  const currentItem = quizQueue[currentIndex];

  return (
    <div className="flex flex-col h-full max-w-sm mx-auto pt-8">
      <div className="flex justify-between items-center mb-2">
        <button 
          onClick={() => setIsPlaying(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider"
        >
          <X size={16} /> Exit Quiz
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
          className={`w-full p-4 rounded-xl border-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-lg outline-none transition-colors
            ${feedback === 'none' ? 'border-gray-200 dark:border-gray-700 focus:border-blue-500' : ''}
            ${feedback === 'correct' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : ''}
            ${feedback === 'incorrect' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 animate-shake' : ''}
          `}
          readOnly={feedback !== 'none'}
          autoFocus
        />

        {feedback === 'none' ? (
          <FunButton 
            type="submit" 
            fullWidth
            variant="primary"
          >
            Check Answer
          </FunButton>
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
            <FunButton 
              type="button" 
              onClick={nextQuestion}
              fullWidth
              variant={feedback === 'correct' ? 'success' : 'danger'}
            >
              Next Question &rarr;
            </FunButton>
          </div>
        )}
      </form>
    </div>
  );
}