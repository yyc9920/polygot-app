export type SyncErrorType = 'cloud_save' | 'cloud_load' | 'local_save' | 'local_load' | 'migration';

export interface SyncError {
  type: SyncErrorType;
  key: string;
  message: string;
  timestamp: number;
}

type SyncErrorListener = (error: SyncError) => void;

const listeners = new Set<SyncErrorListener>();

export const SyncErrorService = {
  subscribe(listener: SyncErrorListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  emit(type: SyncErrorType, key: string, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    const syncError: SyncError = {
      type,
      key,
      message,
      timestamp: Date.now(),
    };
    
    listeners.forEach(listener => listener(syncError));
  },
};
