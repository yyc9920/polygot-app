import { get, set, keys, del } from 'idb-keyval';

const TTS_CACHE_PREFIX = 'tts_';
const CACHE_TTL_DAYS = 30;
const CACHE_TTL_MS = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;

interface TTSCacheEntry {
  audioData: ArrayBuffer;
  lastAccessed: number;
  createdAt: number;
}

async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

function buildCacheKey(contentHash: string, voiceId: string): string {
  const sanitizedVoiceId = voiceId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${TTS_CACHE_PREFIX}${contentHash}_${sanitizedVoiceId}`;
}

export const TTSCacheService = {
  async generateKey(sentence: string, voiceId: string): Promise<string> {
    const contentHash = await hashContent(sentence);
    return buildCacheKey(contentHash, voiceId);
  },

  async get(sentence: string, voiceId: string): Promise<ArrayBuffer | null> {
    const key = await this.generateKey(sentence, voiceId);
    const entry = await get<TTSCacheEntry>(key);
    
    if (!entry) return null;

    const updatedEntry: TTSCacheEntry = {
      ...entry,
      lastAccessed: Date.now(),
    };
    await set(key, updatedEntry);

    return entry.audioData;
  },

  async store(sentence: string, voiceId: string, audioData: ArrayBuffer): Promise<void> {
    const key = await this.generateKey(sentence, voiceId);
    const now = Date.now();
    
    const entry: TTSCacheEntry = {
      audioData,
      lastAccessed: now,
      createdAt: now,
    };
    
    await set(key, entry);
  },

  async evictStale(): Promise<number> {
    const allKeys = await keys();
    const ttsKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith(TTS_CACHE_PREFIX));
    
    const now = Date.now();
    let evictedCount = 0;

    for (const key of ttsKeys) {
      const entry = await get<TTSCacheEntry>(key as string);
      if (!entry) continue;

      const age = now - entry.lastAccessed;
      if (age > CACHE_TTL_MS) {
        await del(key);
        evictedCount++;
      }
    }

    return evictedCount;
  },

  async getCacheStats(): Promise<{ count: number; totalSize: number }> {
    const allKeys = await keys();
    const ttsKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith(TTS_CACHE_PREFIX));
    
    let totalSize = 0;
    for (const key of ttsKeys) {
      const entry = await get<TTSCacheEntry>(key as string);
      if (entry?.audioData) {
        totalSize += entry.audioData.byteLength;
      }
    }

    return { count: ttsKeys.length, totalSize };
  },

  async clearAll(): Promise<number> {
    const allKeys = await keys();
    const ttsKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith(TTS_CACHE_PREFIX));
    
    for (const key of ttsKeys) {
      await del(key);
    }

    return ttsKeys.length;
  },
};
