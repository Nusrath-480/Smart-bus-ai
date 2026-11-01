import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Map, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { routesQuery, stopsQuery } from "@/lib/data";
import { EmptyState, Loading, PageTitle, RoleGate } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/student/routes")({
  head: () => ({ meta: [{ title: "Routes and stops — SmartBus-AI" }, { name: "description", content: "Choose a campus bus route and boarding stop." }, { property: "og:title", content: "Routes and stops — SmartBus-AI" }, { property: "og:description", content: "Choose a campus bus route and boarding stop." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: () => <RoleGate allow={["student", "admin"]}><StudentRoutes /></RoleGate>,
});

function StudentRoutes() {
  const routes = useQuery(routesQuery);
  const [open, setOpen] = useState<string | null>(null);
  if (routes.isLoading) return <Loading />;
  const active = (routes.data ?? []).filter((r) => r.is_active);
  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title="Routes & stops" subtitle="Pick your route and boarding stop." />
      {active.length === 0 ? (
        <EmptyState icon={Map} title="No routes yet" text="The transport office hasn't published any routes." />
      ) : (
        <div className="space-y-3">
          {active.map((r) => (
            <div key={r.id} className="card-surface overflow-hidden">
              <button className="flex w-full items-center justify-between p-5 text-left" onClick={() => setOpen(open === r.id ? null : r.id)}>
                <div>
                  <p className="font-semibold">{r.code} · {r.name}</p>
                  <p className="text-sm text-muted-foreground">{r.route_stops?.[0]?.count ?? 0} stops</p>
                </div>
                <span className="text-sm font-medium text-teal">{open === r.id ? "Hide" : "View stops"}</span>
              </button>
              {open === r.id && <Stops routeId={r.id} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stops({ routeId }: { routeId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const stops = useQuery(stopsQuery(routeId));
  const pick = useMutation({
    mutationFn: async (stopId: string) => {
      const { error } = await supabase.from("students").update({ default_route_id: routeId, default_stop_id: stopId }).eq("profile_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Saved as your route"); qc.invalidateQueries({ queryKey: ["student-me"] }); },
    onError: (e) => toast.error(e.message),
  });
  if (stops.isLoading) return <Loading />;
  if (!stops.data?.length) return <p className="border-t border-border px-5 py-4 text-sm text-muted-foreground">No stops added yet.</p>;
  return (
    <ol className="border-t border-border px-5 py-3">
      {stops.data.map((s, i) => (
        <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
          <div className="flex items-center gap-3">
            <span className={cn("grid h-7 w-7 place-items-center rounded-full text-xs font-bold", i === 0 ? "bg-gold text-gold-foreground" : "bg-teal-soft text-teal")}>{s.sequence}</span>
            <span className="text-sm"><MapPin className="mr-1 inline h-3.5 w-3.5 text-muted-foreground" />{s.name}</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => pick.mutate(s.id)} disabled={pick.isPending}>Board here</Button>
        </li>
      ))}
    </ol>
  );
}
