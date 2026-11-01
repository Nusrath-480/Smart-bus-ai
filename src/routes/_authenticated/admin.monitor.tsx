import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { FlaskConical, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { busesQuery } from "@/lib/data";
import { isStale, useLiveLocations } from "@/lib/live";
import { pointAlong } from "@/lib/demo-sim";
import { BusMap } from "@/components/app/bus-map";
import { DemoBadge, Loading, PageTitle, StatusPill } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/monitor")({
  head: () => ({ meta: [{ title: "Fleet monitor — SmartBus-AI" }, { name: "description", content: "View bus positions and labelled DEMO simulations." }, { property: "og:title", content: "Fleet monitor — SmartBus-AI" }, { property: "og:description", content: "View bus positions and labelled DEMO simulations." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Monitor });

function Monitor() {
  const buses = useQuery(busesQuery);
  const list = (buses.data ?? []).filter((b) => b.status !== "inactive");
  const live = useLiveLocations(list.map((b) => b.id));
  if (buses.isLoading) return <Loading />;
  const liveCount = list.filter((b) => live[b.id] && !isStale(live[b.id]!.recorded_at)).length;

  return (
    <div>
      <PageTitle title="Fleet monitor" subtitle={`${liveCount} of ${list.length} buses sharing location now`} />
      <BusMap className="h-[420px]" stops={[]} buses={list.map((b) => ({ id: b.id, label: b.bus_number, location: live[b.id] }))} />
      <div className="mt-5 grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="card-surface divide-y divide-border">
          {list.map((b) => {
            const loc = live[b.id];
            const on = loc && !isStale(loc.recorded_at);
            return (
              <Link key={b.id} to="/student/bus/$busId" params={{ busId: b.id }} className="flex items-center justify-between gap-3 p-4 hover:bg-muted/50">
                <div>
                  <p className="font-semibold">Bus {b.bus_number} {loc?.is_demo && <DemoBadge />}</p>
                  <p className="text-sm text-muted-foreground">{b.routes ? `${b.routes.code} · ${b.routes.name}` : "No route"} · {loc ? `seen ${formatDistanceToNow(new Date(loc.recorded_at), { addSuffix: true })}` : "never seen"}</p>
                </div>
                <div className="flex items-center gap-2">
                  {on && loc?.speed_kmh != null && <span className="text-sm text-muted-foreground">{Math.round(loc.speed_kmh)} km/h</span>}
                  <StatusPill tone={on ? "teal" : "muted"}>{on ? "live" : "offline"}</StatusPill>
                </div>
              </Link>
            );
          })}
          {!list.length && <p className="p-5 text-sm text-muted-foreground">No active buses.</p>}
        </div>
        <DemoSimulator buses={list.map((b) => ({ id: b.id, label: b.bus_number, route_id: b.route_id }))} />
      </div>
    </div>
  );
}

function DemoSimulator({ buses }: { buses: { id: string; label: string; route_id: string | null }[] }) {
  const [busId, setBusId] = useState("");
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  async function start() {
    const bus = buses.find((b) => b.id === busId);
    if (!bus?.route_id) { toast.error("Pick a bus that has a route"); return; }
    const { data: stops } = await supabase.from("route_stops").select("latitude, longitude").eq("route_id", bus.route_id).order("sequence");
    const pts = (stops ?? []).filter((s) => s.latitude != null && s.longitude != null).map((s) => ({ lat: s.latitude!, lng: s.longitude! }));
    if (pts.length < 2) { toast.error("That route needs at least 2 stops with coordinates"); return; }
    let t = 0;
    setRunning(true);
    const tick = async () => {
      const p = pointAlong(pts, t);
      if (p) await supabase.from("bus_locations").insert({ bus_id: busId, latitude: p.lat, longitude: p.lng, speed_kmh: 28, is_demo: true });
      t += 0.02;
      if (t > 1) stop();
    };
    await tick();
    timer.current = setInterval(tick, 3000);
  }
  function stop() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRunning(false);
  }

  return (
    <div className="card-surface h-fit p-5">
      <h3 className="flex items-center gap-2 font-semibold"><FlaskConical className="h-4 w-4 text-teal" /> Demo mode <DemoBadge /></h3>
      <p className="mt-1 text-sm text-muted-foreground">Move a bus along its route with simulated positions to test the app. These positions are labelled DEMO everywhere.</p>
      <Select value={busId} onValueChange={setBusId} disabled={running}>
        <SelectTrigger className="mt-3"><SelectValue placeholder="Choose bus" /></SelectTrigger>
        <SelectContent>{buses.map((b) => <SelectItem key={b.id} value={b.id}>Bus {b.label}</SelectItem>)}</SelectContent>
      </Select>
      {running
        ? <Button variant="outline" className="mt-3 w-full" onClick={stop}><Square /> Stop simulation</Button>
        : <Button variant="teal" className="mt-3 w-full" onClick={start} disabled={!busId}>Start simulation</Button>}
      {running && <p className="mt-2 text-xs text-muted-foreground">Running — keep this page open.</p>}
    </div>
  );
}
