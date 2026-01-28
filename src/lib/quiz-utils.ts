import type { PhraseEntity } from '../types/schema';
import type { QuizItem, QuizType } from '../types';
import i18n from './i18n';

export const POINT_SYSTEM: Record<Exclude<QuizType, 'random'>, number> = {
  cloze: 1,
  interpretation: 2,
  listening: 2,
  speaking: 2,
  writing: 3
};

export const LEVELS = {
  basic: { total: 10, distribution: { cloze: 4, listening: 2, speaking: 2, interpretation: 1, writing: 1 } },
  advanced: { total: 15, distribution: { cloze: 5, listening: 3, speaking: 3, interpretation: 2, writing: 2 } },
  legend: { total: 20, distribution: { cloze: 4, listening: 4, speaking: 4, interpretation: 4, writing: 4 } }
};

export const createCloze = (item: PhraseEntity): QuizItem => {
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
    const chars = [...sentence];
    const len = chars.length;
    
    if (len <= 4) {
      // Very short: mask 50%
      const maskLen = Math.max(1, Math.floor(len / 2));
      const start = Math.floor(Math.random() * (len - maskLen + 1));
      
      target = chars.slice(start, start + maskLen).join('');
      masked = chars.slice(0, start).join('') + "______" + chars.slice(start + maskLen).join('');
    } else {
      // Longer: mask 2-4 chars (simulating a word)
      const maskLen = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4
      const start = Math.floor(Math.random() * (len - maskLen)); // Ensure strictly inside or at bounds
      
      target = chars.slice(start, start + maskLen).join('');
      masked = chars.slice(0, start).join('') + "______" + chars.slice(start + maskLen).join('');
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

export const createQuizItem = (item: PhraseEntity, type: QuizType | 'random'): QuizItem => {
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
      questionText: "🎧 " + i18n.t('quiz.questionType.listening'),
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
