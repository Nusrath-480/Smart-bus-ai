import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, Loading, PageTitle } from "@/components/app/ui";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin/reports")({ component: Reports });

function Reports() {
  const [days, setDays] = useState("7");
  const r = useQuery({
    queryKey: ["reports", days],
    queryFn: async () => {
      const since = new Date(Date.now() - Number(days) * 86400_000).toISOString();
      const [trips, incidents, occ, buses] = await Promise.all([
        supabase.from("trips").select("bus_id, status, started_at, ended_at").gte("created_at", since).limit(5000),
        supabase.from("incidents").select("type, bus_id").gte("created_at", since).limit(5000),
        supabase.from("occupancy_observations").select("bus_id, passenger_count").eq("is_demo", false).gte("recorded_at", since).limit(5000),
        supabase.from("buses").select("id, bus_number, capacity"),
      ]);
      const busRows = (buses.data ?? []).map((b) => {
        const t = (trips.data ?? []).filter((x) => x.bus_id === b.id);
        const done = t.filter((x) => x.status === "completed" && x.started_at && x.ended_at);
        const avgMin = done.length ? Math.round(done.reduce((s, x) => s + (Date.parse(x.ended_at!) - Date.parse(x.started_at!)), 0) / done.length / 60000) : null;
        const o = (occ.data ?? []).filter((x) => x.bus_id === b.id);
        const avgOcc = o.length ? Math.round((o.reduce((s, x) => s + x.passenger_count, 0) / o.length / b.capacity) * 100) : null;
        const inc = (incidents.data ?? []).filter((x) => x.bus_id === b.id).length;
        return { ...b, trips: t.length, avgMin, avgOcc, inc };
      });
      const byType: Record<string, number> = {};
      (incidents.data ?? []).forEach((i) => (byType[i.type] = (byType[i.type] ?? 0) + 1));
      return { busRows, totalTrips: trips.data?.length ?? 0, totalIncidents: incidents.data?.length ?? 0, byType };
    },
  });

  return (
    <div>
      <PageTitle title="Reports" subtitle="Trips, crowding and incidents per bus."
        action={<Tabs value={days} onValueChange={setDays}><TabsList><TabsTrigger value="7">7 days</TabsTrigger><TabsTrigger value="30">30 days</TabsTrigger></TabsList></Tabs>} />
      {r.isLoading || !r.data ? <Loading /> : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card-surface p-5"><p className="text-sm text-muted-foreground">Trips</p><p className="font-display text-3xl font-bold">{r.data.totalTrips}</p></div>
            <div className="card-surface p-5"><p className="text-sm text-muted-foreground">Incidents</p><p className="font-display text-3xl font-bold">{r.data.totalIncidents}</p></div>
            <div className="card-surface p-5"><p className="text-sm text-muted-foreground">By type</p>
              <p className="mt-1 text-sm">{Object.entries(r.data.byType).map(([k, v]) => `${k} ${v}`).join(" · ") || "—"}</p></div>
          </div>
          {!r.data.busRows.length ? <div className="mt-6"><EmptyState icon={BarChart3} title="No buses yet" /></div> : (
            <div className="card-surface mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr><th className="p-4">Bus</th><th className="p-4">Trips</th><th className="p-4">Avg trip</th><th className="p-4">Avg occupancy</th><th className="p-4">Incidents</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {r.data.busRows.map((b) => (
                    <tr key={b.id}>
                      <td className="p-4 font-semibold">Bus {b.bus_number}</td>
                      <td className="p-4">{b.trips}</td>
                      <td className="p-4">{b.avgMin != null ? `${b.avgMin} min` : "—"}</td>
                      <td className="p-4">
                        {b.avgOcc != null ? (
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 rounded-full bg-muted"><div className={b.avgOcc >= 90 ? "h-full rounded-full bg-warning" : "h-full rounded-full bg-teal"} style={{ width: `${Math.min(100, b.avgOcc)}%` }} /></div>
                            {b.avgOcc}%
                          </div>
                        ) : "—"}
                      </td>
                      <td className="p-4">{b.inc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">Occupancy uses real driver counts only; DEMO data is excluded.</p>
        </>
      )}
    </div>
  );
}
