import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LiveLocation = {
  bus_id: string;
  latitude: number;
  longitude: number;
  speed_kmh: number | null;
  is_demo: boolean;
  recorded_at: string;
};

/** A location older than this is shown as "last seen" instead of live. */
export const STALE_AFTER_MS = 2 * 60 * 1000;

export function isStale(recordedAt: string, now = Date.now()) {
  return now - new Date(recordedAt).getTime() > STALE_AFTER_MS;
}

/** Latest known position per bus, kept fresh with realtime inserts. */
export function useLiveLocations(busIds: string[]) {
  const qc = useQueryClient();
  const key = ["live-locations", [...busIds].sort().join(",")];
  const q = useQuery({
    queryKey: key,
    enabled: busIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bus_locations")
        .select("bus_id, latitude, longitude, speed_kmh, is_demo, recorded_at")
        .in("bus_id", busIds)
        .gte("recorded_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
        .order("recorded_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      const latest: Record<string, LiveLocation> = {};
      for (const row of data ?? []) if (!latest[row.bus_id]) latest[row.bus_id] = row;
      return latest;
    },
  });

  useEffect(() => {
    if (!busIds.length) return;
    const ids = new Set(busIds);
    const channel = supabase
      .channel(`bus-locations-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bus_locations" }, (payload) => {
        const row = payload.new as LiveLocation;
        if (!ids.has(row.bus_id)) return;
        qc.setQueryData<Record<string, LiveLocation>>(key, (old) => ({ ...(old ?? {}), [row.bus_id]: row }));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key[1]]);

  return q.data ?? {};
}
