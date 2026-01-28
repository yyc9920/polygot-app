import { get, set, del } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import {
  SCHEMA_VERSION,
  type StorageMetadata,
  type LegacyPhrase,
  type PhraseEntity,
  type MigrationMap,
  type LearningStatus,
  isLegacyPhrase,
  isV2Phrase,
} from '../../types/schema';

const STORAGE_KEYS = {
  METADATA: 'storageMetadata',
  PHRASE_LIST: 'phraseList',
  PHRASE_LIST_BACKUP: 'phraseList_backup_v1',
  LEARNING_STATUS: 'learningStatus',
  MIGRATION_MAP: 'migrationMap',
} as const;

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  migrationMap: MigrationMap;
  error?: string;
}

export const MigrationService = {
  async getStorageMetadata(): Promise<StorageMetadata> {
    const metadata = await get<StorageMetadata>(STORAGE_KEYS.METADATA);
    if (metadata) return metadata;
    
    const phraseList = await get<unknown[]>(STORAGE_KEYS.PHRASE_LIST);
    const hasLegacyData = phraseList?.some(isLegacyPhrase) ?? false;
    const hasV2Data = phraseList?.some(isV2Phrase) ?? false;
    
    let detectedVersion: number = SCHEMA_VERSION.LEGACY;
    if (hasV2Data && !hasLegacyData) {
      detectedVersion = SCHEMA_VERSION.CURRENT;
    }
    
    return {
      schemaVersion: detectedVersion,
      migrationLog: [],
    };
  },

  async setStorageMetadata(metadata: StorageMetadata): Promise<void> {
    await set(STORAGE_KEYS.METADATA, metadata);
  },

  needsMigration(metadata: StorageMetadata): boolean {
    return metadata.schemaVersion < SCHEMA_VERSION.CURRENT;
  },

  async createBackup(): Promise<boolean> {
    try {
      const phraseList = await get<unknown[]>(STORAGE_KEYS.PHRASE_LIST);
      if (!phraseList || phraseList.length === 0) return true;
      
      await set(STORAGE_KEYS.PHRASE_LIST_BACKUP, phraseList);
      return true;
    } catch (error) {
      console.error('Failed to create backup:', error);
      return false;
    }
  },

  async restoreFromBackup(): Promise<boolean> {
    try {
      const backup = await get<unknown[]>(STORAGE_KEYS.PHRASE_LIST_BACKUP);
      if (!backup) {
        console.error('No backup found to restore');
        return false;
      }
      
      await set(STORAGE_KEYS.PHRASE_LIST, backup);
      return true;
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return false;
    }
  },

  async clearBackup(): Promise<void> {
    await del(STORAGE_KEYS.PHRASE_LIST_BACKUP);
  },

  migrateLegacyPhrase(legacy: LegacyPhrase, migrationMap: MigrationMap): PhraseEntity {
    const existingUuid = migrationMap[legacy.id];
    const newId = existingUuid || uuidv4();
    
    if (!existingUuid) {
      migrationMap[legacy.id] = newId;
    }
    
    const now = new Date().toISOString();
    
    return {
      id: newId,
      meaning: legacy.meaning,
      sentence: legacy.sentence,
      pronunciation: legacy.pronunciation,
      tags: legacy.tags || [],
      memo: legacy.memo,
      song: legacy.song,
      packageId: legacy.packageId,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };
  },

  migrateIdReferences(ids: string[], migrationMap: MigrationMap): string[] {
    return ids.map(id => migrationMap[id] || id);
  },

  migrateLearningStatus(
    status: LearningStatus,
    migrationMap: MigrationMap
  ): LearningStatus {
    return {
      ...status,
      completedIds: this.migrateIdReferences(status.completedIds, migrationMap),
      incorrectIds: this.migrateIdReferences(status.incorrectIds, migrationMap),
      quizStats: status.quizStats
        ? Object.fromEntries(
            Object.entries(status.quizStats).map(([id, stats]) => [
              migrationMap[id] || id,
              stats,
            ])
          )
        : undefined,
    };
  },

  async runMigration(): Promise<MigrationResult> {
    const metadata = await this.getStorageMetadata();
    
    if (!this.needsMigration(metadata)) {
      return {
        success: true,
        migratedCount: 0,
        migrationMap: {},
      };
    }
    
    const backupCreated = await this.createBackup();
    if (!backupCreated) {
      return {
        success: false,
        migratedCount: 0,
        migrationMap: {},
        error: 'Failed to create backup before migration',
      };
    }
    
    try {
      const phraseList = await get<unknown[]>(STORAGE_KEYS.PHRASE_LIST) || [];
      const learningStatus = await get<LearningStatus>(STORAGE_KEYS.LEARNING_STATUS);
      
      const migrationMap: MigrationMap = {};
      const migratedPhrases: PhraseEntity[] = [];
      
      for (const phrase of phraseList) {
        if (isV2Phrase(phrase)) {
          migratedPhrases.push(phrase);
        } else if (isLegacyPhrase(phrase)) {
          const migrated = this.migrateLegacyPhrase(phrase, migrationMap);
          migratedPhrases.push(migrated);
        }
      }
      
      await set(STORAGE_KEYS.PHRASE_LIST, migratedPhrases);
      await set(STORAGE_KEYS.MIGRATION_MAP, migrationMap);
      
      if (learningStatus && Object.keys(migrationMap).length > 0) {
        const migratedStatus = this.migrateLearningStatus(learningStatus, migrationMap);
        await set(STORAGE_KEYS.LEARNING_STATUS, migratedStatus);
      }
      
      const now = new Date().toISOString();
      const newMetadata: StorageMetadata = {
        schemaVersion: SCHEMA_VERSION.CURRENT,
        lastMigrationAt: now,
        migrationLog: [
          ...(metadata.migrationLog || []),
          {
            fromVersion: metadata.schemaVersion,
            toVersion: SCHEMA_VERSION.CURRENT,
            migratedAt: now,
            itemCount: Object.keys(migrationMap).length,
          },
        ],
      };
      await this.setStorageMetadata(newMetadata);
      
      await this.clearBackup();
      
      return {
        success: true,
        migratedCount: Object.keys(migrationMap).length,
        migrationMap,
      };
    } catch (error) {
      console.error('Migration failed, attempting rollback:', error);
      
      const restored = await this.restoreFromBackup();
      if (!restored) {
        console.error('CRITICAL: Rollback also failed!');
      }
      
      return {
        success: false,
        migratedCount: 0,
        migrationMap: {},
        error: error instanceof Error ? error.message : 'Unknown migration error',
      };
    }
  },

  async getMigrationMap(): Promise<MigrationMap> {
    return (await get<MigrationMap>(STORAGE_KEYS.MIGRATION_MAP)) || {};
  }
};
