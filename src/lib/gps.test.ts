import { describe, expect, it } from "vitest";
import { shouldSendLocation, toKmh } from "./gps";

describe("driver GPS uploads", () => {
  it("sends the first location immediately", () => {
    expect(shouldSendLocation(null, 1000)).toBe(true);
  });
  it("waits 10 seconds between uploads", () => {
    expect(shouldSendLocation(0, 9_999)).toBe(false);
    expect(shouldSendLocation(0, 10_000)).toBe(true);
  });
  it("converts 10 m/s to 36 km/h", () => {
    expect(toKmh(10)).toBe(36);
  });
});
