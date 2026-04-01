/**
 * Sliding window rate limiter for AppFolio API calls (ENGINE-01, D-10).
 *
 * Enforces a maximum of maxRequests requests within windowMs milliseconds.
 * Excess requests are queued transparently — callers are never told they are
 * being rate-limited, they simply wait. Per D-10: conservative limit of
 * 5 req/15s.
 */
export class RateLimiter {
  private timestamps: number[] = [];
  private queue: Array<{
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    fn: () => Promise<any>;
  }> = [];
  private processing = false;

  constructor(
    private maxRequests: number = 5,
    private windowMs: number = 15_000
  ) {}

  /**
   * Execute a function within the rate limit window.
   * If the window is full, queues the call and waits until capacity is available.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject, fn });
      void this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      this.clearExpiredTimestamps();

      if (this.timestamps.length >= this.maxRequests) {
        const oldestTimestamp = this.timestamps[0];
        const waitTime = oldestTimestamp + this.windowMs - Date.now();
        if (waitTime > 0) {
          await new Promise<void>((r) => setTimeout(r, waitTime));
        }
        this.clearExpiredTimestamps();
      }

      const item = this.queue.shift()!;
      this.timestamps.push(Date.now());
      try {
        const result = await item.fn();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }

    this.processing = false;
  }

  private clearExpiredTimestamps(): void {
    const cutoff = Date.now() - this.windowMs;
    this.timestamps = this.timestamps.filter((t) => t > cutoff);
  }
}
