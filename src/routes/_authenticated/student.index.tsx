import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bus, MapPin, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { busesQuery } from "@/lib/data";
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
      const { data } = await supabase.from("students").select("*, routes:default_route_id(id, code, name), route_stops:default_stop_id(name)").eq("profile_id", user!.id).maybeSingle();
      return data;
    },
  });
  const buses = useQuery(busesQuery);
  if (me.isLoading || buses.isLoading) return <Loading />;
  const myRoute = me.data?.routes;
  const myBuses = (buses.data ?? []).filter((b) => myRoute && b.route_id === myRoute.id);

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

      <h3 className="mt-8 mb-3 font-semibold">Buses on my route</h3>
      {myBuses.length === 0 ? (
        <EmptyState icon={Bus} title="No buses to show yet" text="Once your route and its buses are set up by the transport office, they'll appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {myBuses.map((b) => (
            <div key={b.id} className="card-surface p-5">
              <div className="flex items-center justify-between">
                <p className="font-display text-lg font-bold">Bus {b.bus_number}</p>
                <div className="flex gap-1.5">{b.is_demo && <DemoBadge />}<StatusPill tone={b.status === "active" ? "success" : "warning"}>{b.status}</StatusPill></div>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Capacity {b.capacity} seats</p>
            </div>
          ))}
        </div>
      )}

      <div className="card-surface mt-8 flex items-start gap-4 p-5">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-teal" />
        <p className="text-sm text-muted-foreground">Live tracking, ETA and occupancy predictions are coming in the next phase. Nothing shown here is a live prediction yet.</p>
      </div>
    </div>
  );
}
