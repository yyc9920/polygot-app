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
  genre?: string;
}

export interface PhraseItem {
  id: string;
  meaning: string;
  sentence: string;
  pronunciation?: string;
  tags: string[];
  memo?: string;
  song?: SongData;
  packageId?: string;
}

export type QuizType = 'writing' | 'interpretation' | 'cloze' | 'speaking' | 'listening';

export interface QuizItem extends PhraseItem {
  type: QuizType;
  questionText: string;
  answerText: string;
  hint?: string;
}

export interface LearningStatus {
  completedIds: string[];
  incorrectIds: string[];
  points: number;
  learningLanguage?: string;
  quizStats?: Record<string, { correct: QuizType[], incorrect: QuizType[] }>;
}

export interface PlaylistItem {
  id: string;
  song: SongData;
  video: {
    videoId: string;
    title: string;
    thumbnailUrl: string;
  };
  language: string;
  genre?: string;
  addedAt: number;
}

export type ViewMode = 'learn' | 'quiz' | 'builder' | 'settings' | 'music';
