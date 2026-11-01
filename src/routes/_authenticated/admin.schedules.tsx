import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { busesQuery, routesQuery } from "@/lib/data";
import { EmptyState, Loading, PageTitle, StatusPill } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/schedules")({
  head: () => ({ meta: [{ title: "Schedules — SmartBus-AI" }, { name: "description", content: "Manage departure times and operating days." }, { property: "og:title", content: "Schedules — SmartBus-AI" }, { property: "og:description", content: "Manage departure times and operating days." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Schedules });

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Schedules() {
  const qc = useQueryClient();
  const routes = useQuery(routesQuery);
  const buses = useQuery(busesQuery);
  const list = useQuery({
    queryKey: ["schedules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("schedules").select("*, routes(code, name), buses(bus_number)").order("departure_time");
      if (error) throw error;
      return data;
    },
  });
  const [form, setForm] = useState({ route_id: "", bus_id: "none", direction: "to_college", time: "07:30", days: [1, 2, 3, 4, 5, 6] });

  const add = useMutation({
    mutationFn: async () => {
      if (!form.route_id) throw new Error("Choose a route");
      if (!/^\d{2}:\d{2}$/.test(form.time)) throw new Error("Enter a valid time");
      if (!form.days.length) throw new Error("Pick at least one day");
      const { error } = await supabase.from("schedules").insert({
        route_id: form.route_id, bus_id: form.bus_id === "none" ? null : form.bus_id,
        direction: form.direction as "to_college" | "from_college", departure_time: form.time, days_of_week: form.days,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Schedule added"); qc.invalidateQueries({ queryKey: ["schedules"] }); },
    onError: (e) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("schedules").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedules"] }),
  });

  if (list.isLoading) return <Loading />;
  return (
    <div>
      <PageTitle title="Schedules" subtitle="Departure times per route and direction." />
      <div className="card-surface mb-6 grid gap-3 p-5 md:grid-cols-5">
        <div className="space-y-1.5"><Label>Route</Label>
          <Select value={form.route_id} onValueChange={(v) => setForm({ ...form, route_id: v })}>
            <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
            <SelectContent>{routes.data?.map((r) => <SelectItem key={r.id} value={r.id}>{r.code} · {r.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Bus</Label>
          <Select value={form.bus_id} onValueChange={(v) => setForm({ ...form, bus_id: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="none">Unassigned</SelectItem>{buses.data?.map((b) => <SelectItem key={b.id} value={b.id}>Bus {b.bus_number}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Direction</Label>
          <Select value={form.direction} onValueChange={(v) => setForm({ ...form, direction: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="to_college">To college</SelectItem><SelectItem value="from_college">From college</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Departs</Label><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
        <div className="flex items-end"><Button variant="gold" className="w-full" onClick={() => add.mutate()} disabled={add.isPending}><Plus /> Add</Button></div>
        <div className="flex flex-wrap gap-1.5 md:col-span-5">
          {DAYS.map((d, i) => {
            const on = form.days.includes(i);
            return (
              <button key={d} type="button" onClick={() => setForm({ ...form, days: on ? form.days.filter((x) => x !== i) : [...form.days, i].sort() })}
                className={on ? "rounded-lg bg-teal px-3 py-1.5 text-xs font-semibold text-teal-foreground" : "rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground"}>{d}</button>
            );
          })}
        </div>
      </div>
      {!list.data?.length ? (
        <EmptyState icon={CalendarClock} title="No schedules yet" />
      ) : (
        <div className="card-surface divide-y divide-border">
          {list.data.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold"><span className="font-display text-lg">{s.departure_time.slice(0, 5)}</span> · {s.routes?.code} {s.routes?.name}</p>
                <p className="text-sm text-muted-foreground">{s.buses ? `Bus ${s.buses.bus_number}` : "No bus"} · {s.days_of_week.map((d) => DAYS[d]).join(", ")}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill tone="teal">{s.direction === "to_college" ? "to college" : "from college"}</StatusPill>
                <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => remove.mutate(s.id)}><Trash2 className="text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
