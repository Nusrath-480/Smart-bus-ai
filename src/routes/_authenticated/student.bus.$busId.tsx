import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Bus, Clock, Gauge, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { stopsQuery } from "@/lib/data";
import { isStale, useLiveLocations } from "@/lib/live";
import { etaMinutes, isOffRoute, predictOccupancy } from "@/lib/predict";
import { AlertTriangle, Users } from "lucide-react";
import { BusMap } from "@/components/app/bus-map";
import { DemoBadge, EmptyState, Loading, RoleGate, StatusPill } from "@/components/app/ui";

export const Route = createFileRoute("/_authenticated/student/bus/$busId")({
  head: () => ({ meta: [{ title: "Bus details — SmartBus-AI" }, { name: "description", content: "View bus positions, stops, timetable and arrival estimates." }, { property: "og:title", content: "Bus details — SmartBus-AI" }, { property: "og:description", content: "View bus positions, stops, timetable and arrival estimates." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: () => <RoleGate allow={["student", "admin", "driver"]}><BusDetail /></RoleGate>,
});

function addMinutes(time: string, mins: number) {
  const [h, m] = time.split(":").map(Number);
  const t = (h ?? 0) * 60 + (m ?? 0) + mins;
  return `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

function BusDetail() {
  const { busId } = Route.useParams();
  const bus = useQuery({
    queryKey: ["bus", busId],
    queryFn: async () => (await supabase.from("buses").select("*, routes(id, code, name)").eq("id", busId).maybeSingle()).data,
  });
  const routeId = bus.data?.route_id ?? "";
  const stops = useQuery({ ...stopsQuery(routeId), enabled: !!routeId });
  const schedules = useQuery({
    queryKey: ["bus-schedules", busId],
    queryFn: async () => (await supabase.from("schedules").select("*").eq("bus_id", busId).eq("is_active", true).order("departure_time")).data ?? [],
  });
  const obs = useQuery({
    queryKey: ["occ-obs", busId],
    queryFn: async () => (await supabase.from("occupancy_observations").select("passenger_count, recorded_at, is_demo").eq("bus_id", busId).eq("is_demo", false).gte("recorded_at", new Date(Date.now() - 30 * 864e5).toISOString()).limit(1000)).data ?? [],
  });
  const others = useQuery({
    queryKey: ["route-buses", routeId],
    enabled: !!routeId,
    queryFn: async () => (await supabase.from("buses").select("id, bus_number, capacity").eq("route_id", routeId).neq("id", busId)).data ?? [],
  });
  const live = useLiveLocations([busId]);
  const loc = live[busId];

  if (bus.isLoading) return <Loading />;
  if (!bus.data) return <EmptyState icon={Bus} title="Bus not found" />;
  const b = bus.data;
  const stale = loc ? isStale(loc.recorded_at) : true;
  const today = new Date().getDay();
  const geo = (stops.data ?? []).filter((s) => s.latitude != null && s.longitude != null);
  const pts = geo.map((s) => ({ lat: s.latitude!, lng: s.longitude! }));
  const here = loc && !stale ? { lat: loc.latitude, lng: loc.longitude } : null;
  const etas = here && pts.length ? etaMinutes(here, pts, loc!.speed_kmh) : [];
  const etaById: Record<string, number | null> = {};
  geo.forEach((s, i) => { etaById[s.id] = etas[i] ?? null; });
  const offRoute = here && pts.length >= 2 ? isOffRoute(here, pts) : false;
  const crowd = predictOccupancy(obs.data ?? [], new Date().getHours(), b.capacity);
  const nextSchedule = schedules.data?.find((s) => s.days_of_week.includes(today));

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/student" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Back</Link>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Bus {b.bus_number}</h1>
          <p className="text-sm text-muted-foreground">{b.routes ? `${b.routes.code} · ${b.routes.name}` : "No route assigned"}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {(b.is_demo || loc?.is_demo) && <DemoBadge />}
          {loc && !stale ? <StatusPill tone="teal">live</StatusPill> : <StatusPill tone="muted">offline</StatusPill>}
          <StatusPill tone={b.status === "active" ? "success" : "warning"}>{b.status}</StatusPill>
        </div>
      </div>

      <BusMap className="h-72 md:h-96" stops={stops.data ?? []} buses={[{ id: b.id, label: b.bus_number, location: loc }]} />

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Stat icon={Clock} label="Last update" value={loc ? formatDistanceToNow(new Date(loc.recorded_at), { addSuffix: true }) : "Not shared yet"} />
        <Stat icon={Gauge} label="Speed" value={loc?.speed_kmh != null && !stale ? `${Math.round(loc.speed_kmh)} km/h` : "—"} />
        <Stat icon={Bus} label="Capacity" value={`${b.capacity} seats`} />
      </div>

      {offRoute && (
        <div className="mt-5 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" /> This bus appears to be off its usual route (detour). Arrival estimates may be inaccurate.
        </div>
      )}
      <div className="card-surface mt-5 p-5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 font-semibold"><Users className="h-4 w-4 text-teal" /> Expected crowding now</h3>
          <StatusPill tone="muted">Estimate</StatusPill>
        </div>
        {crowd.level === "unknown" ? (
          <p className="mt-2 text-sm text-muted-foreground">Not enough real passenger counts yet to estimate crowding for this time of day.</p>
        ) : (
          <p className="mt-2 text-sm">
            <span className="font-semibold capitalize">{crowd.level}</span> — about {crowd.count} of {b.capacity} seats, based on {crowd.samples} past counts around this hour.
          </p>
        )}
        {crowd.level === "high" && !!others.data?.length && (
          <p className="mt-2 text-sm text-muted-foreground">
            Try another bus on this route:{" "}
            {others.data.map((o, i) => (
              <span key={o.id}>{i > 0 && ", "}<Link to="/student/bus/$busId" params={{ busId: o.id }} className="font-medium text-teal hover:underline">Bus {o.bus_number}</Link></span>
            ))}
          </p>
        )}
      </div>

      <div className="card-surface mt-6 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Stops</h3>
          <span className="text-xs text-muted-foreground">{nextSchedule ? `Timetable · departs ${nextSchedule.departure_time.slice(0, 5)}` : "No timetable today"}</span>
        </div>
        {!stops.data?.length ? (
          <p className="mt-3 text-sm text-muted-foreground">No stops on this route yet.</p>
        ) : (
          <ol className="mt-4 space-y-0">
            {stops.data.map((s, i) => (
              <li key={s.id} className="relative flex items-center gap-4 pb-5 last:pb-0">
                {i < stops.data.length - 1 && <span className="absolute left-[13px] top-7 h-full w-0.5 bg-teal-soft" />}
                <span className="z-10 grid h-7 w-7 place-items-center rounded-full bg-teal-soft text-xs font-bold text-teal">{s.sequence}</span>
                <span className="flex-1 text-sm"><MapPin className="mr-1 inline h-3.5 w-3.5 text-muted-foreground" />{s.name}</span>
                {etaById[s.id] != null ? (
                  <span className="rounded-full bg-teal-soft px-2 py-0.5 text-xs font-semibold text-teal" title="Estimate from live position and speed">~{etaById[s.id] === 0 ? "now" : `${etaById[s.id]} min`}</span>
                ) : here && etaById[s.id] === null && s.id in etaById ? (
                  <span className="text-xs text-muted-foreground">passed</span>
                ) : null}
                {nextSchedule && s.scheduled_offset_minutes != null && (
                  <span className="text-sm font-medium text-muted-foreground">{addMinutes(nextSchedule.departure_time, s.scheduled_offset_minutes)}</span>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="card-surface p-4">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5 text-teal" /> {label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
