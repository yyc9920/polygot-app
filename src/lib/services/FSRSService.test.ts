import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FSRSService, Rating } from './FSRSService';
import { type PhraseEntity, DEFAULT_FSRS_VALUES } from '../../types/schema';

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
  difficulty: DEFAULT_FSRS_VALUES.difficulty,
  due: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

describe('FSRSService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('schedule', () => {
    it('updates state from new to learning on first review', () => {
      const phrase = createTestPhrase({ state: 'new', reps: 0 });
      const result = FSRSService.schedule(phrase, Rating.Good);

      expect(result.state).toBe('learning');
      expect(result.reps).toBe(1);
      expect(result.lastReview).toBeDefined();
    });

    it('increases stability after successful review', () => {
      const phrase = createTestPhrase({
        state: 'review',
        reps: 3,
        stability: 5,
        difficulty: 0.3,
      });
      const result = FSRSService.schedule(phrase, Rating.Good);

      expect(result.stability).toBeGreaterThan(5);
    });

    it('sets longer interval for Easy rating', () => {
      const phrase = createTestPhrase({ state: 'review', reps: 2, stability: 3 });
      const goodResult = FSRSService.schedule(phrase, Rating.Good);
      const easyResult = FSRSService.schedule(phrase, Rating.Easy);

      expect(easyResult.scheduledDays!).toBeGreaterThan(goodResult.scheduledDays!);
    });

    it('resets to relearning state on Again rating', () => {
      const phrase = createTestPhrase({
        state: 'review',
        reps: 5,
        lapses: 0,
        stability: 10,
      });
      const result = FSRSService.schedule(phrase, Rating.Again);

      expect(result.state).toBe('relearning');
      expect(result.lapses).toBe(1);
      expect(result.stability).toBeLessThan(10);
    });

    it('increases difficulty on Hard rating', () => {
      const phrase = createTestPhrase({ difficulty: 0.3 });
      const result = FSRSService.schedule(phrase, Rating.Hard);

      expect(result.difficulty).toBeGreaterThan(0.3);
    });

    it('decreases difficulty on Easy rating', () => {
      const phrase = createTestPhrase({ difficulty: 0.5 });
      const result = FSRSService.schedule(phrase, Rating.Easy);

      expect(result.difficulty).toBeLessThan(0.5);
    });

    it('clamps difficulty between 0 and 1', () => {
      const easyPhrase = createTestPhrase({ difficulty: 0.05 });
      const hardPhrase = createTestPhrase({ difficulty: 0.95 });

      const easyResult = FSRSService.schedule(easyPhrase, Rating.Easy);
      const hardResult = FSRSService.schedule(hardPhrase, Rating.Hard);

      expect(easyResult.difficulty).toBeGreaterThanOrEqual(0);
      expect(hardResult.difficulty).toBeLessThanOrEqual(1);
    });

    it('sets due date based on scheduled days', () => {
      const phrase = createTestPhrase({ state: 'review', stability: 5 });
      const result = FSRSService.schedule(phrase, Rating.Good);

      const dueDate = new Date(result.due!);
      const now = new Date('2024-01-15T12:00:00.000Z');
      const daysDiff = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      expect(daysDiff).toBe(result.scheduledDays);
    });
  });

  describe('getDueCards', () => {
    it('returns cards with due date in the past or now', () => {
      const phrases = [
        createTestPhrase({ id: '1', due: '2024-01-14T00:00:00.000Z' }),
        createTestPhrase({ id: '2', due: '2024-01-15T12:00:00.000Z' }),
        createTestPhrase({ id: '3', due: '2024-01-16T00:00:00.000Z' }),
      ];

      const dueCards = FSRSService.getDueCards(phrases);

      expect(dueCards.map(c => c.id)).toEqual(['1', '2']);
    });

    it('excludes deleted cards', () => {
      const phrases = [
        createTestPhrase({ id: '1', due: '2024-01-01T00:00:00.000Z', isDeleted: false }),
        createTestPhrase({ id: '2', due: '2024-01-01T00:00:00.000Z', isDeleted: true }),
      ];

      const dueCards = FSRSService.getDueCards(phrases);

      expect(dueCards.map(c => c.id)).toEqual(['1']);
    });

    it('respects limit parameter', () => {
      const phrases = [
        createTestPhrase({ id: '1', due: '2024-01-10T00:00:00.000Z' }),
        createTestPhrase({ id: '2', due: '2024-01-11T00:00:00.000Z' }),
        createTestPhrase({ id: '3', due: '2024-01-12T00:00:00.000Z' }),
      ];

      const dueCards = FSRSService.getDueCards(phrases, 2);

      expect(dueCards).toHaveLength(2);
    });

    it('sorts by due date ascending (most overdue first)', () => {
      const phrases = [
        createTestPhrase({ id: '1', due: '2024-01-14T00:00:00.000Z' }),
        createTestPhrase({ id: '2', due: '2024-01-10T00:00:00.000Z' }),
        createTestPhrase({ id: '3', due: '2024-01-12T00:00:00.000Z' }),
      ];

      const dueCards = FSRSService.getDueCards(phrases);

      expect(dueCards.map(c => c.id)).toEqual(['2', '3', '1']);
    });
  });

  describe('getNewCards', () => {
    it('returns cards in new state', () => {
      const phrases = [
        createTestPhrase({ id: '1', state: 'new' }),
        createTestPhrase({ id: '2', state: 'learning' }),
        createTestPhrase({ id: '3', state: 'new' }),
        createTestPhrase({ id: '4', state: 'review' }),
      ];

      const newCards = FSRSService.getNewCards(phrases);

      expect(newCards.map(c => c.id)).toEqual(['1', '3']);
    });

    it('excludes deleted cards', () => {
      const phrases = [
        createTestPhrase({ id: '1', state: 'new', isDeleted: false }),
        createTestPhrase({ id: '2', state: 'new', isDeleted: true }),
      ];

      const newCards = FSRSService.getNewCards(phrases);

      expect(newCards.map(c => c.id)).toEqual(['1']);
    });

    it('respects limit parameter', () => {
      const phrases = [
        createTestPhrase({ id: '1', state: 'new' }),
        createTestPhrase({ id: '2', state: 'new' }),
        createTestPhrase({ id: '3', state: 'new' }),
      ];

      const newCards = FSRSService.getNewCards(phrases, 2);

      expect(newCards).toHaveLength(2);
    });
  });

  describe('getForecast', () => {
    it('returns array of due card counts per day', () => {
      const phrases = [
        createTestPhrase({ id: '1', due: '2024-01-15T00:00:00.000Z' }),
        createTestPhrase({ id: '2', due: '2024-01-16T00:00:00.000Z' }),
        createTestPhrase({ id: '3', due: '2024-01-16T00:00:00.000Z' }),
        createTestPhrase({ id: '4', due: '2024-01-18T00:00:00.000Z' }),
      ];

      const forecast = FSRSService.getForecast(phrases, 5);

      expect(forecast).toHaveLength(5);
      expect(forecast[0]).toBe(1);
      expect(forecast[1]).toBe(2);
      expect(forecast[2]).toBe(0);
      expect(forecast[3]).toBe(1);
      expect(forecast[4]).toBe(0);
    });

    it('excludes deleted cards from forecast', () => {
      const phrases = [
        createTestPhrase({ id: '1', due: '2024-01-15T00:00:00.000Z', isDeleted: false }),
        createTestPhrase({ id: '2', due: '2024-01-15T00:00:00.000Z', isDeleted: true }),
      ];

      const forecast = FSRSService.getForecast(phrases, 1);

      expect(forecast[0]).toBe(1);
    });
  });

  describe('getRetentionStats', () => {
    it('calculates average retention from review history', () => {
      const phrases = [
        createTestPhrase({ reps: 10, lapses: 2 }),
        createTestPhrase({ reps: 5, lapses: 1 }),
        createTestPhrase({ reps: 8, lapses: 0 }),
      ];

      const stats = FSRSService.getRetentionStats(phrases);

      expect(stats.totalReviews).toBe(23);
      expect(stats.totalLapses).toBe(3);
      expect(stats.retentionRate).toBeCloseTo(0.87, 2);
    });

    it('returns zero stats for empty phrase list', () => {
      const stats = FSRSService.getRetentionStats([]);

      expect(stats.totalReviews).toBe(0);
      expect(stats.totalLapses).toBe(0);
      expect(stats.retentionRate).toBe(0);
    });

    it('handles phrases without FSRS fields', () => {
      const phrases = [
        createTestPhrase({ reps: undefined, lapses: undefined }),
      ];

      const stats = FSRSService.getRetentionStats(phrases);

      expect(stats.totalReviews).toBe(0);
      expect(stats.totalLapses).toBe(0);
    });
  });
});
