import { describe, expect, test } from "bun:test";
import { SignInLimiter } from "./signInLimiter.ts";

describe("SignInLimiter", () => {
  test("blocks after the maximum number of attempts, per email", () => {
    const limiter = new SignInLimiter(2, 1000, () => 0);
    expect(limiter.attempt("a@example.test")).toBe(true);
    expect(limiter.attempt(" A@Example.test ")).toBe(true); // same email
    expect(limiter.attempt("a@example.test")).toBe(false);
    expect(limiter.attempt("b@example.test")).toBe(true);
  });

  test("allows attempts again after the window, and blocked attempts don't extend it", () => {
    let now = 0;
    const limiter = new SignInLimiter(1, 1000, () => now);
    limiter.attempt("a@example.test");
    now = 999;
    expect(limiter.attempt("a@example.test")).toBe(false);
    now = 1000;
    expect(limiter.attempt("a@example.test")).toBe(true);
  });

  test("reset clears the count", () => {
    const limiter = new SignInLimiter(1, 1000, () => 0);
    limiter.attempt("a@example.test");
    limiter.reset("A@example.test");
    expect(limiter.attempt("a@example.test")).toBe(true);
  });

  test("evicts the oldest entry when full", () => {
    const limiter = new SignInLimiter(1, 1000, () => 0, 2);
    limiter.attempt("a@example.test");
    limiter.attempt("b@example.test");
    limiter.attempt("c@example.test"); // evicts a
    expect(limiter.attempt("b@example.test")).toBe(false);
    expect(limiter.attempt("c@example.test")).toBe(false);
    expect(limiter.attempt("a@example.test")).toBe(true);
  });
});
