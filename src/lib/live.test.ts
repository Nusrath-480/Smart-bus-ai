import { describe, expect, it } from "vitest";
import { isStale } from "./live";

describe("live location freshness", () => {
  const now = Date.parse("2026-10-28T10:00:00Z");
  it("treats a position from 1 minute ago as live", () => {
    expect(isStale("2026-10-28T09:59:00Z", now)).toBe(false);
  });
  it("treats a position from 3 minutes ago as stale", () => {
    expect(isStale("2026-10-28T09:57:00Z", now)).toBe(true);
  });
});
