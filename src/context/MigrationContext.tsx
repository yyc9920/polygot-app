import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { MigrationService, type MigrationResult } from '../lib/services/MigrationService';
import { purgeTombstones } from '../lib/sync';
import { NativeStorageAdapter } from '../lib/services/NativeStorageAdapter';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { PhraseEntity } from '../types/schema';

interface MigrationContextValue {
  migrationComplete: boolean;
  migrationResult: MigrationResult | null;
}

const MigrationContext = createContext<MigrationContextValue | undefined>(undefined);

interface MigrationProviderProps {
  children: ReactNode;
}

export function MigrationProvider({ children }: MigrationProviderProps) {
  const [migrationComplete, setMigrationComplete] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkAndRunMigration() {
      try {
        const metadata = await MigrationService.getStorageMetadata();

        if (!MigrationService.needsMigration(metadata)) {
          if (mounted) {
            setMigrationComplete(true);
            setMigrationResult({ success: true, migratedCount: 0, migrationMap: {} });
          }
          return;
        }

        console.log('[Migration] Starting migration from v1 to v2...');
        const result = await MigrationService.runMigration();

        if (mounted) {
          setMigrationResult(result);
          if (result.success) {
            console.log(`[Migration] Successfully migrated ${result.migratedCount} phrases`);
            
            const phraseList = await NativeStorageAdapter.get<PhraseEntity[]>('phraseList');
            if (phraseList && phraseList.length > 0) {
              const purged = purgeTombstones(phraseList);
              if (purged.length < phraseList.length) {
                console.log(`[Migration] Purged ${phraseList.length - purged.length} old tombstones`);
                await NativeStorageAdapter.set('phraseList', purged);
              }
            }
            
            setMigrationComplete(true);
          } else {
            console.error('[Migration] Migration failed:', result.error);
            setError(result.error || 'Unknown migration error');
          }
        }
      } catch (err) {
        console.error('[Migration] Unexpected error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unexpected migration error');
        }
      }
    }

    checkAndRunMigration();

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md shadow-lg">
          <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">
            Migration Error
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Failed to migrate your data to the new format. Your data has been preserved.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-2 rounded font-mono">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!migrationComplete) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          Upgrading your data...
        </p>
      </div>
    );
  }

  return (
    <MigrationContext.Provider value={{ migrationComplete, migrationResult }}>
      {children}
    </MigrationContext.Provider>
  );
}

export function useMigration() {
  const context = useContext(MigrationContext);
  if (context === undefined) {
    throw new Error('useMigration must be used within a MigrationProvider');
  }
  return context;
}
