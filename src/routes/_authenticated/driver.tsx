import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bus, Gauge } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { EmptyState, Loading, PageTitle, RoleGate } from "@/components/app/ui";

export const Route = createFileRoute("/_authenticated/driver")({
  head: () => ({ meta: [{ title: "Driver dashboard — SmartBus-AI" }, { name: "robots", content: "noindex" }] }),
  component: () => <RoleGate allow={["driver", "admin"]}><DriverHome /></RoleGate>,
});

function DriverHome() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["driver-assignment", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: d } = await supabase.from("drivers").select("id").eq("profile_id", user!.id).maybeSingle();
      if (!d) return null;
      const { data } = await supabase.from("bus_assignments").select("*, buses(bus_number, capacity), routes(code, name)").eq("driver_id", d.id).eq("is_active", true).maybeSingle();
      return data;
    },
  });
  if (q.isLoading) return <Loading />;
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title="Driver dashboard" subtitle="Your assigned bus and route." />
      {!q.data ? (
        <EmptyState icon={Bus} title="No active assignment" text="The transport office will assign you a bus and route." />
      ) : (
        <div className="bg-gradient-navy rounded-3xl p-6 text-primary-foreground">
          <p className="text-xs uppercase tracking-wider text-gold">Assigned bus</p>
          <h2 className="mt-1 text-3xl font-bold">Bus {q.data.buses?.bus_number}</h2>
          <p className="mt-1 text-primary-foreground/70">{q.data.routes ? `${q.data.routes.code} · ${q.data.routes.name}` : "No route set"} · {q.data.buses?.capacity} seats</p>
          <p className="mt-6 flex items-center gap-2 text-sm text-primary-foreground/70"><Gauge className="h-4 w-4" /> Trip start, GPS sharing and emergency reporting arrive in the next phase.</p>
        </div>
      )}
    </div>
  );
}
