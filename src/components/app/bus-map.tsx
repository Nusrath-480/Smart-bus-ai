import { useEffect, useRef, useState } from "react";
import { MapPinOff } from "lucide-react";
import { loadGoogleMaps } from "@/lib/google-maps";
import { isStale, type LiveLocation } from "@/lib/live";

type Stop = { id: string; name: string; latitude: number | null; longitude: number | null; sequence: number };
type BusMarker = { id: string; label: string; location?: LiveLocation };

const NAVY = "#111D3A", GOLD = "#F7C84B", TEAL = "#159B91";

export function BusMap({ stops, buses, highlightStopId, className = "h-80" }: {
  stops: Stop[]; buses: BusMarker[]; highlightStopId?: string | null; className?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const overlays = useRef<any[]>([]);
  const fitted = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !el.current) return;
        map.current = new g.maps.Map(el.current, {
          center: { lat: 20.5937, lng: 78.9629 }, zoom: 5, clickableIcons: false,
          mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
        });
        setReady(true);
      })
      .catch((e) => setError(e.message));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const g = window.google;
    if (!ready || !g || !map.current) return;
    overlays.current.forEach((o) => o.setMap(null));
    overlays.current = [];
    const bounds = new g.maps.LatLngBounds();
    const pts = stops.filter((s) => s.latitude != null && s.longitude != null).map((s) => ({ ...s, pos: { lat: s.latitude!, lng: s.longitude! } }));
    if (pts.length > 1) {
      overlays.current.push(new g.maps.Polyline({ map: map.current, path: pts.map((p) => p.pos), strokeColor: TEAL, strokeWeight: 5, strokeOpacity: 0.85 }));
    }
    pts.forEach((p) => {
      bounds.extend(p.pos);
      const hl = p.id === highlightStopId;
      overlays.current.push(new g.maps.Marker({
        map: map.current, position: p.pos, title: `${p.sequence}. ${p.name}`,
        icon: { path: g.maps.SymbolPath.CIRCLE, scale: hl ? 9 : 6, fillColor: hl ? GOLD : "#FFFFFF", fillOpacity: 1, strokeColor: NAVY, strokeWeight: 3 },
      }));
    });
    buses.forEach((b) => {
      if (!b.location) return;
      const pos = { lat: b.location.latitude, lng: b.location.longitude };
      bounds.extend(pos);
      const stale = isStale(b.location.recorded_at);
      overlays.current.push(new g.maps.Marker({
        map: map.current, position: pos, zIndex: 10,
        title: `${b.label}${b.location.is_demo ? " (DEMO)" : ""}${stale ? " — last seen" : ""}`,
        label: { text: b.label, color: NAVY, fontWeight: "700", fontSize: "11px" },
        icon: { path: g.maps.SymbolPath.CIRCLE, scale: 16, fillColor: stale ? "#CBD5E1" : GOLD, fillOpacity: 1, strokeColor: NAVY, strokeWeight: 2 },
      }));
    });
    if (!bounds.isEmpty() && !fitted.current) {
      map.current.fitBounds(bounds, 48);
      fitted.current = true;
    }
  }, [ready, stops, buses, highlightStopId]);

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center rounded-2xl bg-muted text-center text-sm text-muted-foreground ${className}`}>
        <MapPinOff className="mb-2 h-6 w-6" /> The map couldn't load right now.
      </div>
    );
  }
  return <div ref={el} className={`overflow-hidden rounded-2xl bg-teal-soft ${className}`} />;
}
