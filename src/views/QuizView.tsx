import React, { useState } from 'react';
import { 
  Brain, 
  Filter, 
  Type,
  X,
  Mic,
  Volume2
} from 'lucide-react';
import type { LearningStatus, VocabItem, QuizItem, QuizType } from '../types';
import { checkAnswer } from '../lib/utils';
import { useVocabAppContext } from '../context/VocabContext';
import useLocalStorage from '../hooks/useLocalStorage';
import { FunButton } from '../components/FunButton';
import { triggerConfetti } from '../lib/fun-utils';
import { VocabCard } from '../components/VocabCard';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

// --- Enhanced Quiz View ---
export function QuizView() {
  const { vocabList, status, setStatus, voiceURI } = useVocabAppContext();

  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useLocalStorage<boolean>('quizIsPlaying', false);
  const [quizQueue, setQuizQueue] = useLocalStorage<QuizItem[]>('quizQueue', []);
  const [currentIndex, setCurrentIndex] = useLocalStorage<number>('quizCurrentIndex', 0);
  const [input, setInput] = useLocalStorage<string>('quizInput', '');
  const [feedback, setFeedback] = useLocalStorage<'none' | 'correct' | 'incorrect'>('quizFeedback', 'none');
  
  const [isListening, setIsListening] = useState(false);

  // Setup States
  const [mode, setMode] = useLocalStorage<'all' | 'incorrect' | 'tag'>('quizMode', 'all');
  const [selectedTag, setSelectedTag] = useLocalStorage<string>('quizSelectedTag', '');
  const [quizType, setQuizType] = useLocalStorage<'random' | 'writing' | 'interpretation' | 'cloze' | 'speaking' | 'listening'>('quizType', 'writing');

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
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; 
    recognition.start();
    setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
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
          questionText: "🎧 Listen carefully",
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
      setIsFlipped(false);
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
              { id: 'speaking', label: '🎤 Speaking' },
              { id: 'listening', label: '🎧 Listening' },
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
           currentItem.type === 'cloze' ? 'Fill in the blank' : 
           currentItem.type === 'speaking' ? 'Read aloud' :
           currentItem.type === 'listening' ? 'Listen and type' : 'Translate to Target'}
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
        {currentItem.type === 'speaking' && (
            <button 
                type="button"
                onClick={() => speak(currentItem.sentence)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-full text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
                <Volume2 size={16} /> Listen
            </button>
        )}
      </div>

      <form onSubmit={submitAnswer} className="flex flex-col gap-4">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={currentItem.type === 'cloze' ? "Type the missing word..." : currentItem.type === 'speaking' ? "Press mic and speak..." : "Type answer..."}
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
              title="Speak answer"
            >
              <Mic size={20} />
            </button>
          )}
          {currentItem.type === 'listening' && feedback === 'none' && (
            <button
              type="button"
              onClick={() => speak(currentItem.sentence)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500 transition-all"
              title="Play audio"
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
            Check Answer
          </FunButton>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4">
            <div className={`p-4 rounded-xl border-2 flex flex-col gap-4 ${
              feedback === 'correct' 
                ? 'bg-green-50 dark:bg-green-900/10 border-green-500 shadow-lg shadow-green-100 dark:shadow-none' 
                : 'bg-red-50 dark:bg-red-900/10 border-red-500 shadow-lg shadow-red-100 dark:shadow-none'
            }`}>
              <div className="flex justify-between items-center px-2">
                <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-full ${
                  feedback === 'correct' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {feedback === 'correct' ? '✨ Perfect' : '📚 Learning'}
                </span>
                {feedback === 'incorrect' && (
                  <span className="text-xs font-bold text-red-500/80 uppercase tracking-wider">
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
                  <VocabCard 
                    item={currentItem}
                    status={status}
                    side="front"
                    onSpeak={() => speak(currentItem.sentence)}
                    className="col-start-1 row-start-1 backface-hidden shadow-none border-none bg-white/50 dark:bg-gray-800/50 min-h-0 py-4"
                  />
                  <VocabCard 
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
              Next Question &rarr;
            </FunButton>
          </div>
        )}
      </form>
    </div>
  );
}