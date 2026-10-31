import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bus, CalendarClock, Route as RouteIcon, ShieldAlert, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Loading, PageTitle } from "@/components/app/ui";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

async function count(table: "buses" | "routes" | "drivers" | "students" | "schedules", filter?: (q: any) => any) {
  let q = supabase.from(table).select("id", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count: c } = await q;
  return c ?? 0;
}

function AdminHome() {
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [buses, active, routes, drivers, students, schedules, incidents] = await Promise.all([
        count("buses"), count("buses", (q) => q.eq("status", "active")), count("routes"), count("drivers"), count("students"), count("schedules"),
        supabase.from("incidents").select("id", { count: "exact", head: true }).eq("status", "open").then((r) => r.count ?? 0),
      ]);
      return { buses, active, routes, drivers, students, schedules, incidents };
    },
  });
  if (stats.isLoading || !stats.data) return <Loading />;
  const s = stats.data;
  const cards = [
    { label: "Buses", value: s.buses, sub: `${s.active} active`, icon: Bus, to: "/admin/buses" },
    { label: "Routes", value: s.routes, icon: RouteIcon, to: "/admin/routes" },
    { label: "Schedules", value: s.schedules, icon: CalendarClock, to: "/admin/schedules" },
    { label: "Drivers", value: s.drivers, sub: `${s.students} students`, icon: Users, to: "/admin/users" },
    { label: "Open incidents", value: s.incidents, icon: ShieldAlert, to: "/admin/incidents" },
  ] as const;
  return (
    <div>
      <PageTitle title="Fleet overview" subtitle="Manage your college transport." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="card-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift">
            <c.icon className="h-5 w-5 text-teal" />
            <p className="mt-3 font-display text-3xl font-bold">{c.value}</p>
            <p className="text-sm text-muted-foreground">{c.label}{"sub" in c && c.sub ? ` · ${c.sub}` : ""}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
