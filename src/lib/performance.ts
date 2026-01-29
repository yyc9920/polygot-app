export const PerformanceMonitor = {
  marks: new Map<string, number>(),

  start(label: string) {
    this.marks.set(label, performance.now());
  },

  end(label: string) {
    const startTime = this.marks.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
      this.marks.delete(label);
      return duration;
    }
    return 0;
  },

  measure<T>(label: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    return result;
  },

  async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    return result;
  }
};
