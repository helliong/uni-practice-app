import assert from "node:assert/strict";
import test from "node:test";
import {
  checkRateLimit,
  clearRateLimit,
  consumeRateLimit,
  formatRetryAfter,
  getClientIpFromHeaders,
} from "./rateLimit";

test("rate limit allows configured number of requests and then blocks", () => {
  const key = "rate-limit-test";
  const config = { limit: 2, windowMs: 60_000 };
  clearRateLimit(key);

  assert.deepEqual(consumeRateLimit(key, config), {
    allowed: true,
    remaining: 1,
    retryAfter: 0,
    resetAt: checkRateLimit(key, config).resetAt,
  });
  assert.equal(consumeRateLimit(key, config).allowed, true);
  assert.equal(consumeRateLimit(key, config).allowed, false);
  clearRateLimit(key);
  assert.equal(checkRateLimit(key, config).remaining, 2);
});

test("rate limit window resets after expiration", () => {
  const originalDateNow = Date.now;
  let now = 1_000_000;
  Date.now = () => now;

  try {
    const key = "rate-limit-expiration-test";
    const config = { limit: 1, windowMs: 1_000 };
    clearRateLimit(key);
    assert.equal(consumeRateLimit(key, config).allowed, true);
    assert.equal(consumeRateLimit(key, config).allowed, false);
    now += 1_001;
    assert.equal(consumeRateLimit(key, config).allowed, true);
  } finally {
    Date.now = originalDateNow;
  }
});

test("client IP uses the first forwarded address and falls back safely", () => {
  assert.equal(getClientIpFromHeaders({ "x-forwarded-for": "192.168.1.5, 10.0.0.1" }), "192.168.1.5");
  assert.equal(getClientIpFromHeaders(new Headers({ "x-real-ip": "127.0.0.1" })), "127.0.0.1");
  assert.equal(getClientIpFromHeaders(), "unknown");
});

test("retry time is formatted in seconds and minutes", () => {
  assert.equal(formatRetryAfter(0), "1 сек.");
  assert.equal(formatRetryAfter(45), "45 сек.");
  assert.equal(formatRetryAfter(120), "2 мин.");
  assert.equal(formatRetryAfter(125), "2 мин. 5 сек.");
});
