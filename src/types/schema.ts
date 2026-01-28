/**
 * Schema Definitions for Polyglot Data Layer (v2)
 * 
 * Version History:
 * - v1: PhraseItem - content-based IDs, no metadata
 * - v2: PhraseEntity - UUID-based IDs, timestamps, soft delete
 */

import { z } from 'zod';

export const SCHEMA_VERSION = {
  LEGACY: 1,
  CURRENT: 2,
} as const;

export type SchemaVersion = typeof SCHEMA_VERSION[keyof typeof SCHEMA_VERSION];

export const SongDataSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  artist: z.string(),
  thumbnailUrl: z.string(),
});

export type SongData = z.infer<typeof SongDataSchema>;

/** Legacy PhraseItem schema (v1) - content-based hash IDs, no timestamps */
export const LegacyPhraseSchema = z.object({
  id: z.string(),
  meaning: z.string(),
  sentence: z.string(),
  pronunciation: z.string().optional(),
  tags: z.array(z.string()),
  memo: z.string().optional(),
  song: SongDataSchema.optional(),
  packageId: z.string().optional(),
});

export type LegacyPhrase = z.infer<typeof LegacyPhraseSchema>;

/** PhraseEntity schema (v2) - UUID IDs, timestamps, soft delete support */
export const PhraseEntitySchema = z.object({
  id: z.uuid(),
  meaning: z.string().min(1, 'Meaning is required'),
  sentence: z.string().min(1, 'Sentence is required'),
  pronunciation: z.string().optional(),
  tags: z.array(z.string()).default([]),
  memo: z.string().optional(),
  song: SongDataSchema.optional(),
  packageId: z.string().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  isDeleted: z.boolean().default(false),
  deletedAt: z.iso.datetime().optional(),
});

export type PhraseEntity = z.infer<typeof PhraseEntitySchema>;

export const QuizTypeSchema = z.enum(['writing', 'interpretation', 'cloze', 'speaking', 'listening']);

export type QuizType = z.infer<typeof QuizTypeSchema>;

export const QuizStatsEntrySchema = z.object({
  correct: z.array(QuizTypeSchema),
  incorrect: z.array(QuizTypeSchema),
});

export const LearningStatusSchema = z.object({
  completedIds: z.array(z.string()),
  incorrectIds: z.array(z.string()),
  points: z.number().default(0),
  learningLanguage: z.string().optional(),
  quizStats: z.record(z.string(), QuizStatsEntrySchema).optional(),
});

export type LearningStatus = z.infer<typeof LearningStatusSchema>;

export const StorageMetadataSchema = z.object({
  schemaVersion: z.number(),
  lastMigrationAt: z.iso.datetime().optional(),
  migrationLog: z.array(z.object({
    fromVersion: z.number(),
    toVersion: z.number(),
    migratedAt: z.iso.datetime(),
    itemCount: z.number(),
  })).optional(),
});

export type StorageMetadata = z.infer<typeof StorageMetadataSchema>;

/** Maps old content-based IDs to new UUIDs for reference updates */
export const MigrationMapSchema = z.record(z.string(), z.uuid());

export type MigrationMap = z.infer<typeof MigrationMapSchema>;

export const SyncRetryItemSchema = z.object({
  key: z.string(),
  value: z.unknown(),
  timestamp: z.number(),
  retryCount: z.number().default(0),
  lastError: z.string().optional(),
});

export type SyncRetryItem = z.infer<typeof SyncRetryItemSchema>;

export const SyncRetryQueueSchema = z.array(SyncRetryItemSchema);

export type SyncRetryQueue = z.infer<typeof SyncRetryQueueSchema>;

export function validatePhraseEntity(data: unknown): PhraseEntity {
  return PhraseEntitySchema.parse(data);
}

export function safeParsePhraseEntity(data: unknown) {
  return PhraseEntitySchema.safeParse(data);
}

export function validateLegacyPhrase(data: unknown): LegacyPhrase {
  return LegacyPhraseSchema.parse(data);
}

export function isV2Phrase(phrase: unknown): phrase is PhraseEntity {
  if (!phrase || typeof phrase !== 'object') return false;
  const p = phrase as Record<string, unknown>;
  return (
    typeof p.createdAt === 'string' &&
    typeof p.updatedAt === 'string' &&
    typeof p.isDeleted === 'boolean'
  );
}

export function isLegacyPhrase(phrase: unknown): phrase is LegacyPhrase {
  if (!phrase || typeof phrase !== 'object') return false;
  const p = phrase as Record<string, unknown>;
  return (
    typeof p.id === 'string' &&
    typeof p.meaning === 'string' &&
    typeof p.sentence === 'string' &&
    !('createdAt' in p)
  );
}

export const ImportPhraseSchema = z.object({
  meaning: z.string().min(1),
  sentence: z.string().min(1),
  pronunciation: z.string().optional(),
  tags: z.union([
    z.array(z.string()),
    z.string().transform(s => s.split(',').map(t => t.trim()).filter(Boolean)),
  ]).default([]),
  memo: z.string().optional(),
});

export type ImportPhrase = z.infer<typeof ImportPhraseSchema>;

export function validateImportData(data: unknown[]): ImportPhrase[] {
  return data.map((item, index) => {
    try {
      return ImportPhraseSchema.parse(item);
    } catch (error) {
      throw new Error(`Invalid phrase at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}
