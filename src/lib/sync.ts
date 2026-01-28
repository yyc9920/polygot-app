import { get, set } from 'idb-keyval';
import type { PhraseEntity, SyncRetryItem, SyncRetryQueue } from '../types/schema';

const TOMBSTONE_TTL_DAYS = 30;
const RETRY_QUEUE_KEY = 'sync-retry-queue';
const BACKOFF_BASE_MS = 1000;
const MAX_RETRY_COUNT = 5;

export function lastWriteWins<T extends { updatedAt?: string }>(local: T[], cloud: T[]): T[] {
  const mergedMap = new Map<string, T>();

  for (const item of local) {
    const key = (item as { id?: string }).id || JSON.stringify(item);
    mergedMap.set(key, item);
  }

  for (const cloudItem of cloud) {
    const key = (cloudItem as { id?: string }).id || JSON.stringify(cloudItem);
    const localItem = mergedMap.get(key);

    if (!localItem) {
      mergedMap.set(key, cloudItem);
      continue;
    }

    const localTime = localItem.updatedAt ? new Date(localItem.updatedAt).getTime() : 0;
    const cloudTime = cloudItem.updatedAt ? new Date(cloudItem.updatedAt).getTime() : 0;

    if (cloudTime > localTime) {
      mergedMap.set(key, cloudItem);
    }
  }

  return Array.from(mergedMap.values());
}

export function purgeTombstones(phrases: PhraseEntity[]): PhraseEntity[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - TOMBSTONE_TTL_DAYS);
  const cutoffTime = cutoffDate.getTime();

  return phrases.filter(phrase => {
    if (!phrase.isDeleted) return true;

    if (!phrase.deletedAt) return true;

    const deletedTime = new Date(phrase.deletedAt).getTime();
    return deletedTime > cutoffTime;
  });
}

export function filterActivePhrases(phrases: PhraseEntity[]): PhraseEntity[] {
  return phrases.filter(phrase => !phrase.isDeleted);
}

export function softDeletePhrase(phrase: PhraseEntity): PhraseEntity {
  const now = new Date().toISOString();
  return {
    ...phrase,
    isDeleted: true,
    deletedAt: now,
    updatedAt: now,
  };
}

export function updatePhraseTimestamp(phrase: PhraseEntity): PhraseEntity {
  return {
    ...phrase,
    updatedAt: new Date().toISOString(),
  };
}

export async function getRetryQueue(): Promise<SyncRetryQueue> {
  return (await get<SyncRetryQueue>(RETRY_QUEUE_KEY)) || [];
}

export async function addToRetryQueue(
  key: string,
  value: unknown,
  error?: string
): Promise<void> {
  const queue = await getRetryQueue();

  const existingIndex = queue.findIndex(item => item.key === key);
  const item: SyncRetryItem = {
    key,
    value,
    timestamp: Date.now(),
    retryCount: existingIndex >= 0 ? queue[existingIndex].retryCount + 1 : 0,
    lastError: error,
  };

  if (existingIndex >= 0) {
    queue[existingIndex] = item;
  } else {
    queue.push(item);
  }

  await set(RETRY_QUEUE_KEY, queue);
}

export async function removeFromRetryQueue(key: string): Promise<void> {
  const queue = await getRetryQueue();
  const filtered = queue.filter(item => item.key !== key);
  await set(RETRY_QUEUE_KEY, filtered);
}

export async function clearRetryQueue(): Promise<void> {
  await set(RETRY_QUEUE_KEY, []);
}

export function calculateBackoff(retryCount: number): number {
  return Math.min(BACKOFF_BASE_MS * Math.pow(2, retryCount), 30000);
}

export function shouldRetry(item: SyncRetryItem): boolean {
  return item.retryCount < MAX_RETRY_COUNT;
}

export type SyncOperation = (key: string, value: unknown) => Promise<void>;

export async function processRetryQueue(
  syncOperation: SyncOperation,
  onProgress?: (processed: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  const queue = await getRetryQueue();
  if (queue.length === 0) {
    return { success: 0, failed: 0 };
  }

  let success = 0;
  let failed = 0;

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];

    if (!shouldRetry(item)) {
      failed++;
      continue;
    }

    const backoffMs = calculateBackoff(item.retryCount);
    await new Promise(resolve => setTimeout(resolve, backoffMs));

    try {
      await syncOperation(item.key, item.value);
      await removeFromRetryQueue(item.key);
      success++;
    } catch (error) {
      await addToRetryQueue(
        item.key,
        item.value,
        error instanceof Error ? error.message : 'Unknown error'
      );
      failed++;
    }

    onProgress?.(i + 1, queue.length);
  }

  return { success, failed };
}

let onlineHandler: (() => void) | null = null;

export function setupOnlineListener(onOnline: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  onlineHandler = onOnline;
  window.addEventListener('online', onlineHandler);

  return () => {
    if (onlineHandler) {
      window.removeEventListener('online', onlineHandler);
      onlineHandler = null;
    }
  };
}
