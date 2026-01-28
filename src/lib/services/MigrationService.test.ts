import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MigrationService } from './MigrationService';
import {
  type LegacyPhrase,
  type MigrationMap,
  type LearningStatus,
  isLegacyPhrase,
  isV2Phrase,
} from '../../types/schema';

vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-1234'),
}));

describe('MigrationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isLegacyPhrase', () => {
    it('returns true for legacy phrase without metadata', () => {
      const legacy = {
        id: 'abc123',
        meaning: 'Hello',
        sentence: '안녕하세요',
        tags: ['greeting'],
      };
      expect(isLegacyPhrase(legacy)).toBe(true);
    });

    it('returns false for v2 phrase with metadata', () => {
      const v2 = {
        id: 'uuid-123',
        meaning: 'Hello',
        sentence: '안녕하세요',
        tags: ['greeting'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        isDeleted: false,
      };
      expect(isLegacyPhrase(v2)).toBe(false);
    });

    it('returns false for null/undefined', () => {
      expect(isLegacyPhrase(null)).toBe(false);
      expect(isLegacyPhrase(undefined)).toBe(false);
    });
  });

  describe('isV2Phrase', () => {
    it('returns true for phrase with all v2 metadata', () => {
      const v2 = {
        id: 'uuid-123',
        meaning: 'Hello',
        sentence: '안녕하세요',
        tags: ['greeting'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        isDeleted: false,
      };
      expect(isV2Phrase(v2)).toBe(true);
    });

    it('returns false for legacy phrase', () => {
      const legacy = {
        id: 'abc123',
        meaning: 'Hello',
        sentence: '안녕하세요',
        tags: ['greeting'],
      };
      expect(isV2Phrase(legacy)).toBe(false);
    });

    it('returns false for partial v2 metadata', () => {
      const partial = {
        id: 'uuid-123',
        meaning: 'Hello',
        sentence: '안녕하세요',
        tags: ['greeting'],
        createdAt: '2024-01-01T00:00:00.000Z',
      };
      expect(isV2Phrase(partial)).toBe(false);
    });
  });

  describe('migrateLegacyPhrase', () => {
    it('converts legacy phrase to v2 with new UUID', () => {
      const legacy: LegacyPhrase = {
        id: 'old-content-hash',
        meaning: 'Hello',
        sentence: '안녕하세요',
        pronunciation: 'an-nyeong-ha-se-yo',
        tags: ['greeting', 'Korean'],
        memo: 'Common greeting',
      };
      const migrationMap: MigrationMap = {};

      const result = MigrationService.migrateLegacyPhrase(legacy, migrationMap);

      expect(result.id).toBe('mock-uuid-1234');
      expect(result.meaning).toBe('Hello');
      expect(result.sentence).toBe('안녕하세요');
      expect(result.pronunciation).toBe('an-nyeong-ha-se-yo');
      expect(result.tags).toEqual(['greeting', 'Korean']);
      expect(result.memo).toBe('Common greeting');
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.isDeleted).toBe(false);
      expect(migrationMap['old-content-hash']).toBe('mock-uuid-1234');
    });

    it('reuses existing UUID from migration map', () => {
      const legacy: LegacyPhrase = {
        id: 'old-content-hash',
        meaning: 'Hello',
        sentence: '안녕하세요',
        tags: [],
      };
      const migrationMap: MigrationMap = {
        'old-content-hash': 'existing-uuid-5678',
      };

      const result = MigrationService.migrateLegacyPhrase(legacy, migrationMap);

      expect(result.id).toBe('existing-uuid-5678');
    });

    it('handles missing optional fields', () => {
      const legacy: LegacyPhrase = {
        id: 'minimal',
        meaning: 'Test',
        sentence: 'Test sentence',
        tags: [],
      };
      const migrationMap: MigrationMap = {};

      const result = MigrationService.migrateLegacyPhrase(legacy, migrationMap);

      expect(result.pronunciation).toBeUndefined();
      expect(result.memo).toBeUndefined();
      expect(result.song).toBeUndefined();
      expect(result.packageId).toBeUndefined();
      expect(result.tags).toEqual([]);
    });
  });

  describe('migrateIdReferences', () => {
    it('maps old IDs to new UUIDs', () => {
      const oldIds = ['id1', 'id2', 'id3'];
      const migrationMap: MigrationMap = {
        id1: 'uuid-1',
        id2: 'uuid-2',
      };

      const result = MigrationService.migrateIdReferences(oldIds, migrationMap);

      expect(result).toEqual(['uuid-1', 'uuid-2', 'id3']);
    });

    it('keeps IDs not in migration map unchanged', () => {
      const oldIds = ['already-uuid', 'another-uuid'];
      const migrationMap: MigrationMap = {};

      const result = MigrationService.migrateIdReferences(oldIds, migrationMap);

      expect(result).toEqual(['already-uuid', 'another-uuid']);
    });

    it('handles empty arrays', () => {
      const result = MigrationService.migrateIdReferences([], {});
      expect(result).toEqual([]);
    });
  });

  describe('migrateLearningStatus', () => {
    it('migrates all ID references in learning status', () => {
      const status: LearningStatus = {
        completedIds: ['old1', 'old2'],
        incorrectIds: ['old3'],
        points: 100,
        learningLanguage: 'ko',
        quizStats: {
          old1: { correct: ['writing'], incorrect: [] },
          old2: { correct: [], incorrect: ['speaking'] },
        },
      };
      const migrationMap: MigrationMap = {
        old1: 'new-uuid-1',
        old2: 'new-uuid-2',
        old3: 'new-uuid-3',
      };

      const result = MigrationService.migrateLearningStatus(status, migrationMap);

      expect(result.completedIds).toEqual(['new-uuid-1', 'new-uuid-2']);
      expect(result.incorrectIds).toEqual(['new-uuid-3']);
      expect(result.points).toBe(100);
      expect(result.learningLanguage).toBe('ko');
      expect(result.quizStats?.['new-uuid-1']).toEqual({ correct: ['writing'], incorrect: [] });
      expect(result.quizStats?.['new-uuid-2']).toEqual({ correct: [], incorrect: ['speaking'] });
    });

    it('preserves status without quizStats', () => {
      const status: LearningStatus = {
        completedIds: ['old1'],
        incorrectIds: [],
        points: 50,
      };
      const migrationMap: MigrationMap = {
        old1: 'new-uuid-1',
      };

      const result = MigrationService.migrateLearningStatus(status, migrationMap);

      expect(result.completedIds).toEqual(['new-uuid-1']);
      expect(result.quizStats).toBeUndefined();
    });
  });
});
