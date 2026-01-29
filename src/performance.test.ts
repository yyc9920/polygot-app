import { describe, it, expect } from 'vitest';
import { createPhraseEntity } from './types/schema';
import { FSRSSyncService } from './lib/services/FSRSSyncService';

describe('Performance Baselines', () => {
  const generateLargeDataset = (count: number, startIndex = 0) => {
    return Array.from({ length: count }, (_, i) => 
      createPhraseEntity(
        `uuid-${startIndex + i}`,
        `Meaning ${startIndex + i}`,
        `Sentence ${startIndex + i}`
      )
    );
  };

  it('benchmark: heavy merge scenario (5000 local, 5000 cloud, 50% overlap)', () => {
      // Local: 0-4999 (5000 items)
      // Cloud: 2500-7499 (5000 items)
      // Expected Overlap: 2500 items (2500-4999)
      // Expected Total: 7500 items
      const local = generateLargeDataset(5000, 0);
      const cloud = generateLargeDataset(5000, 2500);
      
      const start = performance.now();
      const merged = FSRSSyncService.mergePhraseLists(local, cloud);
      const duration = performance.now() - start;
      
      console.log(`[Benchmark] heavy merge (5k+5k, 50% overlap): ${duration.toFixed(2)}ms`);
      
      // Ensure performance is acceptable (under 500ms for large merge)
      expect(duration).toBeLessThan(500);
      expect(merged.length).toBe(7500);
  });
});
