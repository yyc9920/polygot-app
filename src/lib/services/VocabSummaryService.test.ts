import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VocabSummaryService, type VocabSummary } from './VocabSummaryService';
import { type PhraseEntity } from '../../types/schema';

const createTestPhrase = (overrides?: Partial<PhraseEntity>): PhraseEntity => ({
  id: 'test-uuid',
  meaning: 'Hello',
  sentence: '안녕하세요',
  tags: ['greeting'],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  isDeleted: false,
  state: 'new',
  reps: 0,
  lapses: 0,
  difficulty: 0.3,
  ...overrides,
});

describe('VocabSummaryService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('generateSummary', () => {
    it('counts total non-deleted phrases', () => {
      const phrases = [
        createTestPhrase({ id: '1', isDeleted: false }),
        createTestPhrase({ id: '2', isDeleted: false }),
        createTestPhrase({ id: '3', isDeleted: true }),
      ];

      const summary = VocabSummaryService.generateSummary(phrases);

      expect(summary.totalPhrases).toBe(2);
    });

    it('groups phrases by tags', () => {
      const phrases = [
        createTestPhrase({ id: '1', tags: ['travel', 'airport'] }),
        createTestPhrase({ id: '2', tags: ['travel', 'hotel'] }),
        createTestPhrase({ id: '3', tags: ['food'] }),
      ];

      const summary = VocabSummaryService.generateSummary(phrases);

      expect(summary.byCategory['travel']).toBe(2);
      expect(summary.byCategory['airport']).toBe(1);
      expect(summary.byCategory['hotel']).toBe(1);
      expect(summary.byCategory['food']).toBe(1);
    });

    it('extracts language from tags', () => {
      const phrases = [
        createTestPhrase({ id: '1', tags: ['korean', 'greeting'] }),
        createTestPhrase({ id: '2', tags: ['korean', 'travel'] }),
        createTestPhrase({ id: '3', tags: ['japanese', 'food'] }),
      ];

      const summary = VocabSummaryService.generateSummary(phrases);

      expect(summary.byLanguage['korean']).toBe(2);
      expect(summary.byLanguage['japanese']).toBe(1);
    });

    it('estimates beginner proficiency for low vocab count', () => {
      const phrases = Array.from({ length: 50 }, (_, i) =>
        createTestPhrase({ id: `${i}`, reps: 1 })
      );

      const summary = VocabSummaryService.generateSummary(phrases);

      expect(summary.proficiencyEstimate).toBe('beginner');
    });

    it('estimates intermediate proficiency for medium vocab count', () => {
      const phrases = Array.from({ length: 200 }, (_, i) =>
        createTestPhrase({ id: `${i}`, reps: 3, state: 'review' })
      );

      const summary = VocabSummaryService.generateSummary(phrases);

      expect(summary.proficiencyEstimate).toBe('intermediate');
    });

    it('estimates advanced proficiency for high vocab count with good retention', () => {
      const phrases = Array.from({ length: 500 }, (_, i) =>
        createTestPhrase({ id: `${i}`, reps: 10, lapses: 1, state: 'review', stability: 30 })
      );

      const summary = VocabSummaryService.generateSummary(phrases);

      expect(summary.proficiencyEstimate).toBe('advanced');
    });

    it('extracts recently learned sentences (sorted by updatedAt)', () => {
      const phrases = [
        createTestPhrase({ id: '1', sentence: 'Old sentence', updatedAt: '2024-01-01T00:00:00.000Z', state: 'review' }),
        createTestPhrase({ id: '2', sentence: 'Recent sentence', updatedAt: '2024-01-14T00:00:00.000Z', state: 'review' }),
        createTestPhrase({ id: '3', sentence: 'Newest sentence', updatedAt: '2024-01-15T00:00:00.000Z', state: 'review' }),
        createTestPhrase({ id: '4', sentence: 'Still new', state: 'new' }),
      ];

      const summary = VocabSummaryService.generateSummary(phrases);

      expect(summary.recentlyLearned).toHaveLength(3);
      expect(summary.recentlyLearned[0]).toBe('Newest sentence');
      expect(summary.recentlyLearned[1]).toBe('Recent sentence');
    });

    it('limits recently learned to 10 items', () => {
      const phrases = Array.from({ length: 20 }, (_, i) =>
        createTestPhrase({
          id: `${i}`,
          sentence: `Sentence ${i}`,
          state: 'review',
          updatedAt: new Date(Date.now() - i * 1000).toISOString(),
        })
      );

      const summary = VocabSummaryService.generateSummary(phrases);

      expect(summary.recentlyLearned).toHaveLength(10);
    });

    it('identifies weak areas from high lapse tags', () => {
      const phrases = [
        createTestPhrase({ id: '1', tags: ['grammar', 'particles'], lapses: 5, reps: 10 }),
        createTestPhrase({ id: '2', tags: ['grammar', 'conjugation'], lapses: 4, reps: 8 }),
        createTestPhrase({ id: '3', tags: ['vocabulary'], lapses: 1, reps: 10 }),
      ];

      const summary = VocabSummaryService.generateSummary(phrases);

      expect(summary.weakAreas).toContain('grammar');
      expect(summary.weakAreas).toContain('particles');
      expect(summary.weakAreas).not.toContain('vocabulary');
    });

    it('calculates average retention from FSRS data', () => {
      const phrases = [
        createTestPhrase({ id: '1', reps: 10, lapses: 2 }),
        createTestPhrase({ id: '2', reps: 10, lapses: 0 }),
      ];

      const summary = VocabSummaryService.generateSummary(phrases);

      expect(summary.averageRetention).toBeCloseTo(0.9, 2);
    });

    it('returns empty summary for empty phrase list', () => {
      const summary = VocabSummaryService.generateSummary([]);

      expect(summary.totalPhrases).toBe(0);
      expect(summary.byCategory).toEqual({});
      expect(summary.byLanguage).toEqual({});
      expect(summary.proficiencyEstimate).toBe('beginner');
      expect(summary.recentlyLearned).toEqual([]);
      expect(summary.weakAreas).toEqual([]);
      expect(summary.averageRetention).toBe(0);
    });
  });

  describe('toPromptContext', () => {
    it('formats summary as concise string for AI prompt', () => {
      const summary: VocabSummary = {
        totalPhrases: 150,
        byCategory: { travel: 50, food: 30, grammar: 70 },
        byLanguage: { korean: 150 },
        proficiencyEstimate: 'intermediate',
        recentlyLearned: ['안녕하세요', '감사합니다', '어디에요'],
        weakAreas: ['particles', 'conjugation'],
        averageRetention: 0.85,
      };

      const context = VocabSummaryService.toPromptContext(summary);

      expect(context).toContain('150');
      expect(context).toContain('intermediate');
      expect(context).toContain('korean');
      expect(context).toContain('85%');
      expect(context).toContain('particles');
    });

    it('keeps output under 500 tokens (approximately 2000 chars)', () => {
      const summary: VocabSummary = {
        totalPhrases: 500,
        byCategory: Object.fromEntries(
          Array.from({ length: 50 }, (_, i) => [`category${i}`, 10])
        ),
        byLanguage: { korean: 300, japanese: 200 },
        proficiencyEstimate: 'advanced',
        recentlyLearned: Array.from({ length: 10 }, (_, i) => `Very long sentence number ${i} with lots of words`),
        weakAreas: Array.from({ length: 20 }, (_, i) => `weakarea${i}`),
        averageRetention: 0.92,
      };

      const context = VocabSummaryService.toPromptContext(summary);

      expect(context.length).toBeLessThan(2000);
    });
  });
});
