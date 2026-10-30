/**
 * Sliding-window limiter persisted in localStorage. This is a courtesy limit that stops
 * accidental floods from one browser; the real protection is App Check and the
 * per-user rate limit configured for Firebase AI Logic in the Firebase console.
 */
export class SlidingWindowLimiter {
  private memory: number[] = [];

  constructor(
    private readonly key: string,
    private readonly max: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  private load(): number[] {
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) this.memory = (JSON.parse(raw) as number[]).filter((n) => typeof n === 'number');
    } catch {
      // Storage unavailable (private mode): fall back to in-memory only.
    }
    const cutoff = this.now() - this.windowMs;
    return (this.memory = this.memory.filter((t) => t > cutoff));
  }

  private save() {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.memory));
    } catch {
      // ignore
    }
  }

  /** Records an attempt. Returns false (and records nothing) when over the limit. */
  tryAcquire(): boolean {
    const hits = this.load();
    if (hits.length >= this.max) return false;
    hits.push(this.now());
    this.save();
    return true;
  }

  /** Milliseconds until the next attempt is allowed (0 if allowed now). */
  retryAfterMs(): number {
    const hits = this.load();
    if (hits.length < this.max) return 0;
    return Math.max(0, hits[0] + this.windowMs - this.now());
  }
}
