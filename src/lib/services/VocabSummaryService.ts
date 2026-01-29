import { type PhraseEntity } from '../../types/schema';

export interface VocabSummary {
  totalPhrases: number;
  byCategory: Record<string, number>;
  byLanguage: Record<string, number>;
  proficiencyEstimate: 'beginner' | 'intermediate' | 'advanced';
  recentlyLearned: string[];
  weakAreas: string[];
  averageRetention: number;
}

const LANGUAGE_TAGS = new Set([
  'korean', 'japanese', 'chinese', 'spanish', 'french',
  'german', 'italian', 'portuguese', 'russian', 'arabic',
  'hindi', 'thai', 'vietnamese', 'english',
]);

const PROFICIENCY_THRESHOLDS = {
  intermediate: 100,
  advanced: 300,
} as const;

const WEAK_AREA_LAPSE_THRESHOLD = 0.3;
const RECENTLY_LEARNED_LIMIT = 10;
const MAX_CATEGORIES_IN_PROMPT = 10;
const MAX_WEAK_AREAS_IN_PROMPT = 5;

function countByKey<T>(items: T[], keyFn: (item: T) => string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    for (const key of keyFn(item)) {
      counts[key] = (counts[key] || 0) + 1;
    }
  }
  return counts;
}

function estimateProficiency(
  phraseCount: number,
  reviewedCount: number,
  avgStability: number
): 'beginner' | 'intermediate' | 'advanced' {
  if (phraseCount < PROFICIENCY_THRESHOLDS.intermediate) {
    return 'beginner';
  }

  if (phraseCount >= PROFICIENCY_THRESHOLDS.advanced && reviewedCount >= 200 && avgStability >= 10) {
    return 'advanced';
  }

  return 'intermediate';
}

function identifyWeakAreas(
  phrases: PhraseEntity[],
  threshold: number
): string[] {
  const tagLapseRates: Record<string, { lapses: number; reviews: number }> = {};

  for (const phrase of phrases) {
    if (!phrase.reps || phrase.reps === 0) continue;

    const lapseRate = (phrase.lapses ?? 0) / phrase.reps;
    if (lapseRate < threshold) continue;

    for (const tag of phrase.tags) {
      if (LANGUAGE_TAGS.has(tag.toLowerCase())) continue;

      if (!tagLapseRates[tag]) {
        tagLapseRates[tag] = { lapses: 0, reviews: 0 };
      }
      tagLapseRates[tag].lapses += phrase.lapses ?? 0;
      tagLapseRates[tag].reviews += phrase.reps;
    }
  }

  return Object.entries(tagLapseRates)
    .filter(([, stats]) => stats.reviews > 0 && stats.lapses / stats.reviews >= threshold)
    .sort((a, b) => (b[1].lapses / b[1].reviews) - (a[1].lapses / a[1].reviews))
    .map(([tag]) => tag);
}

export const VocabSummaryService = {
  generateSummary(phrases: PhraseEntity[]): VocabSummary {
    const activePhrases = phrases.filter(p => !p.isDeleted);

    if (activePhrases.length === 0) {
      return {
        totalPhrases: 0,
        byCategory: {},
        byLanguage: {},
        proficiencyEstimate: 'beginner',
        recentlyLearned: [],
        weakAreas: [],
        averageRetention: 0,
      };
    }

    const byCategory = countByKey(activePhrases, p => p.tags.filter(t => !LANGUAGE_TAGS.has(t.toLowerCase())));
    const byLanguage = countByKey(activePhrases, p => p.tags.filter(t => LANGUAGE_TAGS.has(t.toLowerCase())));

    const reviewedPhrases = activePhrases.filter(p => p.state !== 'new' && p.reps && p.reps > 0);
    const avgStability = reviewedPhrases.length > 0
      ? reviewedPhrases.reduce((sum, p) => sum + (p.stability ?? 0), 0) / reviewedPhrases.length
      : 0;

    const recentlyLearned = activePhrases
      .filter(p => p.state !== 'new')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, RECENTLY_LEARNED_LIMIT)
      .map(p => p.sentence);

    const weakAreas = identifyWeakAreas(activePhrases, WEAK_AREA_LAPSE_THRESHOLD);

    let totalReviews = 0;
    let totalLapses = 0;
    for (const phrase of activePhrases) {
      totalReviews += phrase.reps ?? 0;
      totalLapses += phrase.lapses ?? 0;
    }
    const averageRetention = totalReviews > 0 ? (totalReviews - totalLapses) / totalReviews : 0;

    return {
      totalPhrases: activePhrases.length,
      byCategory,
      byLanguage,
      proficiencyEstimate: estimateProficiency(activePhrases.length, reviewedPhrases.length, avgStability),
      recentlyLearned,
      weakAreas,
      averageRetention,
    };
  },

  toPromptContext(summary: VocabSummary): string {
    const topCategories = Object.entries(summary.byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_CATEGORIES_IN_PROMPT)
      .map(([cat, count]) => `${cat}(${count})`)
      .join(', ');

    const languages = Object.entries(summary.byLanguage)
      .map(([lang, count]) => `${lang}(${count})`)
      .join(', ');

    const weakAreas = summary.weakAreas.slice(0, MAX_WEAK_AREAS_IN_PROMPT).join(', ');
    const retention = Math.round(summary.averageRetention * 100);

    const recentSentences = summary.recentlyLearned.slice(0, 5).join(' | ');

    return [
      `Vocab: ${summary.totalPhrases} phrases`,
      `Level: ${summary.proficiencyEstimate}`,
      `Languages: ${languages || 'none'}`,
      `Topics: ${topCategories || 'none'}`,
      `Retention: ${retention}%`,
      `Weak areas: ${weakAreas || 'none'}`,
      `Recent: ${recentSentences || 'none'}`,
    ].join('\n');
  },
};
