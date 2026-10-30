/** Minimum gap between GPS uploads from the driver's phone. */
export const GPS_MIN_INTERVAL_MS = 10_000;

export function shouldSendLocation(lastSentAt: number | null, now: number, minIntervalMs = GPS_MIN_INTERVAL_MS) {
  return lastSentAt === null || now - lastSentAt >= minIntervalMs;
}

/** Geolocation speed is metres/second; store km/h. */
export function toKmh(speedMs: number | null | undefined) {
  return speedMs == null || Number.isNaN(speedMs) ? null : Math.round(speedMs * 3.6 * 10) / 10;
}
