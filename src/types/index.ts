
// Main vocabulary item structure
export interface SongData {
  videoId: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
}

export interface SongMaterials {
  lyrics: { original: string; translated: string; isGenerated?: boolean }[];
  phrases: { meaning: string; sentence: string; pronunciation: string }[];
  artist: string;
  title: string;
}

export interface PhraseItem {
  id: string;
  meaning: string;
  sentence: string;
  pronunciation?: string;
  tags: string[];
  memo?: string;
  song?: SongData;
}

// Extended Quiz Item to support multiple types
export type QuizType = 'writing' | 'interpretation' | 'cloze' | 'speaking' | 'listening';

export interface QuizItem extends PhraseItem {
  type: QuizType;
  questionText: string; // The text shown to user
  answerText: string;   // The expected answer
  hint?: string;        // Additional hint (e.g. masked sentence for cloze)
}

export interface LearningStatus {
  completedIds: string[];
  incorrectIds: string[];
  points: number;
  quizStats?: Record<string, { correct: QuizType[], incorrect: QuizType[] }>;
}

export type ViewMode = 'learn' | 'quiz' | 'builder' | 'settings' | 'music';
