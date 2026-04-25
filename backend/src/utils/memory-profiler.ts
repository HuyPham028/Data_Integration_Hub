// backend/src/utils/memory-profiler.ts
export class MemoryProfiler {
  private samples: number[] = [];
  private interval: NodeJS.Timeout;

  start(intervalMs = 500) {
    this.samples = [];
    this.interval = setInterval(() => {
      this.samples.push(process.memoryUsage().rss);
    }, intervalMs);
  }

  stop() {
    clearInterval(this.interval);
    const mb = (b: number) => +(b / 1024 / 1024).toFixed(1);
    return {
      peakMB: mb(Math.max(...this.samples)),
      baseMB: mb(this.samples[0]),
      deltaRSS: mb(Math.max(...this.samples) - this.samples[0]),
      samples: this.samples.length,
    };
  }
}
