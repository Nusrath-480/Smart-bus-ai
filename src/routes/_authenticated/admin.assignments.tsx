import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, UserCog, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { busesQuery, driversQuery, routesQuery } from "@/lib/data";
import { EmptyState, Loading, PageTitle } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/assignments")({ component: Assignments });

function Assignments() {
  const qc = useQueryClient();
  const buses = useQuery(busesQuery);
  const drivers = useQuery(driversQuery);
  const routes = useQuery(routesQuery);
  const list = useQuery({
    queryKey: ["assignments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bus_assignments")
        .select("*, buses(bus_number), routes(code, name), drivers(profiles(full_name, email))").eq("is_active", true).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const [form, setForm] = useState({ bus_id: "", driver_id: "", route_id: "none" });

  const add = useMutation({
    mutationFn: async () => {
      if (!form.bus_id || !form.driver_id) throw new Error("Choose a bus and a driver");
      const { error } = await supabase.from("bus_assignments").insert({ bus_id: form.bus_id, driver_id: form.driver_id, route_id: form.route_id === "none" ? null : form.route_id });
      if (error) throw new Error(error.code === "23505" ? "That bus already has an active driver. End it first." : error.message);
    },
    onSuccess: () => { toast.success("Driver assigned"); qc.invalidateQueries({ queryKey: ["assignments"] }); },
    onError: (e) => toast.error(e.message),
  });
  const end = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bus_assignments").update({ is_active: false, end_date: new Date().toISOString().slice(0, 10) }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments"] }),
  });

  if (list.isLoading) return <Loading />;
  return (
    <div>
      <PageTitle title="Driver assignments" subtitle="One active driver per bus." />
      <div className="card-surface mb-6 grid gap-3 p-5 md:grid-cols-4">
        <div className="space-y-1.5"><Label>Bus</Label>
          <Select value={form.bus_id} onValueChange={(v) => setForm({ ...form, bus_id: v, route_id: buses.data?.find((b) => b.id === v)?.route_id ?? form.route_id })}>
            <SelectTrigger><SelectValue placeholder="Choose bus" /></SelectTrigger>
            <SelectContent>{buses.data?.map((b) => <SelectItem key={b.id} value={b.id}>Bus {b.bus_number}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Driver</Label>
          <Select value={form.driver_id} onValueChange={(v) => setForm({ ...form, driver_id: v })}>
            <SelectTrigger><SelectValue placeholder={drivers.data?.length ? "Choose driver" : "No drivers yet"} /></SelectTrigger>
            <SelectContent>{drivers.data?.map((d) => <SelectItem key={d.id} value={d.id}>{d.profiles?.full_name || d.profiles?.email}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Route</Label>
          <Select value={form.route_id ?? "none"} onValueChange={(v) => setForm({ ...form, route_id: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="none">None</SelectItem>{routes.data?.map((r) => <SelectItem key={r.id} value={r.id}>{r.code} · {r.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex items-end"><Button variant="gold" className="w-full" onClick={() => add.mutate()} disabled={add.isPending}><Plus /> Assign</Button></div>
      </div>
      {!list.data?.length ? (
        <EmptyState icon={UserCog} title="No active assignments" text="Make a user a driver on the Users page, then assign them here." />
      ) : (
        <div className="card-surface divide-y divide-border">
          {list.data.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">Bus {a.buses?.bus_number} → {a.drivers?.profiles?.full_name || a.drivers?.profiles?.email}</p>
                <p className="text-sm text-muted-foreground">{a.routes ? `${a.routes.code} · ${a.routes.name}` : "No route"} · since {a.start_date}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => end.mutate(a.id)}><X /> End</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
