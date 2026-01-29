import { describe, it, expect } from 'vitest';
import { FSRSSyncService } from './FSRSSyncService';
import { type PhraseEntity } from '../../types/schema';

const createTestPhrase = (overrides?: Partial<PhraseEntity>): PhraseEntity => ({
  id: 'test-uuid',
  meaning: 'Hello',
  sentence: '안녕하세요',
  tags: ['greeting'],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
  isDeleted: false,
  state: 'review',
  reps: 5,
  lapses: 1,
  difficulty: 0.3,
  stability: 10,
  ...overrides,
});

describe('FSRSSyncService', () => {
  describe('mergeFSRSFields', () => {
    it('uses max for reps field', () => {
      const local = createTestPhrase({ reps: 10 });
      const cloud = createTestPhrase({ reps: 7 });

      const { merged } = FSRSSyncService.mergeFSRSFields(local, cloud);

      expect(merged.reps).toBe(10);
    });

    it('uses max for lapses field', () => {
      const local = createTestPhrase({ lapses: 2 });
      const cloud = createTestPhrase({ lapses: 5 });

      const { merged } = FSRSSyncService.mergeFSRSFields(local, cloud);

      expect(merged.lapses).toBe(5);
    });

    it('uses lastWriteWins for stability when cloud is newer', () => {
      const local = createTestPhrase({ 
        stability: 10, 
        updatedAt: '2024-01-10T00:00:00.000Z' 
      });
      const cloud = createTestPhrase({ 
        stability: 15, 
        updatedAt: '2024-01-15T00:00:00.000Z' 
      });

      const { merged } = FSRSSyncService.mergeFSRSFields(local, cloud);

      expect(merged.stability).toBe(15);
    });

    it('keeps local stability when local is newer', () => {
      const local = createTestPhrase({ 
        stability: 20, 
        updatedAt: '2024-01-20T00:00:00.000Z' 
      });
      const cloud = createTestPhrase({ 
        stability: 15, 
        updatedAt: '2024-01-15T00:00:00.000Z' 
      });

      const { merged } = FSRSSyncService.mergeFSRSFields(local, cloud);

      expect(merged.stability).toBe(20);
    });

    it('reports conflict when reps differ', () => {
      const local = createTestPhrase({ reps: 10 });
      const cloud = createTestPhrase({ reps: 7 });

      const { hasConflict } = FSRSSyncService.mergeFSRSFields(local, cloud);

      expect(hasConflict).toBe(true);
    });

    it('reports no conflict when values match', () => {
      const local = createTestPhrase({ reps: 10, lapses: 2 });
      const cloud = createTestPhrase({ reps: 10, lapses: 2 });

      const { hasConflict } = FSRSSyncService.mergeFSRSFields(local, cloud);

      expect(hasConflict).toBe(false);
    });

    it('handles undefined FSRS fields gracefully', () => {
      const local = createTestPhrase({ reps: undefined, lapses: undefined });
      const cloud = createTestPhrase({ reps: 5, lapses: 2 });

      const { merged } = FSRSSyncService.mergeFSRSFields(local, cloud);

      expect(merged.reps).toBe(5);
      expect(merged.lapses).toBe(2);
    });
  });

  describe('mergePhraseLists', () => {
    it('keeps local-only phrases', () => {
      const local = [createTestPhrase({ id: 'local-only' })];
      const cloud: PhraseEntity[] = [];

      const merged = FSRSSyncService.mergePhraseLists(local, cloud);

      expect(merged).toHaveLength(1);
      expect(merged[0].id).toBe('local-only');
    });

    it('adds cloud-only phrases', () => {
      const local: PhraseEntity[] = [];
      const cloud = [createTestPhrase({ id: 'cloud-only' })];

      const merged = FSRSSyncService.mergePhraseLists(local, cloud);

      expect(merged).toHaveLength(1);
      expect(merged[0].id).toBe('cloud-only');
    });

    it('merges matching phrases with FSRS conflict resolution', () => {
      const local = [createTestPhrase({ 
        id: 'shared', 
        reps: 10, 
        lapses: 2,
        updatedAt: '2024-01-10T00:00:00.000Z'
      })];
      const cloud = [createTestPhrase({ 
        id: 'shared', 
        reps: 7, 
        lapses: 5,
        updatedAt: '2024-01-15T00:00:00.000Z'
      })];

      const merged = FSRSSyncService.mergePhraseLists(local, cloud);

      expect(merged).toHaveLength(1);
      expect(merged[0].reps).toBe(10);
      expect(merged[0].lapses).toBe(5);
    });

    it('uses cloud content when cloud is newer', () => {
      const local = [createTestPhrase({ 
        id: 'shared', 
        meaning: 'Old meaning',
        updatedAt: '2024-01-10T00:00:00.000Z'
      })];
      const cloud = [createTestPhrase({ 
        id: 'shared', 
        meaning: 'New meaning',
        updatedAt: '2024-01-15T00:00:00.000Z'
      })];

      const merged = FSRSSyncService.mergePhraseLists(local, cloud);

      expect(merged[0].meaning).toBe('New meaning');
    });

    it('uses local content when local is newer', () => {
      const local = [createTestPhrase({ 
        id: 'shared', 
        meaning: 'Newer local',
        updatedAt: '2024-01-20T00:00:00.000Z'
      })];
      const cloud = [createTestPhrase({ 
        id: 'shared', 
        meaning: 'Older cloud',
        updatedAt: '2024-01-15T00:00:00.000Z'
      })];

      const merged = FSRSSyncService.mergePhraseLists(local, cloud);

      expect(merged[0].meaning).toBe('Newer local');
    });
  });

  describe('shouldThrottleSync', () => {
    it('returns false when no last sync time', () => {
      expect(FSRSSyncService.shouldThrottleSync(undefined)).toBe(false);
    });

    it('returns true when within throttle interval', () => {
      const recentTime = Date.now() - 1000;
      expect(FSRSSyncService.shouldThrottleSync(recentTime, 5000)).toBe(true);
    });

    it('returns false when past throttle interval', () => {
      const oldTime = Date.now() - 10000;
      expect(FSRSSyncService.shouldThrottleSync(oldTime, 5000)).toBe(false);
    });
  });
});
