/** Rule-based estimates (v1). Clearly labelled "Estimate" in the UI — not a trained model. */
export type Pt = { lat: number; lng: number };

export const FALLBACK_SPEED_KMH = 20;
export const OFF_ROUTE_METERS = 300;

export function haversineM(a: Pt, b: Pt) {
  const R = 6371000, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Distance from p to segment ab (equirectangular approx) and fraction along it. */
function toSegment(p: Pt, a: Pt, b: Pt) {
  const kx = Math.cos(((a.lat + b.lat) / 2) * Math.PI / 180);
  const ax = a.lng * kx, bx = b.lng * kx, px = p.lng * kx;
  const dx = bx - ax, dy = b.lat - a.lat;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.min(1, Math.max(0, ((px - ax) * dx + (p.lat - a.lat) * dy) / len2));
  const proj = { lat: a.lat + dy * t, lng: a.lng + (b.lng - a.lng) * t };
  return { dist: haversineM(p, proj), t };
}

/** Distance in metres from the bus to the route line through its stops. */
export function distanceFromRoute(p: Pt, stops: Pt[]) {
  if (!stops.length) return null;
  if (stops.length === 1) return haversineM(p, stops[0]!);
  let best = Infinity;
  for (let i = 0; i < stops.length - 1; i++) best = Math.min(best, toSegment(p, stops[i]!, stops[i + 1]!).dist);
  return best;
}

export function isOffRoute(p: Pt, stops: Pt[]) {
  const d = distanceFromRoute(p, stops);
  return d != null && d > OFF_ROUTE_METERS;
}

/** Minutes until the bus reaches each stop; null for stops already passed. */
export function etaMinutes(p: Pt, stops: Pt[], speedKmh: number | null) {
  if (!stops.length) return [];
  const speed = speedKmh && speedKmh > 5 ? speedKmh : FALLBACK_SPEED_KMH;
  const mPerMin = (speed * 1000) / 60;
  let seg = 0, bestD = Infinity, bestT = 0;
  for (let i = 0; i < Math.max(1, stops.length - 1); i++) {
    const b = stops[i + 1] ?? stops[i]!;
    const r = toSegment(p, stops[i]!, b);
    if (r.dist < bestD) { bestD = r.dist; seg = i; bestT = r.t; }
  }
  const out: (number | null)[] = stops.map(() => null);
  const next = bestT >= 0.999 ? seg + 1 : seg + (stops.length === 1 ? 0 : 1);
  let acc = haversineM(p, stops[Math.min(next, stops.length - 1)]!);
  for (let j = next; j < stops.length; j++) {
    if (j > next) acc += haversineM(stops[j - 1]!, stops[j]!);
    out[j] = Math.max(0, Math.round(acc / mPerMin));
  }
  return out;
}

export type CrowdLevel = "low" | "medium" | "high" | "unknown";

/** Average real (non-demo) passenger counts seen within ±1 hour of the given hour. */
export function predictOccupancy(obs: { passenger_count: number; recorded_at: string; is_demo: boolean }[], hour: number, capacity: number) {
  const near = obs.filter((o) => {
    if (o.is_demo) return false;
    const h = new Date(o.recorded_at).getHours();
    return Math.min(Math.abs(h - hour), 24 - Math.abs(h - hour)) <= 1;
  });
  if (near.length < 3 || capacity <= 0) return { level: "unknown" as CrowdLevel, count: null, samples: near.length };
  const count = Math.round(near.reduce((s, o) => s + o.passenger_count, 0) / near.length);
  const ratio = count / capacity;
  const level: CrowdLevel = ratio >= 0.85 ? "high" : ratio >= 0.5 ? "medium" : "low";
  return { level, count, samples: near.length };
}
