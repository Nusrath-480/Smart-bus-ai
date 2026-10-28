import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Bus, ChevronRight, MapPin, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { busesQuery, stopsQuery } from "@/lib/data";
import { isStale, useLiveLocations } from "@/lib/live";
import { BusMap } from "@/components/app/bus-map";
import { DemoBadge, EmptyState, Loading, PageTitle, RoleGate, StatusPill } from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/student/")({
  head: () => ({ meta: [{ title: "Student dashboard — SmartBus-AI" }, { name: "robots", content: "noindex" }] }),
  component: () => <RoleGate allow={["student", "admin"]}><StudentHome /></RoleGate>,
});

function StudentHome() {
  const { user } = useAuth();
  const me = useQuery({
    queryKey: ["student-me", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("students").select("*, routes:default_route_id(id, code, name), route_stops:default_stop_id(id, name)").eq("profile_id", user!.id).maybeSingle();
      return data;
    },
  });
  const buses = useQuery(busesQuery);
  const myRoute = me.data?.routes;
  const stops = useQuery({ ...stopsQuery(myRoute?.id ?? ""), enabled: !!myRoute });
  const myBuses = (buses.data ?? []).filter((b) => myRoute && b.route_id === myRoute.id && b.status !== "inactive");
  const live = useLiveLocations(myBuses.map((b) => b.id));

  if (me.isLoading || buses.isLoading) return <Loading />;

  return (
    <div className="mx-auto max-w-4xl">
      <PageTitle title="Good to see you 👋" subtitle="Your Journey. Made Smarter." />
      <div className="bg-gradient-navy rounded-3xl p-6 text-primary-foreground">
        <p className="text-xs uppercase tracking-wider text-gold">My route</p>
        {myRoute ? (
          <>
            <h2 className="mt-1 text-2xl font-bold">{myRoute.code} · {myRoute.name}</h2>
            <p className="mt-1 flex items-center gap-1 text-sm text-primary-foreground/70"><MapPin className="h-4 w-4" /> {me.data?.route_stops?.name ?? "No stop selected"}</p>
          </>
        ) : (
          <p className="mt-2 text-primary-foreground/80">You haven't picked your route yet.</p>
        )}
        <Button variant="gold" className="mt-4" asChild><Link to="/student/routes">{myRoute ? "Change route" : "Choose my route"}</Link></Button>
      </div>

      {myRoute && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Live map</h3>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal"><span className="live-dot h-2 w-2 rounded-full bg-teal" /> Updates automatically</span>
          </div>
          <BusMap
            stops={stops.data ?? []}
            buses={myBuses.map((b) => ({ id: b.id, label: b.bus_number, location: live[b.id] }))}
            highlightStopId={me.data?.route_stops?.id}
          />
        </div>
      )}

      <h3 className="mt-8 mb-3 font-semibold">Buses on my route</h3>
      {myBuses.length === 0 ? (
        <EmptyState icon={Bus} title="No buses to show yet" text="Once your route and its buses are set up by the transport office, they'll appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {myBuses.map((b) => {
            const loc = live[b.id];
            const stale = loc ? isStale(loc.recorded_at) : true;
            return (
              <Link key={b.id} to="/student/bus/$busId" params={{ busId: b.id }} className="card-surface block p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift">
                <div className="flex items-center justify-between">
                  <p className="font-display text-lg font-bold">Bus {b.bus_number}</p>
                  <div className="flex items-center gap-1.5">
                    {(b.is_demo || loc?.is_demo) && <DemoBadge />}
                    {loc && !stale ? <StatusPill tone="teal">live</StatusPill> : <StatusPill tone="muted">offline</StatusPill>}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {loc ? `Location updated ${formatDistanceToNow(new Date(loc.recorded_at), { addSuffix: true })}` : "No location shared yet"} · {b.capacity} seats
                </p>
              </Link>
            );
          })}
        </div>
      )}

      <div className="card-surface mt-8 flex items-start gap-4 p-5">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-teal" />
        <p className="text-sm text-muted-foreground">Arrival time and crowding predictions arrive in a later phase. Times shown today are from the timetable, not predictions.</p>
      </div>
    </div>
  );
}
