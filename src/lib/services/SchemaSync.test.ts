import { describe, it, expect, vi } from 'vitest';
import { StorageService } from './StorageService';
import { onSnapshot } from 'firebase/firestore';

vi.mock('./NativeStorageAdapter', () => ({
  NativeStorageAdapter: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    keys: vi.fn(() => Promise.resolve([])),
  },
}));

describe('Schema Version Handling (Graceful Degradation)', () => {
  const USER_ID = 'test-user';
  const KEY = 'test-key';

  it('should ignore unknown fields from newer schema versions', () => {
    const mockOnSnapshot = vi.mocked(onSnapshot);
    const callback = vi.fn();
    
    // Simulate cloud sending data with a future schema version (v99)
    // and an unknown field 'telepathyEnabled'
    const futureData = {
      value: {
        id: '123',
        meaning: 'Hello',
        telepathyEnabled: true,
      },
      schemaVersion: 99
    };

    mockOnSnapshot.mockImplementation((_ref, cb) => {
      const mockSnap = {
        exists: () => true,
        data: () => futureData
      };
      // @ts-ignore
      cb(mockSnap);
      return () => {};
    });

    StorageService.subscribeToCloud(USER_ID, KEY, callback);

    // Verify the callback receives the raw data but with metadata indicating future version
    // The actual "ignoring" happens in the application layer (PhraseContext/Zod), 
    // but the transport layer must pass the metadata correctly.
    expect(callback).toHaveBeenCalledWith(
        futureData.value, 
        expect.objectContaining({ schemaVersion: 99 })
    );
  });
});
