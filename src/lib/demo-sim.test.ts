import { describe, expect, it } from "vitest";
import { pointAlong } from "./demo-sim";

describe("demo movement", () => {
  const pts = [{ lat: 0, lng: 0 }, { lat: 10, lng: 0 }, { lat: 10, lng: 10 }];
  it("starts at the first stop", () => expect(pointAlong(pts, 0)).toEqual({ lat: 0, lng: 0 }));
  it("is halfway along the route at t=0.5", () => expect(pointAlong(pts, 0.5)).toEqual({ lat: 10, lng: 0 }));
  it("ends at the last stop", () => expect(pointAlong(pts, 1)).toEqual({ lat: 10, lng: 10 }));
});
