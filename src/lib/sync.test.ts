import { describe, it, expect, vi } from 'vitest';
import {
  lastWriteWins,
  purgeTombstones,
  filterActivePhrases,
  softDeletePhrase,
  updatePhraseTimestamp,
  calculateBackoff,
  shouldRetry,
} from './sync';
import type { PhraseEntity, SyncRetryItem } from '../types/schema';

vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
}));

function createPhrase(overrides: Partial<PhraseEntity> = {}): PhraseEntity {
  return {
    id: 'test-id',
    meaning: 'Test',
    sentence: 'Test sentence',
    tags: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    isDeleted: false,
    ...overrides,
  };
}

describe('lastWriteWins', () => {
  it('merges local and cloud arrays preferring newer timestamps', () => {
    const local = [
      createPhrase({ id: '1', meaning: 'Local A', updatedAt: '2024-01-02T00:00:00.000Z' }),
      createPhrase({ id: '2', meaning: 'Local B', updatedAt: '2024-01-01T00:00:00.000Z' }),
    ];
    const cloud = [
      createPhrase({ id: '1', meaning: 'Cloud A', updatedAt: '2024-01-01T00:00:00.000Z' }),
      createPhrase({ id: '2', meaning: 'Cloud B', updatedAt: '2024-01-03T00:00:00.000Z' }),
      createPhrase({ id: '3', meaning: 'Cloud C', updatedAt: '2024-01-01T00:00:00.000Z' }),
    ];

    const result = lastWriteWins(local, cloud);

    expect(result).toHaveLength(3);
    expect(result.find(p => p.id === '1')?.meaning).toBe('Local A');
    expect(result.find(p => p.id === '2')?.meaning).toBe('Cloud B');
    expect(result.find(p => p.id === '3')?.meaning).toBe('Cloud C');
  });

  it('handles empty arrays', () => {
    expect(lastWriteWins([], [])).toEqual([]);
    expect(lastWriteWins([createPhrase({ id: '1' })], [])).toHaveLength(1);
    expect(lastWriteWins([], [createPhrase({ id: '1' })])).toHaveLength(1);
  });

  it('handles items without updatedAt', () => {
    const local = [{ id: '1', meaning: 'Local' } as PhraseEntity];
    const cloud = [{ id: '1', meaning: 'Cloud', updatedAt: '2024-01-01T00:00:00.000Z' } as PhraseEntity];

    const result = lastWriteWins(local, cloud);
    expect(result.find(p => p.id === '1')?.meaning).toBe('Cloud');
  });
});

describe('purgeTombstones', () => {
  it('removes tombstones older than 30 days', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 31);

    const phrases = [
      createPhrase({ id: '1', isDeleted: false }),
      createPhrase({ id: '2', isDeleted: true, deletedAt: oldDate.toISOString() }),
      createPhrase({ id: '3', isDeleted: true, deletedAt: new Date().toISOString() }),
    ];

    const result = purgeTombstones(phrases);

    expect(result).toHaveLength(2);
    expect(result.map(p => p.id)).toEqual(['1', '3']);
  });

  it('keeps tombstones without deletedAt', () => {
    const phrases = [
      createPhrase({ id: '1', isDeleted: true }),
    ];

    const result = purgeTombstones(phrases);
    expect(result).toHaveLength(1);
  });

  it('keeps all active phrases', () => {
    const phrases = [
      createPhrase({ id: '1' }),
      createPhrase({ id: '2' }),
    ];

    const result = purgeTombstones(phrases);
    expect(result).toHaveLength(2);
  });
});

describe('filterActivePhrases', () => {
  it('excludes deleted phrases', () => {
    const phrases = [
      createPhrase({ id: '1', isDeleted: false }),
      createPhrase({ id: '2', isDeleted: true }),
      createPhrase({ id: '3', isDeleted: false }),
    ];

    const result = filterActivePhrases(phrases);

    expect(result).toHaveLength(2);
    expect(result.map(p => p.id)).toEqual(['1', '3']);
  });
});

describe('softDeletePhrase', () => {
  it('marks phrase as deleted with timestamp', () => {
    const original = createPhrase({ id: '1', updatedAt: '2024-01-01T00:00:00.000Z' });

    const result = softDeletePhrase(original);

    expect(result.isDeleted).toBe(true);
    expect(result.deletedAt).toBeDefined();
    expect(new Date(result.deletedAt!).getTime()).toBeGreaterThan(new Date(original.updatedAt).getTime());
    expect(new Date(result.updatedAt).getTime()).toBeGreaterThan(new Date(original.updatedAt).getTime());
  });

  it('preserves other fields', () => {
    const original = createPhrase({ id: '1', meaning: 'Test', tags: ['a', 'b'] });

    const result = softDeletePhrase(original);

    expect(result.id).toBe('1');
    expect(result.meaning).toBe('Test');
    expect(result.tags).toEqual(['a', 'b']);
  });
});

describe('updatePhraseTimestamp', () => {
  it('updates only the updatedAt field', () => {
    const original = createPhrase({ id: '1', updatedAt: '2024-01-01T00:00:00.000Z' });

    const result = updatePhraseTimestamp(original);

    expect(result.id).toBe('1');
    expect(new Date(result.updatedAt).getTime()).toBeGreaterThan(new Date(original.updatedAt).getTime());
    expect(result.createdAt).toBe(original.createdAt);
  });
});

describe('calculateBackoff', () => {
  it('returns exponential backoff', () => {
    expect(calculateBackoff(0)).toBe(1000);
    expect(calculateBackoff(1)).toBe(2000);
    expect(calculateBackoff(2)).toBe(4000);
    expect(calculateBackoff(3)).toBe(8000);
  });

  it('caps at 30 seconds', () => {
    expect(calculateBackoff(10)).toBe(30000);
    expect(calculateBackoff(100)).toBe(30000);
  });
});

describe('shouldRetry', () => {
  it('returns true when retry count is below max', () => {
    const item: SyncRetryItem = {
      key: 'test',
      value: {},
      timestamp: Date.now(),
      retryCount: 3,
    };

    expect(shouldRetry(item)).toBe(true);
  });

  it('returns false when retry count reaches max', () => {
    const item: SyncRetryItem = {
      key: 'test',
      value: {},
      timestamp: Date.now(),
      retryCount: 5,
    };

    expect(shouldRetry(item)).toBe(false);
  });
});
