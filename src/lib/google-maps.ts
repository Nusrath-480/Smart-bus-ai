/* Loads the Google Maps JavaScript API once (browser only). */
declare global {
  interface Window {
    google?: any;
    __smartbusMapsReady?: () => void;
  }
}

let loader: Promise<any> | null = null;

export function loadGoogleMaps(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("Maps can only load in the browser"));
  if (window.google?.maps?.Map) return Promise.resolve(window.google);
  if (loader) return loader;
  const env = import.meta.env as Record<string, string | undefined>;
  const key = env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"];
  const channel = env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"] ?? "";
  if (!key) return Promise.reject(new Error("Map key is not configured"));
  loader = new Promise((resolve, reject) => {
    window.__smartbusMapsReady = () => resolve(window.google);
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&callback=__smartbusMapsReady&channel=${encodeURIComponent(channel)}`;
    s.async = true;
    s.onerror = () => { loader = null; reject(new Error("Could not load the map")); };
    document.head.appendChild(s);
  });
  return loader;
}
