import { describe, expect, it } from "vitest";
import { etaMinutes, isOffRoute, predictOccupancy } from "./predict";

const stops = [{ lat: 12.9, lng: 77.5 }, { lat: 12.91, lng: 77.5 }, { lat: 12.92, lng: 77.5 }];

describe("predictions", () => {
  it("flags a bus more than 300 m off the route", () => {
    expect(isOffRoute({ lat: 12.905, lng: 77.5 }, stops)).toBe(false);
    expect(isOffRoute({ lat: 12.905, lng: 77.51 }, stops)).toBe(true);
  });
  it("ETA: passed stops are null, upcoming stops increase", () => {
    const eta = etaMinutes({ lat: 12.905, lng: 77.5 }, stops, 30);
    expect(eta[0]).toBeNull();
    expect(eta[1]).toBeGreaterThan(0);
    expect(eta[2]).toBeGreaterThan(eta[1] ?? Infinity);
  });
  it("uses 20 km/h when speed is missing or at most 5 km/h", () => {
    const p = { lat: 12.905, lng: 77.5 };
    expect(etaMinutes(p, stops, null)).toEqual([null, 2, 5]);
    expect(etaMinutes(p, stops, 5)).toEqual([null, 2, 5]);
    expect(etaMinutes(p, stops, 20)).toEqual([null, 2, 5]);
  });
  it("requires at least three real crowding samples", () => {
    const t = new Date(2026, 10, 1, 8).toISOString();
    const obs = [44, 46].map(passenger_count => ({ passenger_count, recorded_at: t, is_demo: false }));
    expect(predictOccupancy(obs, 8, 50)).toEqual({ level: "unknown", count: null, samples: 2 });
    expect(predictOccupancy([...obs, { passenger_count: 45, recorded_at: t, is_demo: false }], 8, 50)).toEqual({ level: "high", count: 45, samples: 3 });
  });
  it("occupancy ignores demo data and needs 3 samples", () => {
    const t = new Date(); t.setHours(8);
    const at = t.toISOString();
    const demo = [1, 2, 3].map(() => ({ passenger_count: 50, recorded_at: at, is_demo: true }));
    expect(predictOccupancy(demo, 8, 50).level).toBe("unknown");
    const real = [45, 44, 46].map((c) => ({ passenger_count: c, recorded_at: at, is_demo: false }));
    expect(predictOccupancy(real, 8, 50)).toMatchObject({ level: "high", count: 45 });
  });
});
