
// Main vocabulary item structure
export interface VocabItem {
  id: string;
  meaning: string;
  sentence: string;
  pronunciation?: string;
  tags: string[];
  memo?: string;
}

// Extended Quiz Item to support multiple types
export type QuizType = 'writing' | 'interpretation' | 'cloze';

export interface QuizItem extends VocabItem {
  type: QuizType;
  questionText: string; // The text shown to user
  answerText: string;   // The expected answer
  hint?: string;        // Additional hint (e.g. masked sentence for cloze)
}

export interface LearningStatus {
  completedIds: string[];
  incorrectIds: string[];
}

export type ViewMode = 'learn' | 'quiz' | 'builder' | 'settings';
