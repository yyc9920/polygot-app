import { type PhraseEntity, type FSRSState } from '../../types/schema';

export const Rating = {
  Again: 1,
  Hard: 2,
  Good: 3,
  Easy: 4,
} as const;

export type Rating = (typeof Rating)[keyof typeof Rating];

export interface RetentionStats {
  totalReviews: number;
  totalLapses: number;
  retentionRate: number;
}

const FSRS_PARAMS = {
  w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
  requestRetention: 0.9,
  maximumInterval: 36500,
  easyBonus: 1.3,
  hardInterval: 1.2,
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function calculateStability(
  currentStability: number | undefined,
  difficulty: number,
  rating: Rating,
  elapsedDays: number
): number {
  const d = difficulty;
  const s = currentStability ?? 1;
  const r = elapsedDays / s;

  if (rating === Rating.Again) {
    return Math.max(0.1, s * 0.2 * (1 + 0.1 * d));
  }

  const hardPenalty = rating === Rating.Hard ? 0.8 : 1;
  const easyBonus = rating === Rating.Easy ? FSRS_PARAMS.easyBonus : 1;

  const newStability = s * (1 + Math.exp(FSRS_PARAMS.w[8]) * (11 - d) * Math.pow(s, -FSRS_PARAMS.w[9]) * (Math.exp((1 - r) * FSRS_PARAMS.w[10]) - 1) * hardPenalty * easyBonus);

  return Math.min(FSRS_PARAMS.maximumInterval, Math.max(0.1, newStability));
}

function calculateDifficulty(currentDifficulty: number, rating: Rating): number {
  const d = currentDifficulty;
  const delta = (rating - 3) * 0.1;
  return clamp(d - delta, 0, 1);
}

function calculateInterval(stability: number, requestRetention: number): number {
  const interval = (stability / Math.pow(-Math.log(requestRetention), 1 / FSRS_PARAMS.w[4])) * 9;
  return Math.max(1, Math.round(interval));
}

function getNextState(currentState: FSRSState | undefined, rating: Rating): FSRSState {
  if (rating === Rating.Again) {
    return currentState === 'new' ? 'learning' : 'relearning';
  }

  if (!currentState || currentState === 'new') {
    return 'learning';
  }

  if (currentState === 'learning' || currentState === 'relearning') {
    return rating >= Rating.Good ? 'review' : currentState;
  }

  return 'review';
}

export const FSRSService = {
  schedule(phrase: PhraseEntity, rating: Rating): PhraseEntity {
    const now = new Date();
    const lastReview = phrase.lastReview ? new Date(phrase.lastReview) : now;
    const elapsedDays = Math.max(0, Math.floor((now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24)));

    const currentDifficulty = phrase.difficulty ?? 0.3;
    const currentStability = phrase.stability;
    const currentReps = phrase.reps ?? 0;
    const currentLapses = phrase.lapses ?? 0;

    const newDifficulty = calculateDifficulty(currentDifficulty, rating);
    const newStability = calculateStability(currentStability, newDifficulty, rating, elapsedDays);
    const scheduledDays = calculateInterval(newStability, FSRS_PARAMS.requestRetention);
    const newState = getNextState(phrase.state, rating);

    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + scheduledDays);

    return {
      ...phrase,
      stability: newStability,
      difficulty: newDifficulty,
      elapsedDays,
      scheduledDays,
      reps: rating === Rating.Again ? currentReps : currentReps + 1,
      lapses: rating === Rating.Again ? currentLapses + 1 : currentLapses,
      state: newState,
      due: dueDate.toISOString(),
      lastReview: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  },

  getDueCards(phrases: PhraseEntity[], limit?: number): PhraseEntity[] {
    const now = new Date();
    const dueCards = phrases
      .filter(p => !p.isDeleted && p.due && new Date(p.due) <= now)
      .sort((a, b) => new Date(a.due!).getTime() - new Date(b.due!).getTime());

    return limit ? dueCards.slice(0, limit) : dueCards;
  },

  getNewCards(phrases: PhraseEntity[], limit?: number): PhraseEntity[] {
    const newCards = phrases.filter(p => !p.isDeleted && p.state === 'new');
    return limit ? newCards.slice(0, limit) : newCards;
  },

  getForecast(phrases: PhraseEntity[], days: number): number[] {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const forecast = new Array(days).fill(0);

    for (const phrase of phrases) {
      if (phrase.isDeleted || !phrase.due) continue;

      const dueDate = new Date(phrase.due);
      const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      const dayDiff = Math.floor((dueDay.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff >= 0 && dayDiff < days) {
        forecast[dayDiff]++;
      }
    }

    return forecast;
  },

  getRetentionStats(phrases: PhraseEntity[]): RetentionStats {
    let totalReviews = 0;
    let totalLapses = 0;

    for (const phrase of phrases) {
      totalReviews += phrase.reps ?? 0;
      totalLapses += phrase.lapses ?? 0;
    }

    const retentionRate = totalReviews > 0
      ? (totalReviews - totalLapses) / totalReviews
      : 0;

    return {
      totalReviews,
      totalLapses,
      retentionRate,
    };
  },
};
