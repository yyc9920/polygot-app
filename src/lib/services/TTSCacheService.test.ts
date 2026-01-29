import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TTSCacheService } from './TTSCacheService';

vi.mock('idb-keyval', () => {
  const store = new Map<string, unknown>();
  return {
    get: vi.fn((key: string) => Promise.resolve(store.get(key))),
    set: vi.fn((key: string, value: unknown) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    del: vi.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
    keys: vi.fn(() => Promise.resolve(Array.from(store.keys()))),
    __store: store,
    __clear: () => store.clear(),
  };
});

describe('TTSCacheService', () => {
  beforeEach(async () => {
    const { __clear } = await import('idb-keyval') as unknown as { __clear: () => void };
    __clear();
  });

  describe('generateKey', () => {
    it('generates consistent key for same content and voice', async () => {
      const key1 = await TTSCacheService.generateKey('Hello world', 'en-US-Standard-A');
      const key2 = await TTSCacheService.generateKey('Hello world', 'en-US-Standard-A');

      expect(key1).toBe(key2);
    });

    it('generates different keys for different content', async () => {
      const key1 = await TTSCacheService.generateKey('Hello', 'en-US-Standard-A');
      const key2 = await TTSCacheService.generateKey('World', 'en-US-Standard-A');

      expect(key1).not.toBe(key2);
    });

    it('generates different keys for different voices', async () => {
      const key1 = await TTSCacheService.generateKey('Hello', 'en-US-Standard-A');
      const key2 = await TTSCacheService.generateKey('Hello', 'ja-JP-Standard-A');

      expect(key1).not.toBe(key2);
    });

    it('sanitizes voice ID to remove special characters', async () => {
      const key = await TTSCacheService.generateKey('Hello', 'Voice with spaces/and:colons');

      expect(key).not.toContain(' ');
      expect(key).not.toContain('/');
      expect(key).not.toContain(':');
    });
  });

  describe('store and get', () => {
    it('stores and retrieves audio data', async () => {
      const audioData = new ArrayBuffer(1024);
      new Uint8Array(audioData).fill(42);

      await TTSCacheService.store('Test sentence', 'test-voice', audioData);
      const retrieved = await TTSCacheService.get('Test sentence', 'test-voice');

      expect(retrieved).not.toBeNull();
      expect(retrieved!.byteLength).toBe(1024);
    });

    it('returns null for cache miss', async () => {
      const result = await TTSCacheService.get('Non-existent', 'voice');

      expect(result).toBeNull();
    });

    it('updates lastAccessed on get', async () => {
      const audioData = new ArrayBuffer(100);
      await TTSCacheService.store('Test', 'voice', audioData);

      const { get } = await import('idb-keyval');
      const key = await TTSCacheService.generateKey('Test', 'voice');
      const entryBefore = await get(key) as { lastAccessed: number };
      
      await new Promise(resolve => setTimeout(resolve, 10));
      await TTSCacheService.get('Test', 'voice');
      
      const entryAfter = await get(key) as { lastAccessed: number };
      
      expect(entryAfter.lastAccessed).toBeGreaterThanOrEqual(entryBefore.lastAccessed);
    });
  });

  describe('evictStale', () => {
    it('evicts entries older than TTL', async () => {
      const { set, __store } = await import('idb-keyval') as unknown as { 
        set: (k: string, v: unknown) => Promise<void>;
        __store: Map<string, unknown>;
      };

      const oldEntry = {
        audioData: new ArrayBuffer(100),
        lastAccessed: Date.now() - 31 * 24 * 60 * 60 * 1000,
        createdAt: Date.now() - 31 * 24 * 60 * 60 * 1000,
      };
      
      await set('tts_old_entry_voice', oldEntry);

      const newEntry = {
        audioData: new ArrayBuffer(100),
        lastAccessed: Date.now(),
        createdAt: Date.now(),
      };
      await set('tts_new_entry_voice', newEntry);

      const evicted = await TTSCacheService.evictStale();

      expect(evicted).toBe(1);
      expect(__store.has('tts_old_entry_voice')).toBe(false);
      expect(__store.has('tts_new_entry_voice')).toBe(true);
    });

    it('returns 0 when no stale entries', async () => {
      const audioData = new ArrayBuffer(100);
      await TTSCacheService.store('Fresh', 'voice', audioData);

      const evicted = await TTSCacheService.evictStale();

      expect(evicted).toBe(0);
    });
  });

  describe('getCacheStats', () => {
    it('returns count and total size', async () => {
      const audio1 = new ArrayBuffer(1000);
      const audio2 = new ArrayBuffer(2000);

      await TTSCacheService.store('Sentence 1', 'voice', audio1);
      await TTSCacheService.store('Sentence 2', 'voice', audio2);

      const stats = await TTSCacheService.getCacheStats();

      expect(stats.count).toBe(2);
      expect(stats.totalSize).toBe(3000);
    });

    it('returns zeros for empty cache', async () => {
      const stats = await TTSCacheService.getCacheStats();

      expect(stats.count).toBe(0);
      expect(stats.totalSize).toBe(0);
    });
  });

  describe('clearAll', () => {
    it('removes all TTS cache entries', async () => {
      await TTSCacheService.store('One', 'voice', new ArrayBuffer(100));
      await TTSCacheService.store('Two', 'voice', new ArrayBuffer(100));

      const cleared = await TTSCacheService.clearAll();

      expect(cleared).toBe(2);

      const stats = await TTSCacheService.getCacheStats();
      expect(stats.count).toBe(0);
    });

    it('does not affect non-TTS entries', async () => {
      const { set, __store } = await import('idb-keyval') as unknown as { 
        set: (k: string, v: unknown) => Promise<void>;
        __store: Map<string, unknown>;
      };

      await set('other_key', { data: 'value' });
      await TTSCacheService.store('Test', 'voice', new ArrayBuffer(100));

      await TTSCacheService.clearAll();

      expect(__store.has('other_key')).toBe(true);
    });
  });
});
