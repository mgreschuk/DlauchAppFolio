import { describe, it, expect, vi } from "vitest";
import { RateLimiter } from "../rate-limiter";

describe("RateLimiter", () => {
  it("allows up to maxRequests calls to execute immediately", async () => {
    const limiter = new RateLimiter(5, 15_000);
    const results: number[] = [];
    const start = Date.now();

    // Execute 5 concurrent calls — all should resolve quickly
    await Promise.all(
      [1, 2, 3, 4, 5].map((n) =>
        limiter.execute(async () => {
          results.push(n);
          return n;
        })
      )
    );

    const elapsed = Date.now() - start;
    expect(results).toHaveLength(5);
    // All 5 should complete within 500ms (no rate limiting needed)
    expect(elapsed).toBeLessThan(500);
  });

  it("queues the 6th request until the window slides", async () => {
    // Use a very short window to make the test fast
    const limiter = new RateLimiter(5, 200);
    const order: number[] = [];

    const start = Date.now();
    // Fire all 6 concurrently
    await Promise.all(
      [1, 2, 3, 4, 5, 6].map((n) =>
        limiter.execute(async () => {
          order.push(n);
          return n;
        })
      )
    );

    const elapsed = Date.now() - start;
    // The 6th call should have been delayed (elapsed >= window)
    expect(elapsed).toBeGreaterThanOrEqual(150);
    // All 6 should have executed
    expect(order).toHaveLength(6);
  });

  it("returns the result of the wrapped function", async () => {
    const limiter = new RateLimiter(5, 15_000);
    const result = await limiter.execute(async () => "hello-world");
    expect(result).toBe("hello-world");
  });

  it("propagates errors from the wrapped function", async () => {
    const limiter = new RateLimiter(5, 15_000);
    await expect(
      limiter.execute(async () => {
        throw new Error("something went wrong");
      })
    ).rejects.toThrow("something went wrong");
  });
});
