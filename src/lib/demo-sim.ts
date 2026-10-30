/** Linear interpolation along a polyline of stops; t in [0,1]. Used only for clearly-labelled DEMO movement. */
export function pointAlong(points: { lat: number; lng: number }[], t: number) {
  if (points.length === 0) return null;
  if (points.length === 1) return points[0]!;
  const clamped = Math.min(1, Math.max(0, t));
  const seg = clamped * (points.length - 1);
  const i = Math.min(Math.floor(seg), points.length - 2);
  const f = seg - i;
  const a = points[i]!, b = points[i + 1]!;
  return { lat: a.lat + (b.lat - a.lat) * f, lng: a.lng + (b.lng - a.lng) * f };
}
